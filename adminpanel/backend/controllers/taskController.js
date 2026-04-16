import Task from '../models/taskModel.js';
import Reminder from '../models/reminderModel.js';
import User from '../models/userModel.js';
import { buildTeamQuery } from '../middleware/teamFilter.js';
import { createNotification } from '../utils/notificationService.js';

// ── Get all tasks (team-filtered) ─────────────────────────────────────────────
export const getAllTasks = async (req, res) => {
  try {
    const query = buildTeamQuery(req.teamMemberIds, 'owner');
    const { status, priority, search, page = 1, limit = 50 } = req.query;

    if (status === 'completed') query.completed = true;
    else if (status === 'pending') query.completed = false;
    else if (status === 'overdue') {
      query.completed = false;
      query.dueDate = { $lt: new Date() };
    } else if (status === 'submitted') query.submissionStatus = 'submitted';
    else if (status === 'approved') query.submissionStatus = 'approved';
    else if (status === 'rejected') query.submissionStatus = 'rejected';

    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('owner', 'firstName lastName otherName email position unitSector avatar')
        .populate('assignedBy', 'firstName lastName email')
        .populate('adminComments.user', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Task.countDocuments(query),
    ]);

    res.json({
      success: true, tasks, total,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getAllTasks error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

// ── Get single task ───────────────────────────────────────────────────────────
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('owner', 'firstName lastName otherName email position avatar')
      .populate('assignedBy', 'firstName lastName email')
      .populate('adminComments.user', 'firstName lastName avatar')
      .lean();
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
};

// ── Create task for a user (Team Lead+ can assign) ────────────────────────────
export const createTaskForUser = async (req, res) => {
  try {
    const { title, description, priority, dueDate, checklist = [], ownerId } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' });
    if (!ownerId) return res.status(400).json({ success: false, message: 'Owner user ID is required' });

    // Verify ownerId is in admin's team (unless super admin)
    if (req.teamMemberIds && !req.teamMemberIds.map(String).includes(String(ownerId))) {
      return res.status(403).json({ success: false, message: 'User is not in your team' });
    }

    let dueDateObj = null;
    if (dueDate) {
      dueDateObj = new Date(dueDate);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      if (dueDateObj < todayStart) {
        return res.status(400).json({ success: false, message: 'Due date cannot be in the past' });
      }
    }

    const task = new Task({
      title: title.trim(),
      description: description || '',
      priority: priority || 'Low',
      dueDate: dueDateObj,
      checklist,
      completed: checklist.length > 0 ? checklist.every(i => i.completed) : false,
      submissionStatus: 'not_submitted',
      appealStatus: 'not_appealed',
      createdByAdmin: true,
      assignedBy: req.user._id,
      owner: ownerId,
    });

    const saved = await task.save();
    const populated = await Task.findById(saved._id)
      .populate('owner', 'firstName lastName email avatar')
      .populate('assignedBy', 'firstName lastName email')
      .lean();

    // Emit socket event to user
    if (req.io) {
      req.io.to(`user:${ownerId}`).emit('newTask', populated);
    }

    await createNotification({
      userId: ownerId,
      type: 'task',
      title: `New task assigned: ${task.title}`,
      body: `Assigned by ${req.user.fullName || req.user.email}`,
      actorId: req.user._id,
      actorName: req.user.fullName || req.user.email,
      entityId: task._id,
      entityType: 'Task',
      data: { taskId: String(task._id), status: 'assigned' },
      io: req.io,
    });

    res.status(201).json({ success: true, task: populated });
  } catch (err) {
    console.error('createTaskForUser error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Update task ───────────────────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Team filter check
    if (req.teamMemberIds && !req.teamMemberIds.map(String).includes(String(task.owner))) {
      return res.status(403).json({ success: false, message: 'Task owner is not in your team' });
    }

    const data = { ...req.body };
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.dueDate === '' || data.dueDate === null) data.dueDate = undefined;

    // Allow reassignment
    if (data.ownerId) {
      data.owner = data.ownerId;
      delete data.ownerId;
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after', runValidators: true })
      .populate('owner', 'firstName lastName email avatar')
      .populate('assignedBy', 'firstName lastName email')
      .lean();

    if (req.io) {
      req.io.to(`user:${updated.owner._id || updated.owner}`).emit('updateTask', updated);
    }

    res.json({ success: true, task: updated });
  } catch (err) {
    console.error('updateTask error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Delete task ───────────────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.teamMemberIds && !req.teamMemberIds.map(String).includes(String(task.owner))) {
      return res.status(403).json({ success: false, message: 'Task owner is not in your team' });
    }

    const ownerId = task.owner;
    await Task.findByIdAndDelete(req.params.id);
    await Reminder.deleteMany({ targetId: req.params.id, targetModel: 'Task' });

    if (req.io) {
      req.io.to(`user:${ownerId}`).emit('deleteTask', req.params.id);
    }

    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

// ── Approve/Reject task submission ────────────────────────────────────────────
export const reviewTask = async (req, res) => {
  try {
    const { action } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approved or rejected' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.submissionStatus !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Task has not been submitted for review' });
    }

    task.submissionStatus = action;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('owner', 'firstName lastName email avatar')
      .lean();

    if (req.io) {
      req.io.to(`user:${task.owner}`).emit('updateTask', populated);
      req.io.to(`user:${task.owner}`).emit('taskReviewed', {
        taskId: task._id,
        title: task.title,
        status: action,
        reviewedBy: req.user.fullName || req.user.email,
      });
    }

    await createNotification({
      userId: task.owner,
      type: 'task',
      title: `Task ${action}: ${task.title}`,
      body: `Reviewed by ${req.user.fullName || req.user.email}`,
      actorId: req.user._id,
      actorName: req.user.fullName || req.user.email,
      entityId: task._id,
      entityType: 'Task',
      data: { taskId: String(task._id), status: action },
      io: req.io,
    });

    res.json({ success: true, task: populated });
  } catch (err) {
    console.error('reviewTask error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to review task' });
  }
};

// ── Add admin comment to task ─────────────────────────────────────────────────
export const addTaskComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment content required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.adminComments.push({ user: req.user._id, content: content.trim() });
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('owner', 'firstName lastName email avatar')
      .populate('adminComments.user', 'firstName lastName avatar')
      .lean();

    if (req.io) {
      req.io.to(`user:${task.owner}`).emit('updateTask', populated);
    }

    await createNotification({
      userId: task.owner,
      type: 'task',
      title: `New admin comment on ${task.title}`,
      body: content.trim(),
      actorId: req.user._id,
      actorName: req.user.fullName || req.user.email,
      entityId: task._id,
      entityType: 'Task',
      data: { taskId: String(task._id), status: 'commented' },
      io: req.io,
    });

    res.json({ success: true, task: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

// ── Bulk actions ──────────────────────────────────────────────────────────────
export const bulkAction = async (req, res) => {
  try {
    const { taskIds, action, data } = req.body;
    if (!Array.isArray(taskIds) || !taskIds.length) {
      return res.status(400).json({ success: false, message: 'taskIds array required' });
    }

    let result;
    switch (action) {
      case 'approve':
        result = await Task.updateMany(
          { _id: { $in: taskIds }, submissionStatus: 'submitted' },
          { $set: { submissionStatus: 'approved' } }
        );
        break;
      case 'reject':
        result = await Task.updateMany(
          { _id: { $in: taskIds }, submissionStatus: 'submitted' },
          { $set: { submissionStatus: 'rejected' } }
        );
        break;
      case 'delete':
        if (req.user.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Only Super Admin can bulk delete' });
        }
        result = await Task.deleteMany({ _id: { $in: taskIds } });
        break;
      case 'reassign':
        if (!data?.ownerId) return res.status(400).json({ success: false, message: 'ownerId required for reassign' });
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { $set: { owner: data.ownerId, assignedBy: req.user._id } }
        );
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.json({ success: true, message: `Bulk ${action} completed`, result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bulk action failed' });
  }
};

// ── Task stats (dashboard) ────────────────────────────────────────────────────
export const getTaskStats = async (req, res) => {
  try {
    const query = buildTeamQuery(req.teamMemberIds, 'owner');
    const now = new Date();

    const [total, completed, pending, overdue, submitted, approved, rejected, highPri] = await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments({ ...query, completed: true }),
      Task.countDocuments({ ...query, completed: false }),
      Task.countDocuments({ ...query, completed: false, dueDate: { $lt: now } }),
      Task.countDocuments({ ...query, submissionStatus: 'submitted' }),
      Task.countDocuments({ ...query, submissionStatus: 'approved' }),
      Task.countDocuments({ ...query, submissionStatus: 'rejected' }),
      Task.countDocuments({ ...query, priority: 'High', completed: false }),
    ]);

    res.json({
      success: true,
      stats: { total, completed, pending, overdue, submitted, approved, rejected, highPri },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};
