import mongoose from 'mongoose';
import axios from 'axios';
import Task from '../models/taskModel.js';
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
const upsertTaskReminder = async (task, userId) => {
    if (!task.dueDate) {
        await Reminder.deleteMany({ targetId: task._id, targetModel: 'Task', user: userId });
        return;
    }
    const user = await User.findById(userId);
    if (!user) return;

    const minutes  = user.preferences?.reminders?.defaultReminderTimes?.task_due ?? 60;
    const remindAt = new Date(task.dueDate.getTime() - minutes * 60 * 1000);

    let reminder = await Reminder.findOne({ targetId: task._id, targetModel: 'Task', user: userId });
    if (reminder) {
        reminder.message  = `Task "${task.title}" is due soon`;
        reminder.remindAt = remindAt;
        reminder.deliveryChannels = {
            inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
            email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true,
            push:  user.preferences?.reminders?.defaultDeliveryChannels?.push  ?? false,
        };
        reminder.status     = 'pending';
        reminder.snoozeUntil = null;
        await reminder.save();
        await emitToUser(userId, 'reminderUpdated', reminder);
    } else {
        reminder = await Reminder.create({
            user:    userId,
            type:    'task_due',
            targetId:    task._id,
            targetModel: 'Task',
            message: `Task "${task.title}" is due soon`,
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

// ── SCOPE FILTER ──────────────────────────────────────────────────────────────
// Team-lead: only tasks belonging to users in their managedSector
// Executive: all tasks (read-only enforced in handlers)
// Super-admin: all tasks (full control)
const buildScopeFilter = async (admin, extra = {}) => {
    if (admin.role === 'team-lead') {
        if (!admin.managedSector) return null; // no sector → no access
        const sectorUsers = await User.find({ unitSector: admin.managedSector }).select('_id');
        const userIds = sectorUsers.map(u => u._id);
        return { owner: { $in: userIds }, ...extra };
    }
    return { ...extra };
};

// ── GET ALL TASKS ─────────────────────────────────────────────────────────────
export const getAllTasks = async (req, res) => {
    try {
        const { status, priority, submissionStatus, ownerEmail, unitSector, search, page = 1, limit = 50 } = req.query;

        const scopeFilter = await buildScopeFilter(req.admin);
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const query = { ...scopeFilter };

        if (status === 'completed')   query.completed = true;
        if (status === 'incomplete')  query.completed = false;
        if (priority)          query.priority = priority;
        if (submissionStatus)  query.submissionStatus = submissionStatus;

        if (ownerEmail) {
            const user = await User.findOne({ email: ownerEmail });
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            query.owner = user._id;
        }

        // Executives / super-admins can filter by sector
        if (unitSector && req.admin.role !== 'team-lead') {
            const sectorUsers = await User.find({ unitSector }).select('_id');
            query.owner = { $in: sectorUsers.map(u => u._id) };
        }

        if (search) {
            query.$or = [
                { title:       { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Task.countDocuments(query);

        const tasks = await Task.find(query)
            .populate('owner',      'firstName lastName email unitSector position')
            .populate('assignedBy', 'firstName lastName email role')
            .populate('reviewedBy', 'firstName lastName email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            tasks,
            pagination: {
                total,
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Get all tasks error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET TASK BY ID ────────────────────────────────────────────────────────────
export const getTaskById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }

        const task = await Task.findById(req.params.id)
            .populate('owner',      'firstName lastName email unitSector position')
            .populate('assignedBy', 'firstName lastName email role')
            .populate('reviewedBy', 'firstName lastName email role');

        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        // Team-lead sector check
        if (req.admin.role === 'team-lead') {
            const owner = await User.findById(task.owner._id).select('unitSector');
            if (owner?.unitSector !== req.admin.managedSector) {
                return res.status(403).json({ success: false, message: 'Access denied: Task not in your team' });
            }
        }

        res.json({ success: true, task });
    } catch (err) {
        console.error('Get task by id error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── CREATE TASK (team-lead and above) ─────────────────────────────────────────
export const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, ownerEmail, ownerId, checklist = [] } = req.body;

        if (!title) return res.status(400).json({ success: false, message: 'Task title is required' });
        if (!ownerEmail && !ownerId) {
            return res.status(400).json({ success: false, message: 'Owner (email or id) is required' });
        }

        const user = ownerEmail
            ? await User.findOne({ email: ownerEmail })
            : await User.findById(ownerId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Team-lead can only assign tasks to their sector
        if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) {
            return res.status(403).json({
                success: false,
                message: 'You can only assign tasks to users in your team',
            });
        }

        const task = await Task.create({
            title,
            description:      description || '',
            priority:         priority || 'Low',
            dueDate:          dueDate ? new Date(dueDate) : undefined,
            owner:            user._id,
            checklist,
            completed:        checklist.length > 0 ? checklist.every(i => i.completed) : false,
            submissionStatus: 'not_submitted',
            appealStatus:     'not_appealed',
            createdByAdmin:   true,
            assignedBy:       req.admin._id,
        });

        if (task.dueDate) await upsertTaskReminder(task, user._id);

        await emitToUser(user._id, 'newTask', task);

        res.status(201).json({ success: true, task });
    } catch (err) {
        console.error('Create task error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── UPDATE TASK (team-lead and above, not executive) ──────────────────────────
export const updateTask = async (req, res) => {
    try {
        // Executives have read-only access to tasks
        if (req.admin.role === 'executive') {
            return res.status(403).json({ success: false, message: 'Executives have read-only access to tasks' });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }

        const task = await Task.findById(req.params.id).populate('owner', 'unitSector');
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        // Team-lead sector check
        if (req.admin.role === 'team-lead' && task.owner?.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: Task not in your team' });
        }

        const data = { ...req.body };
        delete data.owner;      // owner cannot be changed via this endpoint; use reassign
        delete data.assignedBy;
        delete data.reviewedBy;

        if (data.dueDate) data.dueDate = new Date(data.dueDate);
        if (data.completed !== undefined) data.completed = Boolean(data.completed);

        const updated = await Task.findByIdAndUpdate(req.params.id, data, {
            new: true,
            runValidators: true,
        }).populate('owner', 'firstName lastName email unitSector');

        if (updated.dueDate) await upsertTaskReminder(updated, updated.owner._id);

        await emitToUser(updated.owner._id, 'updateTask', updated);

        res.json({ success: true, task: updated });
    } catch (err) {
        console.error('Update task error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── APPROVE / REJECT SUBMITTED TASK (team-lead and above, not executive) ──────
// Approval is routed to team leads, not hardcoded to any individual.
// A team lead can approve/reject tasks within their sector.
// Super-admin can approve/reject any task.
export const reviewTask = async (req, res) => {
    try {
        if (req.admin.role === 'executive') {
            return res.status(403).json({ success: false, message: 'Executives cannot review task submissions' });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }

        const { action, rejectionReason } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" });
        }

        const task = await Task.findById(req.params.id).populate('owner', 'unitSector firstName lastName email');
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (task.submissionStatus !== 'submitted') {
            return res.status(400).json({ success: false, message: 'Task has not been submitted for review' });
        }

        // Team-lead can only review tasks in their sector
        if (req.admin.role === 'team-lead' && task.owner?.unitSector !== req.admin.managedSector) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Task not in your team',
            });
        }

        task.submissionStatus = action === 'approve' ? 'approved' : 'rejected';
        task.reviewedBy       = req.admin._id;
        task.reviewedAt       = new Date();

        if (action === 'reject') {
            task.completed       = false;
            task.rejectionReason = rejectionReason || '';
        } else {
            task.rejectionReason = '';
        }

        await task.save();

        await emitToUser(task.owner._id, 'updateTask', task);
        // Notify owner of the decision
        await emitToUser(task.owner._id, 'taskReviewed', {
            taskId:           task._id,
            title:            task.title,
            submissionStatus: task.submissionStatus,
            reviewedBy:       `${req.admin.firstName} ${req.admin.lastName}`,
            rejectionReason:  task.rejectionReason,
        });

        res.json({ success: true, task });
    } catch (err) {
        console.error('Review task error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── REASSIGN TASK (team-lead and above, not executive) ────────────────────────
export const reassignTask = async (req, res) => {
    try {
        if (req.admin.role === 'executive') {
            return res.status(403).json({ success: false, message: 'Executives cannot reassign tasks' });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }

        const { ownerEmail, ownerId } = req.body;
        if (!ownerEmail && !ownerId) {
            return res.status(400).json({ success: false, message: 'New owner (email or id) is required' });
        }

        const newOwner = ownerEmail
            ? await User.findOne({ email: ownerEmail })
            : await User.findById(ownerId);

        if (!newOwner) return res.status(404).json({ success: false, message: 'New owner not found' });

        // Team-lead can only reassign within their sector
        if (req.admin.role === 'team-lead' && newOwner.unitSector !== req.admin.managedSector) {
            return res.status(403).json({
                success: false,
                message: 'You can only reassign tasks to users in your team',
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        const oldOwnerId = task.owner;
        task.owner      = newOwner._id;
        task.assignedBy = req.admin._id;
        // Reset submission status on reassign
        task.submissionStatus = 'not_submitted';
        task.completed        = false;
        await task.save();

        if (task.dueDate) await upsertTaskReminder(task, newOwner._id);

        // Notify old owner (if different)
        if (oldOwnerId.toString() !== newOwner._id.toString()) {
            await emitToUser(oldOwnerId, 'deleteTask', task._id);
        }
        await emitToUser(newOwner._id, 'newTask', task);

        const populated = await Task.findById(task._id)
            .populate('owner',      'firstName lastName email unitSector')
            .populate('assignedBy', 'firstName lastName email role');

        res.json({ success: true, task: populated });
    } catch (err) {
        console.error('Reassign task error:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── DELETE TASK (super-admin and team-lead for their team) ────────────────────
export const deleteTask = async (req, res) => {
    try {
        if (req.admin.role === 'executive') {
            return res.status(403).json({ success: false, message: 'Executives cannot delete tasks' });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid task ID' });
        }

        const task = await Task.findById(req.params.id).populate('owner', 'unitSector');
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        if (req.admin.role === 'team-lead' && task.owner?.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: Task not in your team' });
        }

        await Task.findByIdAndDelete(req.params.id);
        await Reminder.deleteMany({ targetId: req.params.id, targetModel: 'Task', user: task.owner._id });

        await emitToUser(task.owner._id, 'deleteTask', req.params.id);

        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
        console.error('Delete task error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── BULK DELETE TASKS (super-admin only) ──────────────────────────────────────
export const bulkDeleteTasks = async (req, res) => {
    try {
        const { taskIds } = req.body;
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ success: false, message: 'taskIds array is required' });
        }

        const tasks = await Task.find({ _id: { $in: taskIds } });
        await Task.deleteMany({ _id: { $in: taskIds } });

        for (const task of tasks) {
            await Reminder.deleteMany({ targetId: task._id, targetModel: 'Task', user: task.owner });
            await emitToUser(task.owner, 'deleteTask', task._id);
        }

        res.json({ success: true, message: `${tasks.length} task(s) deleted successfully` });
    } catch (err) {
        console.error('Bulk delete tasks error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── TASK SUMMARY REPORT ────────────────────────────────────────────────────────
export const getTaskReport = async (req, res) => {
    try {
        const scopeFilter = await buildScopeFilter(req.admin);
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const [total, completed, overdue, submitted, approved, rejected] = await Promise.all([
            Task.countDocuments(scopeFilter),
            Task.countDocuments({ ...scopeFilter, completed: true }),
            Task.countDocuments({ ...scopeFilter, dueDate: { $lt: new Date() }, completed: false }),
            Task.countDocuments({ ...scopeFilter, submissionStatus: 'submitted' }),
            Task.countDocuments({ ...scopeFilter, submissionStatus: 'approved' }),
            Task.countDocuments({ ...scopeFilter, submissionStatus: 'rejected' }),
        ]);

        // Per-user breakdown
        const pipeline = [
            { $match: scopeFilter },
            {
                $group: {
                    _id:       '$owner',
                    total:     { $sum: 1 },
                    completed: { $sum: { $cond: ['$completed', 1, 0] } },
                    approved:  { $sum: { $cond: [{ $eq: ['$submissionStatus', 'approved'] }, 1, 0] } },
                },
            },
            {
                $lookup: {
                    from:         'users',
                    localField:   '_id',
                    foreignField: '_id',
                    as:           'user',
                },
            },
            { $unwind: { path: '$user', preserveNullAndEmpty: true } },
            {
                $project: {
                    userId:    '$_id',
                    name:      { $concat: ['$user.firstName', ' ', '$user.lastName'] },
                    email:     '$user.email',
                    sector:    '$user.unitSector',
                    total:     1,
                    completed: 1,
                    approved:  1,
                },
            },
            { $sort: { completed: -1 } },
        ];

        const perUser = await Task.aggregate(pipeline);

        res.json({
            success: true,
            report: {
                total,
                completed,
                incomplete:       total - completed,
                overdue,
                submitted,
                approved,
                rejected,
                completionRate:   total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00',
                approvalRate:     submitted + approved > 0 ? ((approved / (submitted + approved)) * 100).toFixed(2) : '0.00',
                perUser,
            },
        });
    } catch (err) {
        console.error('Task report error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET PENDING APPROVALS (tasks awaiting review) ────────────────────────────
export const getPendingApprovals = async (req, res) => {
    try {
        if (req.admin.role === 'executive') {
            return res.status(403).json({ success: false, message: 'Executives cannot review submissions' });
        }

        const scopeFilter = await buildScopeFilter(req.admin, { submissionStatus: 'submitted' });
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const tasks = await Task.find(scopeFilter)
            .populate('owner', 'firstName lastName email unitSector position')
            .sort({ updatedAt: -1 });

        res.json({ success: true, tasks, total: tasks.length });
    } catch (err) {
        console.error('Get pending approvals error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};