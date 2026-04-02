// reminderRoutes.js
import express from 'express';
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
import Reminder from '../models/reminderModel.js';
import User from '../models/userModel.js';
import Task from '../models/taskModel.js';
import authMiddleware from '../middleware/auth.js';
import { sendEmail } from '../utils/emailService.js';
import { sendPushNotification } from '../utils/pushService.js';

const router = express.Router();

// Shared validation helper
const validateReminderInput = (body) => {
    const { type, targetId, targetModel, message, remindAt, repeatInterval, emailOverride } = body;
    if (!['task_due', 'meeting', 'goal_deadline', 'appraisal_submission', 'manager_feedback', 'custom'].includes(type)) {
        throw new Error('Invalid reminder type');
    }
    if (targetId && !mongoose.isValidObjectId(targetId)) {
        throw new Error('Invalid target ID');
    }
    if (targetId && !['Task', 'Meeting', 'Goal', 'Appraisal', 'Feedback'].includes(targetModel)) {
        throw new Error('Invalid target model');
    }
    if (!message || !validator.isLength(sanitizeHtml(message, { allowedTags: [] }), { min: 1, max: 200 })) {
        throw new Error('Message must be 1-200 characters');
    }
    if (!remindAt || isNaN(new Date(remindAt).getTime())) {
        throw new Error('Invalid reminder time');
    }
    if (repeatInterval && (!Number.isInteger(repeatInterval) || repeatInterval < 5 || repeatInterval > 1440)) {
        throw new Error('Repeat interval must be 5-1440 minutes');
    }
    if (emailOverride && !validator.isEmail(emailOverride)) {
        throw new Error('Invalid email address');
    }
    return true;
};

// Create a reminder
router.post('/', authMiddleware, async (req, res) => {
    try {
        validateReminderInput(req.body);
        const { type, targetId, targetModel, message, deliveryChannels, remindAt, repeatInterval, emailOverride } = req.body;

        let target;
        if (targetId && targetModel === 'Task') {
            target = await Task.findById(targetId);
            if (!target || target.owner.toString() !== req.user._id.toString()) {
                return res.status(404).json({ success: false, message: 'Target not found or not authorized' });
            }
        }

        const reminder = new Reminder({
            user: req.user._id,
            type,
            targetId: targetId || null,
            targetModel: targetId ? targetModel : null,
            message,
            deliveryChannels: {
                inApp: deliveryChannels?.inApp ?? true,
                email: deliveryChannels?.email ?? true,
                push: deliveryChannels?.push ?? false,
            },
            remindAt: new Date(remindAt),
            createdBy: req.user._id,
            isUserCreated: type === 'custom',
            repeatInterval: repeatInterval || null,
            isActive: true,
            emailOverride: emailOverride || null,
        });

        await reminder.save();
        req.io.to(`user:${req.user._id}`).emit('newReminder', reminder);
        res.status(201).json({ success: true, reminder });
    } catch (error) {
        console.error('Error creating reminder:', error.message);
        const status = error.message.includes('Invalid') ? 400 : 500;
        res.status(status).json({ success: false, message: error.message || 'Failed to create reminder' });
    }
});

// Get user's reminders (reminders stay until user deletes them)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const query = { user: req.user._id, isActive: true };
        if (status) query.status = status;

        const reminders = await Reminder.find(query)
            .sort({ remindAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate('targetId', 'title dueDate');

        res.json({ success: true, reminders });
    } catch (error) {
        console.error('Error fetching reminders:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch reminders' });
    }
});

// Update a reminder (used by edit modal)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
        }

        validateReminderInput(req.body);
        const { type, targetId, targetModel, message, deliveryChannels, remindAt, repeatInterval, emailOverride } = req.body;

        const reminder = await Reminder.findById(id);
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }
        if (reminder.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        reminder.type = type;
        reminder.targetId = targetId || null;
        reminder.targetModel = targetId ? targetModel : null;
        reminder.message = message;
        reminder.deliveryChannels = {
            inApp: deliveryChannels?.inApp ?? reminder.deliveryChannels.inApp,
            email: deliveryChannels?.email ?? reminder.deliveryChannels.email,
            push: deliveryChannels?.push ?? reminder.deliveryChannels.push,
        };
        reminder.remindAt = new Date(remindAt);
        reminder.repeatInterval = repeatInterval || null;
        reminder.emailOverride = emailOverride || null;
        reminder.isUserCreated = type === 'custom';
        reminder.isActive = true;

        await reminder.save();
        req.io.to(`user:${req.user._id}`).emit('reminderUpdated', reminder);
        res.json({ success: true, reminder });
    } catch (error) {
        console.error('Error updating reminder:', error.message);
        const status = error.message.includes('Invalid') ? 400 : 500;
        res.status(status).json({ success: false, message: error.message || 'Failed to update reminder' });
    }
});

// Delete a reminder
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
        }
        const reminder = await Reminder.findById(id);
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }
        if (reminder.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await Reminder.deleteOne({ _id: id });
        req.io.to(`user:${req.user._id}`).emit('reminderDeleted', id);
        res.json({ success: true, message: 'Reminder deleted' });
    } catch (error) {
        console.error('Error deleting reminder:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete reminder' });
    }
});

// Snooze
router.put('/:id/snooze', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { snoozeMinutes } = req.body;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
        }
        if (!snoozeMinutes || !Number.isInteger(snoozeMinutes) || snoozeMinutes < 5 || snoozeMinutes > 1440) {
            return res.status(400).json({ success: false, message: 'Snooze time must be 5-1440 minutes' });
        }
        const reminder = await Reminder.findById(id);
        if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
        if (reminder.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        reminder.status = 'snoozed';
        reminder.snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);
        reminder.remindAt = reminder.snoozeUntil;
        await reminder.save();
        req.io.to(`user:${req.user._id}`).emit('reminderUpdated', reminder);
        res.json({ success: true, reminder });
    } catch (error) {
        console.error('Error snoozing reminder:', error.message);
        res.status(500).json({ success: false, message: 'Failed to snooze reminder' });
    }
});

// Dismiss
router.put('/:id/dismiss', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
        }
        const reminder = await Reminder.findById(id);
        if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
        if (reminder.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        reminder.status = 'dismissed';
        reminder.isActive = false;
        await reminder.save();
        req.io.to(`user:${req.user._id}`).emit('reminderUpdated', reminder);
        res.json({ success: true, reminder });
    } catch (error) {
        console.error('Error dismissing reminder:', error.message);
        res.status(500).json({ success: false, message: 'Failed to dismiss reminder' });
    }
});

// Update preferences
router.put('/preferences', authMiddleware, async (req, res) => {
    try {
        const { defaultDeliveryChannels } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.preferences = user.preferences || {};
        user.preferences.reminders = {
            defaultDeliveryChannels: {
                inApp: defaultDeliveryChannels?.inApp ?? true,
                email: defaultDeliveryChannels?.email ?? true,
                push: defaultDeliveryChannels?.push ?? false,
            },
        };
        await user.save();
        res.json({ success: true, preferences: user.preferences.reminders });
    } catch (error) {
        console.error('Error updating preferences:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update preferences' });
    }
});

export default router;