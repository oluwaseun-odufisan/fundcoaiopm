import AdminGoal from '../models/adminGoalModel.js';
import User from '../models/adminUserModel.js';
import Reminder from '../models/adminReminderModel.js'; // Static import
import axios from 'axios';
import mongoose from 'mongoose';

// Helper to emit Socket.IO events to user-side server
const emitSocketEvent = async (event, data) => {
    try {
        await axios.post('http://localhost:4001/api/emit', { event, data }, {
            headers: { Authorization: `Bearer ${process.env.ADMIN_JWT_SECRET}` },
        });
    } catch (err) {
        console.error('Error emitting socket event:', err.message);
    }
};

// Helper function to calculate goal progress
const calculateProgress = (goal) => {
    if (!goal.subGoals || goal.subGoals.length === 0) return 0;
    const completed = goal.subGoals.filter((sg) => sg.completed).length;
    return Math.round((completed / goal.subGoals.length) * 100);
};

// Helper function to create or update goal reminder
const createOrUpdateGoalReminder = async (goal, userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const reminderTime = user.preferences?.reminders?.defaultReminderTimes?.goal_deadline || 1440;
        const remindAt = goal.endDate ? new Date(goal.endDate.getTime() - reminderTime * 60 * 1000) : null;

        if (!remindAt) {
            await Reminder.deleteMany({ targetId: goal._id, targetModel: 'Goal', user: userId });
            return;
        }

        let reminder = await Reminder.findOne({ targetId: goal._id, targetModel: 'Goal', user: userId });
        if (reminder) {
            reminder.message = `Goal "${goal.title}" deadline approaching`;
            reminder.remindAt = remindAt;
            reminder.deliveryChannels = {
                inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
                email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true,
                push: user.preferences?.reminders?.defaultDeliveryChannels?.push ?? false,
            };
            reminder.status = 'pending';
            reminder.snoozeUntil = null;
            await reminder.save();
            await emitSocketEvent('reminderUpdated', reminder);
        } else {
            reminder = new Reminder({
                user: userId,
                type: 'goal_deadline',
                targetId: goal._id,
                targetModel: 'Goal',
                message: `Goal "${goal.title}" deadline approaching`,
                deliveryChannels: {
                    inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
                    email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true,
                    push: user.preferences?.reminders?.defaultDeliveryChannels?.push ?? false,
                },
                remindAt,
                createdBy: userId,
                isUserCreated: false,
                isActive: true,
            });
            await reminder.save();
            await emitSocketEvent('newReminder', reminder);
        }
    } catch (err) {
        console.error('Error creating/updating reminder:', err.message);
        throw err; // Let the caller handle the error
    }
};

// Get all goals
export const getAllGoals = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { status, timeframe, ownerEmail } = req.query;
        const query = {};

        if (status) query.status = status;
        if (timeframe) query.timeframe = timeframe;
        if (ownerEmail) {
            const user = await User.findOne({ email: ownerEmail });
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            query.owner = user._id;
        }

        const goals = await AdminGoal.find(query)
            .populate('owner', 'email name')
            .sort({ createdAt: -1 });

        const goalsWithProgress = goals.map((goal) => ({
            ...goal.toObject(),
            progress: calculateProgress(goal),
        }));

        res.json({ success: true, goals: goalsWithProgress });
    } catch (err) {
        console.error('Error fetching goals:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch goals', error: err.message });
    }
};

// Get single goal by ID
export const getGoalById = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid goal ID' });
        }

        const goal = await AdminGoal.findById(id).populate('owner', 'email name');
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        res.json({ success: true, goal: { ...goal.toObject(), progress: calculateProgress(goal) } });
    } catch (err) {
        console.error('Error fetching goal:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch goal', error: err.message });
    }
};

// Create a new goal
export const createGoal = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { title, subGoals, ownerEmail, type, timeframe, startDate, endDate, status, adminNotes } = req.body;
        if (!title || !ownerEmail || !timeframe || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const user = await User.findOne({ email: ownerEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const goal = new AdminGoal({
            title,
            subGoals: subGoals || [],
            type: type || 'personal',
            timeframe,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            owner: user._id,
            status: status || 'approved',
            adminNotes,
        });

        const saved = await goal.save();
        if (goal.endDate) {
            await createOrUpdateGoalReminder(saved, user._id);
        }

        await emitSocketEvent('newGoal', saved);

        res.status(201).json({ success: true, goal: { ...saved.toObject(), progress: calculateProgress(saved) } });
    } catch (err) {
        console.error('Error creating goal:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// Update a goal
export const updateGoal = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid goal ID' });
        }

        const data = { ...req.body };
        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.endDate) data.endDate = new Date(data.endDate);
        if (data.ownerEmail) {
            const user = await User.findOne({ email: data.ownerEmail });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            data.owner = user._id;
            delete data.ownerEmail;
        }

        const goal = await AdminGoal.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        }).populate('owner', 'email name');

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (goal.endDate) {
            await createOrUpdateGoalReminder(goal, goal.owner._id);
        }

        await emitSocketEvent('goalUpdated', goal);

        res.json({ success: true, goal: { ...goal.toObject(), progress: calculateProgress(goal) } });
    } catch (err) {
        console.error('Error updating goal:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// Approve or reject a goal
export const approveOrRejectGoal = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { id } = req.params;
        const { status, adminNotes } = req.body;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid goal ID' });
        }
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const goal = await AdminGoal.findByIdAndUpdate(
            id,
            { status, adminNotes },
            { new: true, runValidators: true }
        ).populate('owner', 'email name');

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        await emitSocketEvent('goalUpdated', goal);

        res.json({ success: true, goal: { ...goal.toObject(), progress: calculateProgress(goal) } });
    } catch (err) {
        console.error('Error approving/rejecting goal:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// Delete a goal
export const deleteGoal = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid goal ID' });
        }

        const goal = await AdminGoal.findByIdAndDelete(id);
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        await Reminder.deleteMany({ targetId: id, targetModel: 'Goal', user: goal.owner });
        await emitSocketEvent('goalDeleted', id);

        res.json({ success: true, message: 'Goal deleted' });
    } catch (err) {
        console.error('Error deleting goal:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Generate goal performance report
export const generateGoalReport = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const goals = await AdminGoal.find({})
            .populate('owner', 'email name')
            .sort({ createdAt: -1 });

        const totalGoals = goals.length;
        const completedGoals = goals.filter((g) => calculateProgress(g) === 100).length;
        const pendingGoals = goals.filter((g) => g.status === 'pending').length;
        const approvedGoals = goals.filter((g) => g.status === 'approved').length;
        const rejectedGoals = goals.filter((g) => g.status === 'rejected').length;
        const overdueGoals = goals.filter((g) => !g.subGoals.every((sg) => sg.completed) && g.endDate < new Date()).length;
        const completionRate = totalGoals > 0 ? (completedGoals / totalGoals * 100).toFixed(2) : 0;

        const report = {
            totalGoals,
            completedGoals,
            pendingGoals,
            approvedGoals,
            rejectedGoals,
            overdueGoals,
            completionRate,
            byUser: goals.reduce((acc, goal) => {
                const email = goal.owner?.email || 'Unassigned';
                acc[email] = acc[email] || { total: 0, completed: 0 };
                acc[email].total += 1;
                if (calculateProgress(goal) === 100) acc[email].completed += 1;
                return acc;
            }, {}),
        };

        res.json({ success: true, report });
    } catch (err) {
        console.error('Error generating goal report:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate report', error: err.message });
    }
};

export default {
    getAllGoals,
    getGoalById,
    createGoal,
    updateGoal,
    approveOrRejectGoal,
    deleteGoal,
    generateGoalReport,
};