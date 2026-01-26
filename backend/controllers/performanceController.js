// New controllers/performanceController.js
import User from '../models/userModel.js';
import Task from '../models/taskModel.js';
import Goal from '../models/goalModel.js';

export const getUsersPerformance = async (req, res) => {
  try {
    const users = await User.find({}).select('-password -activityLogs -preferences -pushToken');
    
    const performanceData = await Promise.all(users.map(async (u) => {
      const tasks = await Task.find({ owner: u._id });
      const goals = await Goal.find({ owner: u._id });
      
      const completedTasks = tasks.filter(t => t.completed).length;
      const completedGoals = goals.filter(g => calculateGoalProgress(g) === 100).length;
      
      return {
        ...u.toObject(),
        points: u.points,
        level: u.level,
        badges: u.badges,
        completedTasks,
        tasks: tasks.map(t => t.toObject()),  // For detailed view
        goals: goals.map(g => g.toObject()),  // For detailed view
        completedGoals,
      };
    }));
    
    res.json({ success: true, users: performanceData });
  } catch (err) {
    console.error('Error fetching performance:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const redeemPoints = async (req, res) => {
  const { userId, amount } = req.body;
  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (amount > targetUser.points) return res.status(400).json({ success: false, message: 'Insufficient points' });
    
    targetUser.points -= amount;
    targetUser.redemptionHistory.push({ amount, status: 'pending' });
    await targetUser.save();
    
    res.json({ success: true, message: 'Redemption requested' });
  } catch (err) {
    console.error('Error redeeming points:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const calculateGoalProgress = (goal) => {
  if (!goal.subGoals.length) return 0;
  const completed = goal.subGoals.filter(sg => sg.completed).length;
  return (completed / goal.subGoals.length) * 100;
};