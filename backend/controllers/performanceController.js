// controllers/performanceController.js
import User from '../models/userModel.js';
import Task from '../models/taskModel.js';
import Goal from '../models/goalModel.js';
import OpenAI from 'openai';
import {
  calculateUserTotalScore,
  calculateCompletionRate,
  getUserLevel,
  calculateTaskScore,
  calculateGoalScore,
  PRIORITY_WEIGHTS,
} from '../utils/performanceCalculator.js';

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const getLeaderboard = async (req, res) => {
  // unchanged - your original code
  try {
    const users = await User.find({ isActive: true })
      .select('name email role points level badges lastActive')
      .lean();

    const allTasks = await Task.find({})
      .select('owner priority completed submissionStatus checklist')
      .lean();

    const allGoals = await Goal.find({})
      .select('owner subGoals')
      .lean();

    const userMap = {};
    users.forEach(u => {
      const idStr = u._id.toString();
      userMap[idStr] = { ...u, tasks: [], goals: [] };
    });

    allTasks.forEach(t => {
      const uid = t.owner.toString();
      if (userMap[uid]) userMap[uid].tasks.push(t);
    });

    allGoals.forEach(g => {
      const uid = g.owner.toString();
      if (userMap[uid]) userMap[uid].goals.push(g);
    });

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
        completionRate,
        rank: 0,
      };
    });

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
    leaderboard.forEach((user, i) => { user.rank = i + 1; });

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
  // unchanged - your original code
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

const getUserDetails = async (req, res) => {
  // unchanged - your original code (instant stats)
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    const canSeeBonusHistory = requestingUser.id === userId || requestingUser.role === 'admin';

    const [tasks, goals, targetUser] = await Promise.all([
      Task.find({ owner: userId }).select('priority completed submissionStatus checklist').lean(),
      Goal.find({ owner: userId }).select('subGoals').lean(),
      User.findById(userId).select('name role level badges activityLogs').lean(),
    ]);

    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const taskStatsByPriority = { Low: { count: 0, completed: 0, approved: 0, checklistBonusTotal: 0 }, Medium: { count: 0, completed: 0, approved: 0, checklistBonusTotal: 0 }, High: { count: 0, completed: 0, approved: 0, checklistBonusTotal: 0 } };

    let totalTaskPoints = 0, totalChecklistBonus = 0, totalApprovalBonus = 0;

    tasks.forEach(task => {
      if (!task.priority || !taskStatsByPriority[task.priority]) return;
      const stats = taskStatsByPriority[task.priority];
      stats.count++;
      if (task.completed) {
        stats.completed++;
        const score = calculateTaskScore(task);
        totalTaskPoints += score;
        const weight = PRIORITY_WEIGHTS[task.priority] || 10;
        const approval = task.submissionStatus === 'approved' ? 30 : 0;
        const checklistB = task.checklist?.length ? Math.round((task.checklist.filter(c => c.completed).length / task.checklist.length) * 20) : 0;
        totalChecklistBonus += checklistB;
        totalApprovalBonus += approval;
        stats.checklistBonusTotal += checklistB;
      }
    });

    let totalGoalPoints = 0, completedGoals = 0, totalGoals = goals.length;
    goals.forEach(g => {
      const progress = g.subGoals.length ? (g.subGoals.filter(s => s.completed).length / g.subGoals.length) * 100 : 0;
      const points = Math.round(progress);
      totalGoalPoints += points;
      if (progress === 100) completedGoals++;
    });

    const totalScore = totalTaskPoints + totalGoalPoints;
    const completionRate = tasks.length ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;

    res.json({
      success: true,
      user: { name: targetUser.name, role: targetUser.role, level: targetUser.level },
      totalScore,
      taskPoints: totalTaskPoints,
      goalPoints: totalGoalPoints,
      completionRate,
      taskStatsByPriority,
      totalChecklistBonus,
      totalApprovalBonus,
      totalGoals,
      completedGoals,
      bonusHistory: canSeeBonusHistory ? targetUser.activityLogs?.filter(log => log.action === 'bonus_awarded') || [] : [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load user details' });
  }
};

// NEW: Super (AI) Admin Analysis (called asynchronously)
const getUserAIAnalysis = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;
    const isSelfView = requestingUserId === userId;

    // Fetch aggregated stats (same as before)
    const [tasks, goals, targetUser] = await Promise.all([
      Task.find({ owner: userId }).select('priority completed submissionStatus checklist').lean(),
      Goal.find({ owner: userId }).select('subGoals').lean(),
      User.findById(userId).select('name role level').lean(),
    ]);

    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Compute stats
    const taskStatsByPriority = {
      Low: { count: 0, completed: 0 },
      Medium: { count: 0, completed: 0 },
      High: { count: 0, completed: 0 }
    };
    let totalTaskPoints = 0, completedTasks = 0;

    tasks.forEach(t => {
      if (t.priority) {
        taskStatsByPriority[t.priority].count++;
        if (t.completed) {
          taskStatsByPriority[t.priority].completed++;
          completedTasks++;
          totalTaskPoints += calculateTaskScore(t);
        }
      }
    });

    let totalGoalPoints = 0, completedGoals = 0;
    goals.forEach(g => {
      const progress = g.subGoals.length ? (g.subGoals.filter(s => s.completed).length / g.subGoals.length) * 100 : 0;
      totalGoalPoints += Math.round(progress);
      if (progress === 100) completedGoals++;
    });

    const totalScore = totalTaskPoints + totalGoalPoints;
    const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // ── NEW & IMPROVED PROMPT ──
    const systemPrompt = isSelfView
      ? `You are Super (AI) Admin — the company's impartial performance overseer.
You speak directly to the user in second person ("you", "your contribution", "you are helping...").
Based ONLY on the aggregated data below, write a natural, honest note that shows how their work is moving FundCo forward.
Mention impact on company goals (clean energy access, agro-productive use, sustainable housing, rural electrification, etc.) at a high level — never mention specific tasks or clients.
Praise real achievements. Give constructive, actionable suggestions for improvement.
End with a clear statement on bonus readiness.
Be warm, professional, and motivational. No fluff. No lies.`

      : `You are Super (AI) Admin — the company's impartial performance overseer.
You are writing a neutral, professional note about this third-party user.
Use third-person language only: "${targetUser.name}", "they", "the user", "he/she", etc.
Based ONLY on the aggregated data below, show how their work is moving FundCo forward.
Mention impact on company goals (clean energy access, agro-productive use, sustainable housing, rural electrification, etc.) at a high level — never mention specific tasks or clients.
Praise real achievements. Give constructive, actionable suggestions for improvement.
End with a clear statement on bonus readiness.
Be balanced, professional, and fair. No fluff. No lies.`;

    const userDataForAI = `
User: ${targetUser.name} (${targetUser.role})
Total Score: ${totalScore}
Completion Rate: ${completionRate}%
Task Points: ${totalTaskPoints} 
  • High priority completed: ${taskStatsByPriority.High.completed}/${taskStatsByPriority.High.count}
  • Medium priority completed: ${taskStatsByPriority.Medium.completed}/${taskStatsByPriority.Medium.count}
  • Low priority completed: ${taskStatsByPriority.Low.completed}/${taskStatsByPriority.Low.count}
Goal Points: ${totalGoalPoints} (${completedGoals} fully completed goals)
`;

    const response = await openai.chat.completions.create({
      model: 'grok-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userDataForAI }
      ],
      temperature: isSelfView ? 0.65 : 0.5,
      max_tokens: 850,
    });

    let aiNote = response.choices[0].message.content.trim();

    // Optional polish: ensure it starts with the right tone
    if (!aiNote.startsWith(targetUser.name) && !isSelfView) {
      aiNote = `${targetUser.name} has been...` + aiNote;
    }

    res.json({ success: true, aiNote });
  } catch (err) {
    console.error('AI Analysis error:', err);
    res.json({
      success: true,
      aiNote: "Super (AI) Admin is currently reviewing this performance. Insights will appear shortly."
    });
  }
};

const awardBonus = async (req, res) => {
  // unchanged - your original code
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  const { userId, bonusAmount, reason } = req.body;
  if (!userId || !bonusAmount || bonusAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid bonus data' });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newPoints = (user.points || 0) + bonusAmount;
    user.points = newPoints;
    user.activityLogs.push({
      action: 'bonus_awarded',
      details: `Bonus of ${bonusAmount} points awarded. Reason: ${reason || 'No reason provided'}`,
      timestamp: new Date(),
    });
    user.level = getUserLevel(newPoints);
    await user.save();

    if (global.io) global.io.to(`user:${userId}`).emit('bonusAwarded', { points: bonusAmount, reason, newTotal: newPoints });

    res.json({ success: true, message: `Bonus awarded! ${bonusAmount} points added.`, newPoints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Bonus award failed' });
  }
};

export { getLeaderboard, getMyPerformance, getUserDetails, getUserAIAnalysis, awardBonus };