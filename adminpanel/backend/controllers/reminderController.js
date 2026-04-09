import mongoose from 'mongoose';
import axios from 'axios';
import Reminder from '../models/reminderModel.js';
import User from '../models/userModel.js';

// ── SOCKET EMITTER ────────────────────────────────────────────────────────────
const emitToUser = async (userId, event, data) => {
    try {
        await axios.post(`${process.env.USER_API_URL}/api/emit`, { event, data: { userId, ...data } });
    } catch (err) {
        console.error(`Socket emit error [${event}]:`, err.message);
    }
};

// ── SCOPE FILTER ──────────────────────────────────────────────────────────────
const buildScopeFilter = async (admin, extra = {}) => {
    if (admin.role === 'team-lead') {
        if (!admin.managedSector) return null;
        const sectorUsers = await User.find({ unitSector: admin.managedSector }).select('_id');
        return { user: { $in: sectorUsers.map(u => u._id) }, ...extra };
    }
    return { ...extra };
};

// ── GET ALL REMINDERS ─────────────────────────────────────────────────────────
// Team-lead: their sector's users only
// Executive/Super-admin: all
export const getAllReminders = async (req, res) => {
    try {
        const { status, type, userId, page = 1, limit = 50 } = req.query;

        const scopeFilter = await buildScopeFilter(req.admin);
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const query = { ...scopeFilter };
        if (status) query.status = status;
        if (type)   query.type   = type;

        if (userId) {
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ success: false, message: 'Invalid user ID' });
            }
            // Team-lead can only see their sector's users
            if (req.admin.role === 'team-lead') {
                const user = await User.findById(userId).select('unitSector');
                if (user?.unitSector !== req.admin.managedSector) {
                    return res.status(403).json({ success: false, message: 'Access denied: User not in your team' });
                }
            }
            query.user = userId;
        }

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Reminder.countDocuments(query);

        const reminders = await Reminder.find(query)
            .populate('user', 'firstName lastName email unitSector')
            .sort({ remindAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            reminders,
            pagination: {
                total,
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Get all reminders error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET REMINDERS FOR A SPECIFIC USER ─────────────────────────────────────────
export const getUserReminders = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findById(userId).select('unitSector firstName lastName email');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: User not in your team' });
        }

        const reminders = await Reminder.find({ user: userId })
            .sort({ remindAt: -1 });

        res.json({ success: true, reminders, user: { firstName: user.firstName, lastName: user.lastName, email: user.email } });
    } catch (err) {
        console.error('Get user reminders error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── CREATE REMINDER FOR A USER (team-lead and above) ─────────────────────────
// Allows admins to set reminders on behalf of users (e.g., deadlines, meetings)
export const createReminderForUser = async (req, res) => {
    try {
        const { userId, type, targetId, targetModel, message, deliveryChannels, remindAt, repeatInterval } = req.body;

        if (!userId || !type || !message || !remindAt) {
            return res.status(400).json({ success: false, message: 'userId, type, message and remindAt are required' });
        }
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: User not in your team' });
        }

        const reminder = await Reminder.create({
            user:    userId,
            type,
            targetId:    targetId || null,
            targetModel: targetId ? targetModel : null,
            message,
            deliveryChannels: {
                inApp: deliveryChannels?.inApp ?? true,
                email: deliveryChannels?.email ?? true,
                push:  deliveryChannels?.push  ?? false,
            },
            remindAt:      new Date(remindAt),
            createdBy:     userId,
            isUserCreated: false,
            repeatInterval: repeatInterval || null,
            isActive:      true,
        });

        await emitToUser(userId, 'newReminder', reminder);

        res.status(201).json({ success: true, reminder });
    } catch (err) {
        console.error('Create reminder for user error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── BULK CREATE REMINDERS (team-lead and above) ───────────────────────────────
// Create the same reminder for multiple users (e.g., team deadline alert)
export const bulkCreateReminders = async (req, res) => {
    try {
        const { userIds, type, message, remindAt, deliveryChannels } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0 || !type || !message || !remindAt) {
            return res.status(400).json({ success: false, message: 'userIds, type, message and remindAt are required' });
        }

        const created = [];
        for (const userId of userIds) {
            if (!mongoose.isValidObjectId(userId)) continue;

            const user = await User.findById(userId).select('unitSector');
            if (!user) continue;

            if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) continue;

            const reminder = await Reminder.create({
                user:    userId,
                type,
                message,
                deliveryChannels: {
                    inApp: deliveryChannels?.inApp ?? true,
                    email: deliveryChannels?.email ?? true,
                    push:  deliveryChannels?.push  ?? false,
                },
                remindAt:      new Date(remindAt),
                createdBy:     userId,
                isUserCreated: false,
                isActive:      true,
            });

            await emitToUser(userId, 'newReminder', reminder);
            created.push(reminder);
        }

        res.status(201).json({
            success: true,
            message: `${created.length} reminder(s) created`,
            reminders: created,
        });
    } catch (err) {
        console.error('Bulk create reminders error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── DELETE A REMINDER (super-admin only) ──────────────────────────────────────
export const deleteReminder = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
        }

        const reminder = await Reminder.findByIdAndDelete(req.params.id);
        if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });

        await emitToUser(reminder.user, 'reminderDeleted', reminder._id);

        res.json({ success: true, message: 'Reminder deleted' });
    } catch (err) {
        console.error('Delete reminder error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── REMINDER STATS ────────────────────────────────────────────────────────────
export const getReminderStats = async (req, res) => {
    try {
        const scopeFilter = await buildScopeFilter(req.admin);
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const [total, pending, sent, snoozed, dismissed] = await Promise.all([
            Reminder.countDocuments(scopeFilter),
            Reminder.countDocuments({ ...scopeFilter, status: 'pending',   isActive: true }),
            Reminder.countDocuments({ ...scopeFilter, status: 'sent' }),
            Reminder.countDocuments({ ...scopeFilter, status: 'snoozed' }),
            Reminder.countDocuments({ ...scopeFilter, status: 'dismissed' }),
        ]);

        res.json({ success: true, stats: { total, pending, sent, snoozed, dismissed } });
    } catch (err) {
        console.error('Reminder stats error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};