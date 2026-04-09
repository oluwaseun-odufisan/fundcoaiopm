import mongoose from 'mongoose';
import axios from 'axios';
import Goal from '../models/goalModel.js';
import User from '../models/userModel.js';
import Reminder from '../models/reminderModel.js';

// ── SOCKET EVENT EMITTER ──────────────────────────────────────────────────────
const emitToUser = async (userId, event, data) => {
    try {
        await axios.post(`${process.env.USER_API_URL}/api/emit`, {
            event,
            data: { userId, ...data },
        });
    } catch (err) {
        console.error(`Socket emit error [${event}]:`, err.message);
    }
};

// ── REMINDER HELPER ───────────────────────────────────────────────────────────
const upsertGoalReminder = async (goal, userId) => {
    if (!goal.endDate) {
        await Reminder.deleteMany({ targetId: goal._id, targetModel: 'Goal', user: userId });
        return;
    }
    const user = await User.findById(userId);
    if (!user) return;

    const minutes  = user.preferences?.reminders?.defaultReminderTimes?.goal_deadline ?? 1440;
    const remindAt = new Date(goal.endDate.getTime() - minutes * 60 * 1000);

    let reminder = await Reminder.findOne({ targetId: goal._id, targetModel: 'Goal', user: userId });
    if (reminder) {
        reminder.message  = `Goal "${goal.title}" deadline approaching`;
        reminder.remindAt = remindAt;
        reminder.deliveryChannels = {
            inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
            email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true,
            push:  user.preferences?.reminders?.defaultDeliveryChannels?.push  ?? false,
        };
        reminder.status      = 'pending';
        reminder.snoozeUntil = null;
        await reminder.save();
        await emitToUser(userId, 'reminderUpdated', reminder);
    } else {
        reminder = await Reminder.create({
            user:        userId,
            type:        'goal_deadline',
            targetId:    goal._id,
            targetModel: 'Goal',
            message:     `Goal "${goal.title}" deadline approaching`,
            deliveryChannels: {
                inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
                email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true,
                push:  user.preferences?.reminders?.defaultDeliveryChannels?.push  ?? false,
            },
            remindAt,
            createdBy:     userId,
            isUserCreated: false,
            isActive:      true,
        });
        await emitToUser(userId, 'newReminder', reminder);
    }
};

// ── PROGRESS HELPER ───────────────────────────────────────────────────────────
const calcProgress = (goal) => {
    if (!goal.subGoals?.length) return 0;
    const done = goal.subGoals.filter(sg => sg.completed).length;
    return Math.round((done / goal.subGoals.length) * 100);
};

// ── SCOPE FILTER ──────────────────────────────────────────────────────────────
const buildScopeFilter = async (admin, extra = {}) => {
    if (admin.role === 'team-lead') {
        if (!admin.managedSector) return null;
        const sectorUsers = await User.find({ unitSector: admin.managedSector }).select('_id');
        return { owner: { $in: sectorUsers.map(u => u._id) }, ...extra };
    }
    return { ...extra };
};

// ── GET ALL GOALS ─────────────────────────────────────────────────────────────
export const getAllGoals = async (req, res) => {
    try {
        const { timeframe, ownerEmail, unitSector, scope, search, page = 1, limit = 50 } = req.query;

        const scopeFilter = await buildScopeFilter(req.admin);
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const query = { ...scopeFilter };

        if (timeframe) query.timeframe = timeframe;
        if (scope)     query.scope = scope;

        if (ownerEmail) {
            const user = await User.findOne({ email: ownerEmail });
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            query.owner = user._id;
        }

        if (unitSector && req.admin.role !== 'team-lead') {
            const sectorUsers = await User.find({ unitSector }).select('_id');
            query.owner = { $in: sectorUsers.map(u => u._id) };
        }

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Goal.countDocuments(query);

        const goals = await Goal.find(query)
            .populate('owner',      'firstName lastName email unitSector')
            .populate('assignedBy', 'firstName lastName email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const goalsWithProgress = goals.map(g => ({ ...g.toObject(), progress: calcProgress(g) }));

        res.json({
            success: true,
            goals: goalsWithProgress,
            pagination: {
                total,
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Get all goals error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET GOAL BY ID ────────────────────────────────────────────────────────────
export const getGoalById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid goal ID' });
        }

        const goal = await Goal.findById(req.params.id)
            .populate('owner',      'firstName lastName email unitSector')
            .populate('assignedBy', 'firstName lastName email role');

        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

        if (req.admin.role === 'team-lead') {
            const owner = await User.findById(goal.owner._id).select('unitSector');
            if (owner?.unitSector !== req.admin.managedSector) {
                return res.status(403).json({ success: false, message: 'Access denied: Goal not in your team' });
            }
        }

        res.json({ success: true, goal: { ...goal.toObject(), progress: calcProgress(goal) } });
    } catch (err) {
        console.error('Get goal by id error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── CREATE GOAL (team-lead and above) ─────────────────────────────────────────
export const createGoal = async (req, res) => {
    try {
        const { title, subGoals, ownerEmail, ownerId, type, timeframe, startDate, endDate, associatedTasks, scope } = req.body;

        if (!title || !timeframe || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Title, timeframe, startDate and endDate are required' });
        }
        if (!ownerEmail && !ownerId) {
            return res.status(400).json({ success: false, message: 'Owner (email or id) is required' });
        }

        const user = ownerEmail
            ? await User.findOne({ email: ownerEmail })
            : await User.findById(ownerId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) {
            return res.status(403).json({
                success: false,
                message: 'You can only create goals for users in your team',
            });
        }

        // Executives can create org-wide goals; team-leads create team goals
        const goalScope = req.admin.role === 'super-admin' ? (scope || 'personal') :
                          req.admin.role === 'executive'   ? (scope || 'organization') :
                          'team';

        const goal = await Goal.create({
            title,
            subGoals:        subGoals || [],
            type:            type || 'personal',
            timeframe,
            startDate:       new Date(startDate),
            endDate:         new Date(endDate),
            owner:           user._id,
            associatedTasks: associatedTasks || [],
            createdByAdmin:  true,
            assignedBy:      req.admin._id,
            scope:           goalScope,
        });

        await upsertGoalReminder(goal, user._id);
        await emitToUser(user._id, 'newGoal', goal);

        res.status(201).json({ success: true, goal: { ...goal.toObject(), progress: calcProgress(goal) } });
    } catch (err) {
        console.error('Create goal error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── UPDATE GOAL (team-lead and above, not executive) ──────────────────────────
export const updateGoal = async (req, res) => {
    try {
        if (req.admin.role === 'executive') {
            return res.status(403).json({ success: false, message: 'Executives have read-only access to goals' });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid goal ID' });
        }

        const goal = await Goal.findById(req.params.id).populate('owner', 'unitSector');
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

        if (req.admin.role === 'team-lead' && goal.owner?.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: Goal not in your team' });
        }

        const data = { ...req.body };
        delete data.owner;
        delete data.assignedBy;

        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.endDate)   data.endDate   = new Date(data.endDate);

        const updated = await Goal.findByIdAndUpdate(req.params.id, data, {
            new: true,
            runValidators: true,
        }).populate('owner', 'firstName lastName email unitSector');

        await upsertGoalReminder(updated, updated.owner._id);
        await emitToUser(updated.owner._id, 'goalUpdated', updated);

        res.json({ success: true, goal: { ...updated.toObject(), progress: calcProgress(updated) } });
    } catch (err) {
        console.error('Update goal error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── DELETE GOAL (team-lead and above, not executive) ──────────────────────────
export const deleteGoal = async (req, res) => {
    try {
        if (req.admin.role === 'executive') {
            return res.status(403).json({ success: false, message: 'Executives cannot delete goals' });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid goal ID' });
        }

        const goal = await Goal.findById(req.params.id).populate('owner', 'unitSector');
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

        if (req.admin.role === 'team-lead' && goal.owner?.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: Goal not in your team' });
        }

        await Goal.findByIdAndDelete(req.params.id);
        await Reminder.deleteMany({ targetId: req.params.id, targetModel: 'Goal', user: goal.owner._id });
        await emitToUser(goal.owner._id, 'goalDeleted', req.params.id);

        res.json({ success: true, message: 'Goal deleted successfully' });
    } catch (err) {
        console.error('Delete goal error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GOAL REPORT ────────────────────────────────────────────────────────────────
export const getGoalReport = async (req, res) => {
    try {
        const scopeFilter = await buildScopeFilter(req.admin);
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const goals = await Goal.find(scopeFilter)
            .populate('owner', 'firstName lastName email unitSector')
            .sort({ createdAt: -1 });

        const total    = goals.length;
        const complete = goals.filter(g => calcProgress(g) === 100).length;
        const overdue  = goals.filter(g => calcProgress(g) < 100 && new Date(g.endDate) < new Date()).length;

        const byUser = goals.reduce((acc, goal) => {
            const email = goal.owner?.email || 'unassigned';
            if (!acc[email]) {
                acc[email] = {
                    name:      goal.owner ? `${goal.owner.firstName} ${goal.owner.lastName}` : 'Unknown',
                    sector:    goal.owner?.unitSector || '',
                    total:     0,
                    completed: 0,
                };
            }
            acc[email].total += 1;
            if (calcProgress(goal) === 100) acc[email].completed += 1;
            return acc;
        }, {});

        res.json({
            success: true,
            report: {
                total,
                completed:      complete,
                inProgress:     total - complete - overdue,
                overdue,
                completionRate: total > 0 ? ((complete / total) * 100).toFixed(2) : '0.00',
                byUser: Object.values(byUser),
            },
        });
    } catch (err) {
        console.error('Goal report error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── ASSIGN TEAM GOAL (team-lead creates one goal for multiple users) ───────────
export const assignTeamGoal = async (req, res) => {
    try {
        if (req.admin.role === 'executive') {
            return res.status(403).json({ success: false, message: 'Executives cannot assign team goals directly' });
        }

        const { title, subGoals, type, timeframe, startDate, endDate, ownerIds } = req.body;

        if (!title || !timeframe || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Title, timeframe, startDate and endDate are required' });
        }
        if (!Array.isArray(ownerIds) || ownerIds.length === 0) {
            return res.status(400).json({ success: false, message: 'ownerIds array is required' });
        }

        const created = [];

        for (const ownerId of ownerIds) {
            const user = await User.findById(ownerId);
            if (!user) continue;

            if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) continue;

            const goal = await Goal.create({
                title,
                subGoals:       subGoals || [],
                type:           type || 'personal',
                timeframe,
                startDate:      new Date(startDate),
                endDate:        new Date(endDate),
                owner:          user._id,
                createdByAdmin: true,
                assignedBy:     req.admin._id,
                scope:          'team',
            });

            await upsertGoalReminder(goal, user._id);
            await emitToUser(user._id, 'newGoal', goal);
            created.push(goal);
        }

        res.status(201).json({
            success: true,
            message: `${created.length} goal(s) assigned successfully`,
            goals:   created,
        });
    } catch (err) {
        console.error('Assign team goal error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};