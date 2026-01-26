import Task from '../models/taskModel.js';
import Reminder from '../models/reminderModel.js';
import User from '../models/userModel.js';

// Helper function to create or update reminder for a task
const createOrUpdateTaskReminder = async (task, userId, io) => {
    if (!task.dueDate) {
        // Remove existing reminder if dueDate is cleared
        await Reminder.deleteMany({ targetId: task._id, targetModel: 'Task', user: userId });
        return;
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const reminderTime = user.preferences?.reminders?.defaultReminderTimes?.task_due || 60;
    const remindAt = new Date(task.dueDate.getTime() - reminderTime * 60 * 1000);

    let reminder = await Reminder.findOne({ targetId: task._id, targetModel: 'Task', user: userId });
    if (reminder) {
        // Update existing reminder
        reminder.message = `Task "${task.title}" is due soon`;
        reminder.remindAt = remindAt;
        reminder.deliveryChannels = {
            inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
            email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true, // Default to true
            push: user.preferences?.reminders?.defaultDeliveryChannels?.push ?? false,
        };
        reminder.status = 'pending';
        reminder.snoozeUntil = null;
        await reminder.save();
        io.to(`user:${userId}`).emit('reminderUpdated', reminder);
    } else {
        // Create new reminder
        reminder = new Reminder({
            user: userId,
            type: 'task_due',
            targetId: task._id,
            targetModel: 'Task',
            message: `Task "${task.title}" is due soon`,
            deliveryChannels: {
                inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
                email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true, // Default to true
                push: user.preferences?.reminders?.defaultDeliveryChannels?.push ?? false,
            },
            remindAt,
            createdBy: userId,
            isUserCreated: false,
            isActive: true,
        });
        await reminder.save();
        io.to(`user:${userId}`).emit('newReminder', reminder);
    }
};

// CREATE A NEW TASK
export const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, completed } = req.body;
        const task = new Task({
            title,
            description,
            priority,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            completed: completed === 'Yes' || completed === true,
            owner: req.user._id,
        });
        const saved = await task.save();

        // Create reminder if dueDate exists
        if (task.dueDate) {
            await createOrUpdateTaskReminder(saved, req.user._id, req.io);
        }

        res.status(201).json({ success: true, task: saved });
    } catch (err) {
        console.error('Error creating task:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET ALL TASKS FOR LOGGED-IN USER
export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, tasks });
    } catch (err) {
        console.error('Error fetching tasks:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET SINGLE TASK BY ID
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        res.json({ success: true, task });
    } catch (err) {
        console.error('Error fetching task:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// UPDATE A TASK BY ID
export const updateTask = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.completed !== undefined) {
            data.completed = data.completed === 'Yes' || data.completed === true;
        }
        if (data.dueDate) {
            data.dueDate = new Date(data.dueDate);
        }

        const updated = await Task.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            data,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Task not found or not yours' });
        }

        // Update or create reminder
        await createOrUpdateTaskReminder(updated, req.user._id, req.io);

        res.json({ success: true, task: updated });
    } catch (err) {
        console.error('Error updating task:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE A TASK
export const deleteTask = async (req, res) => {
    try {
        const deleted = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Task not found or not yours' });
        }

        // Remove associated reminders
        await Reminder.deleteMany({ targetId: req.params.id, targetModel: 'Task', user: req.user._id });
        req.io.to(`user:${req.user._id}`).emit('reminderDeleted', req.params.id);

        res.json({ success: true, message: 'Task deleted' });
    } catch (err) {
        console.error('Error deleting task:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};