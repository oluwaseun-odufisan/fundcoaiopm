// controllers/taskController.js
import Task from '../models/taskModel.js';
import Reminder from '../models/reminderModel.js';
import User from '../models/userModel.js';

// Helper function to create or update reminder for a task
const createOrUpdateTaskReminder = async (task, userId, io) => {
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
            email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true,
            push: user.preferences?.reminders?.defaultDeliveryChannels?.push ?? false,
        };
        reminder.status = 'pending';
        reminder.snoozeUntil = null;
        await reminder.save();
        io.to(`user:${userId}`).emit('reminderUpdated', reminder);
    } else {
        reminder = new Reminder({
            user: userId,
            type: 'task_due',
            targetId: task._id,
            targetModel: 'Task',
            message: `Task "${task.title}" is due soon`,
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
        io.to(`user:${userId}`).emit('newReminder', reminder);
    }
};

// CREATE A NEW TASK
export const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, checklist = [] } = req.body;

        // === NEW: Strict date validation for creation ===
        let dueDateObj = null;
        if (dueDate) {
            dueDateObj = new Date(dueDate);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            if (dueDateObj < todayStart) {
                return res.status(400).json({
                    success: false,
                    message: 'Due date for a new task cannot be in the past. Must be today or later.'
                });
            }
        }

        const task = new Task({
            title,
            description,
            priority,
            dueDate: dueDateObj,
            checklist,
            completed: checklist.length > 0 ? checklist.every(item => item.completed) : false,
            submissionStatus: 'not_submitted',
            appealStatus: 'not_appealed',
            createdByAdmin: false,
            owner: req.user._id,
        });

        const saved = await task.save();

        if (saved.dueDate) {
            await createOrUpdateTaskReminder(saved, req.user._id, req.io);
        }

        req.io.to(`user:${req.user._id}`).emit('newTask', saved);

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
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
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
        const existing = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Task not found or not yours' });
        }
        if (existing.submissionStatus === 'approved') {
            return res.status(400).json({ success: false, message: 'Approved tasks cannot be edited' });
        }

        // === NEW: Strict date validation for updates ===
        if (data.dueDate !== undefined) {
            if (data.dueDate === '' || data.dueDate === null) {
                data.dueDate = undefined; // allow clearing due date
            } else {
                const dueDateObj = new Date(data.dueDate);
                const createdStart = new Date(existing.createdAt);
                createdStart.setHours(0, 0, 0, 0);

                if (dueDateObj < createdStart) {
                    return res.status(400).json({
                        success: false,
                        message: `Due date cannot be earlier than the task creation date (${createdStart.toLocaleDateString()}).`
                    });
                }
                data.dueDate = dueDateObj;
            }
        }

        let hasChecklist = existing.checklist.length > 0;
        if (data.checklist) hasChecklist = data.checklist.length > 0;

        if (data.completed !== undefined && hasChecklist) {
            delete data.completed;
        } else if (data.completed !== undefined) {
            data.completed = data.completed === 'Yes' || data.completed === true;
        }

        const updated = await Task.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            data,
            { new: true, runValidators: true }
        );

        // Re-compute completed status from checklist if present
        if (updated.checklist && updated.checklist.length > 0) {
            const allCompleted = updated.checklist.every(item => item.completed);
            if (updated.completed !== allCompleted) {
                updated.completed = allCompleted;
                await updated.save();
            }
        }

        await createOrUpdateTaskReminder(updated, req.user._id, req.io);
        req.io.to(`user:${req.user._id}`).emit('updateTask', updated);

        res.json({ success: true, task: updated });
    } catch (err) {
        console.error('Error updating task:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// SUBMIT TASK FOR APPROVAL
export const submitTask = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found or not yours' });
        if (!task.completed) return res.status(400).json({ success: false, message: 'Task must be completed before submission' });
        if (task.submissionStatus !== 'not_submitted') return res.status(400).json({ success: false, message: 'Task already submitted' });

        task.submissionStatus = 'submitted';
        const updated = await task.save();
        req.io.to(`user:${req.user._id}`).emit('updateTask', updated);
        res.json({ success: true, task: updated });
    } catch (err) {
        console.error('Error submitting task:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// APPEAL TASK
export const appealTask = async (req, res) => {
    try {
        const { appealStatus } = req.body;
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found or not yours' });
        if (!task.createdByAdmin) return res.status(400).json({ success: false, message: 'Only admin-created tasks can be appealed' });
        if (task.appealStatus !== 'not_appealed') return res.status(400).json({ success: false, message: 'Task appeal status already set' });

        task.appealStatus = appealStatus;
        const updated = await task.save();
        req.io.to(`user:${req.user._id}`).emit('updateTask', updated);
        res.json({ success: true, task: updated });
    } catch (err) {
        console.error('Error appealing task:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE A TASK
export const deleteTask = async (req, res) => {
    try {
        const deleted = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!deleted) return res.status(404).json({ success: false, message: 'Task not found or not yours' });

        await Reminder.deleteMany({ targetId: req.params.id, targetModel: 'Task', user: req.user._id });
        req.io.to(`user:${req.user._id}`).emit('reminderDeleted', req.params.id);
        req.io.to(`user:${req.user._id}`).emit('deleteTask', req.params.id);

        res.json({ success: true, message: 'Task deleted' });
    } catch (err) {
        console.error('Error deleting task:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};