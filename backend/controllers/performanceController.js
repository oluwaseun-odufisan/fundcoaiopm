// controllers/performanceController.js
import User from '../models/userModel.js';
import Task from '../models/taskModel.js';
import Goal from '../models/goalModel.js';
import {
  calculateUserTotalScore,
  calculateCompletionRate,
  getUserLevel,
  getBonusEligibility,
} from '../utils/performanceCalculator.js';

const getLeaderboard = async (req, res) => {
  try {
    // All active users
    const users = await User.find({ isActive: true })
      .select('name email role points level badges lastActive activityLogs')
      .lean();

    // All tasks & goals (populate owner for grouping)
    const allTasks = await Task.find({})
      .select('owner priority completed submissionStatus checklist')
      .lean();

    const allGoals = await Goal.find({})
      .select('owner subGoals')
      .lean();

    // Group data
    const userMap = {};
    users.forEach(u => {
      const idStr = u._id.toString();
      userMap[idStr] = {
        ...u,
        tasks: [],
        goals: [],
      };
    });

    allTasks.forEach(t => {
      const uid = t.owner.toString();
      if (userMap[uid]) userMap[uid].tasks.push(t);
    });

    allGoals.forEach(g => {
      const uid = g.owner.toString();
      if (userMap[uid]) userMap[uid].goals.push(g);
    });

    // Compute scores
    let leaderboard = Object.values(userMap).map(userData => {
      const totalScore = calculateUserTotalScore(userData.tasks, userData.goals);
      const completionRate = calculateCompletionRate(userData.tasks);
      const level = getUserLevel(totalScore);

      return {
        _id: userData._id,
        name: userData.name,
        role: userData.role,
        points: userData.points || 0,
        level,
        badges: userData.badges || [],
        lastActive: userData.lastActive,
        totalScore,
        taskScore: userData.tasks.reduce((sum, t) => sum + (t.completed ? 1 : 0), 0),
        completionRate,
        weightedTasksCompleted: userData.tasks.filter(t => t.completed).length,
        rank: 0, // assigned later
      };
    });

    // Sort + rank
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    leaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    res.json({
      success: true,
      leaderboard: { top3, rest },
      allUsers: leaderboard,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate leaderboard' });
  }
};

const getMyPerformance = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.find({ owner: userId }).lean();
    const goals = await Goal.find({ owner: userId }).lean();

    const totalScore = calculateUserTotalScore(tasks, goals);
    const completionRate = calculateCompletionRate(tasks);
    const level = getUserLevel(totalScore);

    res.json({
      success: true,
      performance: {
        totalScore,
        completionRate,
        level,
        taskCount: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        goalsCount: goals.length,
        badges: (await User.findById(userId).select('badges')).badges || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load performance' });
  }
};

const getUserPerformance = async (req, res) => {
  // Admin / Team-lead only
  if (!['admin', 'team-lead'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    const { userId } = req.params;
    const tasks = await Task.find({ owner: userId }).lean();
    const goals = await Goal.find({ owner: userId }).lean();

    const totalScore = calculateUserTotalScore(tasks, goals);
    const completionRate = calculateCompletionRate(tasks);
    const level = getUserLevel(totalScore);

    res.json({
      success: true,
      performance: {
        totalScore,
        completionRate,
        level,
        taskCount: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load user performance' });
  }
};

const awardBonus = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }

  const { userId, bonusAmount, reason } = req.body;
  if (!userId || !bonusAmount || bonusAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid bonus data' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newPoints = (user.points || 0) + bonusAmount;

    user.points = newPoints;
    user.activityLogs.push({
      action: 'bonus_awarded',
      details: `Bonus of ${bonusAmount} points awarded. Reason: ${reason}`,
      timestamp: new Date(),
    });

    // Optional: auto level update
    user.level = getUserLevel(newPoints); // reuse calculator

    await user.save();

    // Real-time emit to user
    if (global.io) {
      global.io.to(`user:${userId}`).emit('bonusAwarded', { points: bonusAmount, reason, newTotal: newPoints });
    }

    res.json({
      success: true,
      message: `Bonus awarded! ${bonusAmount} points added.`,
      newPoints,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Bonus award failed' });
  }
};

export { getLeaderboard, getMyPerformance, getUserPerformance, awardBonus };