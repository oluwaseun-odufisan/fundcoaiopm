import Task from '../models/adminTaskModel.js';
import User from '../models/adminUserModel.js'; // Import user model for reassignment
import Reminder from '../models/adminReminderModel.js'; // Import reminder model for updates
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

// Helper to create or update task reminder
const createOrUpdateTaskReminder = async (task, userId) => {
    if (!task.dueDate) {
        await Reminder.deleteMany({ targetId: task._id, targetModel: 'Task', user: userId });
        return;
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const reminderTime = user.preferences?.reminders?.defaultReminderTimes?.task_due || 60;
    const remindAt = new Date(task.dueDate.getTime() - reminderTime * 60 * 1000);

    let reminder = await Reminder.findOne({ targetId: task._id, targetModel: 'Task', user: userId });
    if (reminder) {
        reminder.message = `Task "${task.title}" is due soon`;
        reminder.remindAt = remindAt;
        reminder.deliveryChannels = {
            inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
            email: true,
            push: user.preferences?.reminders?.defaultDeliveryChannels?.push ?? false,
        };
        reminder.status = 'pending';
        reminder.snoozeUntil = null;
        await reminder.save();
        await emitSocketEvent('reminderUpdated', reminder);
    } else {
        reminder = new Reminder({
            user: userId,
            type: 'task_due',
            targetId: task._id,
            targetModel: 'Task',
            message: `Task "${task.title}" is due soon`,
            deliveryChannels: {
                inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
                email: true,
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
};

// Get all tasks with filters
export const getAllTasks = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { status, priority, dueDate, ownerEmail } = req.query;
        const query = {};

        if (status) query.completed = status === 'completed' ? true : false;
        if (priority) query.priority = priority;
        if (dueDate) {
            const start = new Date(dueDate);
            const end = new Date(dueDate);
            end.setDate(end.getDate() + 1);
            query.dueDate = { $gte: start, $lt: end };
        }
        if (ownerEmail) {
            const user = await User.findOne({ email: ownerEmail });
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            query.owner = user._id;
        }

        const tasks = await Task.find(query)
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, tasks });
    } catch (err) {
        console.error('Error fetching tasks:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: err.message });
    }
};

// Create a task for a user
export const createTask = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { title, description, priority, dueDate, ownerEmail, completed } = req.body;
        if (!ownerEmail) {
            return res.status(400).json({ success: false, message: 'Owner email is required' });
        }

        const user = await User.findOne({ email: ownerEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const task = new Task({
            title: title || 'Untitled Task',
            description: description || '',
            priority: priority || 'Low',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            owner: user._id,
            completed: completed === true || completed === 'true',
        });

        const saved = await task.save();
        if (task.dueDate) {
            await createOrUpdateTaskReminder(saved, user._id);
        }

        await emitSocketEvent('newTask', saved);

        res.status(201).json(saved);
    } catch (err) {
        console.error('Error creating task:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// Update a task
export const updateTask = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }

        const data = { ...req.body };
        if (data.completed !== undefined) {
            data.completed = data.completed === true || data.completed === 'true';
        }
        if (data.dueDate) {
            data.dueDate = new Date(data.dueDate);
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const updatedTask = await Task.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        }).populate('owner', 'email');

        if (updatedTask.dueDate) {
            await createOrUpdateTaskReminder(updatedTask, updatedTask.owner._id);
        }

        await emitSocketEvent('updateTask', updatedTask);

        res.json({ success: true, task: updatedTask });
    } catch (err) {
        console.error('Error updating task:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// Delete a task
export const deleteTask = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }

        const task = await Task.findByIdAndDelete(id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await Reminder.deleteMany({ targetId: id, targetModel: 'Task', user: task.owner });
        await emitSocketEvent('deleteTask', id);

        res.json({ success: true, message: 'Task deleted' });
    } catch (err) {
        console.error('Error deleting task:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Reassign a task to another user
export const reassignTask = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const { id } = req.params;
        const { ownerEmail } = req.body;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }
        if (!ownerEmail) {
            return res.status(400).json({ success: false, message: 'Owner email is required' });
        }

        const user = await User.findOne({ email: ownerEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        task.owner = user._id;
        const updatedTask = await task.save();

        if (updatedTask.dueDate) {
            await createOrUpdateTaskReminder(updatedTask, user._id);
        }

        await emitSocketEvent('updateTask', updatedTask);

        res.json({ success: true, task: updatedTask });
    } catch (err) {
        console.error('Error reassigning task:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// Generate task reports
export const generateTaskReport = async (req, res) => {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Super-admin role required' });
        }

        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ completed: true });
        const overdueTasks = await Task.countDocuments({
            dueDate: { $lt: new Date() },
            completed: false,
        });

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const report = {
            totalTasks,
            completedTasks,
            incompleteTasks: totalTasks - completedTasks,
            overdueTasks,
            completionRate: completionRate.toFixed(2),
        };

        res.json({ success: true, report });
    } catch (err) {
        console.error('Error generating task report:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate report', error: err.message });
    }
};