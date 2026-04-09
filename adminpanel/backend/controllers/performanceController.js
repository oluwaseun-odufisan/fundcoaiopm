import mongoose from 'mongoose';
import axios from 'axios';
import User from '../models/userModel.js';
import Task from '../models/taskModel.js';
import Goal from '../models/goalModel.js';

// ── SCORE HELPERS (mirrors user-side performanceCalculator) ───────────────────
const PRIORITY_WEIGHTS = { Low: 15, Medium: 25, High: 40 };

const calcTaskScore = (task) => {
    if (!task.completed) return 0;
    const base      = PRIORITY_WEIGHTS[task.priority] || 15;
    let   score     = base;
    if (task.submissionStatus === 'approved')   score += Math.round(base * 0.5);
    else if (task.submissionStatus === 'submitted') score += Math.round(base * 0.2);
    if (task.dueDate && new Date() <= new Date(task.dueDate)) score += 10;
    if (task.checklist?.length) {
        const done = task.checklist.filter(c => c.completed).length;
        score += Math.round((done / task.checklist.length) * 20);
    }
    return score;
};

const calcGoalScore = (goal) => {
    if (!goal.subGoals?.length) return 0;
    const done = goal.subGoals.filter(sg => sg.completed).length;
    return Math.round((done / goal.subGoals.length) * 50);
};

const calcOverdueCount = (tasks) =>
    tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;

const calcUserScore = (tasks, goals) => {
    const taskPoints  = tasks.reduce((s, t) => s + calcTaskScore(t), 0);
    const goalPoints  = goals.reduce((s, g) => s + calcGoalScore(g), 0);
    const overdue     = calcOverdueCount(tasks);
    const penalty     = overdue * 5;
    return Math.max(0, taskPoints + goalPoints - penalty);
};

const completionRate = (tasks) => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
};

const overdueRate = (tasks) => {
    if (!tasks.length) return 0;
    return Math.round((calcOverdueCount(tasks) / tasks.length) * 100);
};

const LEVELS = [
    { name: 'Novice',       min: 0   },
    { name: 'Apprentice',   min: 100 },
    { name: 'Competent',    min: 300 },
    { name: 'Proficient',   min: 600 },
    { name: 'Expert',       min: 1000 },
    { name: 'Master',       min: 1500 },
];

const getUserLevel = (score) => {
    let level = LEVELS[0].name;
    for (const l of LEVELS) { if (score >= l.min) level = l.name; }
    return level;
};

// ── SOCKET EMITTER ────────────────────────────────────────────────────────────
const emitToUser = async (userId, event, data) => {
    try {
        await axios.post(`${process.env.USER_API_URL}/api/emit`, { event, data: { userId, ...data } });
    } catch (_) {}
};

// ── SCOPE FILTER ──────────────────────────────────────────────────────────────
const getSectorUserIds = async (admin) => {
    if (admin.role === 'team-lead') {
        if (!admin.managedSector) return null;
        const users = await User.find({ unitSector: admin.managedSector }).select('_id');
        return users.map(u => u._id);
    }
    // Executive and super-admin see all
    const users = await User.find({ isActive: true }).select('_id');
    return users.map(u => u._id);
};

// ── ORG-WIDE / TEAM LEADERBOARD ───────────────────────────────────────────────
export const getLeaderboard = async (req, res) => {
    try {
        const { unitSector, limit = 50 } = req.query;

        let userFilter = { isActive: true };

        // Team-lead: only their sector
        if (req.admin.role === 'team-lead') {
            if (!req.admin.managedSector) {
                return res.status(403).json({ success: false, message: 'No managed sector assigned' });
            }
            userFilter.unitSector = req.admin.managedSector;
        } else if (unitSector) {
            // Exec/super-admin can filter by sector
            userFilter.unitSector = unitSector;
        }

        const users = await User.find(userFilter)
            .select('firstName lastName otherName email role points level badges lastActive position unitSector')
            .lean();

        const userIds = users.map(u => u._id);

        const [allTasks, allGoals] = await Promise.all([
            Task.find({ owner: { $in: userIds } })
                .select('owner priority completed submissionStatus checklist dueDate')
                .lean(),
            Goal.find({ owner: { $in: userIds } })
                .select('owner subGoals')
                .lean(),
        ]);

        // Index tasks/goals per user
        const taskMap = {};
        const goalMap = {};
        allTasks.forEach(t => {
            const uid = t.owner.toString();
            if (!taskMap[uid]) taskMap[uid] = [];
            taskMap[uid].push(t);
        });
        allGoals.forEach(g => {
            const uid = g.owner.toString();
            if (!goalMap[uid]) goalMap[uid] = [];
            goalMap[uid].push(g);
        });

        let leaderboard = users.map(u => {
            const uid   = u._id.toString();
            const tasks = taskMap[uid] || [];
            const goals = goalMap[uid] || [];
            const score = calcUserScore(tasks, goals);
            return {
                _id:            u._id,
                firstName:      u.firstName,
                lastName:       u.lastName,
                otherName:      u.otherName,
                email:          u.email,
                position:       u.position,
                unitSector:     u.unitSector,
                role:           u.role,
                totalScore:     score,
                level:          getUserLevel(score),
                completionRate: completionRate(tasks),
                overdueRate:    overdueRate(tasks),
                taskCount:      tasks.length,
                completedTasks: tasks.filter(t => t.completed).length,
                goalCount:      goals.length,
                completedGoals: goals.filter(g => g.subGoals?.every(s => s.completed)).length,
                badges:         u.badges || [],
                lastActive:     u.lastActive,
                rank:           0,
            };
        });

        leaderboard.sort((a, b) => b.totalScore - a.totalScore);
        leaderboard.forEach((u, i) => { u.rank = i + 1; });

        const sliced = leaderboard.slice(0, parseInt(limit));

        res.json({
            success: true,
            leaderboard: {
                top3: sliced.slice(0, 3),
                rest: sliced.slice(3),
            },
            allUsers: sliced,
            total:    leaderboard.length,
        });
    } catch (err) {
        console.error('Admin leaderboard error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── PERFORMANCE DETAILS FOR A SPECIFIC USER ───────────────────────────────────
export const getUserPerformance = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findById(userId)
            .select('firstName lastName otherName email role position unitSector level badges activityLogs points')
            .lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Team-lead sector check
        if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: User not in your team' });
        }

        const [tasks, goals] = await Promise.all([
            Task.find({ owner: userId })
                .select('title priority completed submissionStatus checklist dueDate description')
                .lean(),
            Goal.find({ owner: userId })
                .select('title subGoals timeframe startDate endDate')
                .lean(),
        ]);

        const totalScore = calcUserScore(tasks, goals);

        // Per-priority breakdown
        const byPriority = { Low: { count: 0, completed: 0 }, Medium: { count: 0, completed: 0 }, High: { count: 0, completed: 0 } };
        tasks.forEach(t => {
            const p = t.priority || 'Low';
            if (byPriority[p]) {
                byPriority[p].count++;
                if (t.completed) byPriority[p].completed++;
            }
        });

        const goalDetails = goals.map(g => {
            const done     = g.subGoals?.filter(s => s.completed).length || 0;
            const total    = g.subGoals?.length || 0;
            const progress = total ? Math.round((done / total) * 100) : 0;
            return { title: g.title, timeframe: g.timeframe, done, total, progress, points: calcGoalScore(g) };
        });

        res.json({
            success: true,
            user: {
                _id:        user._id,
                firstName:  user.firstName,
                lastName:   user.lastName,
                otherName:  user.otherName,
                email:      user.email,
                role:       user.role,
                position:   user.position,
                unitSector: user.unitSector,
                badges:     user.badges || [],
                points:     user.points || 0,
            },
            totalScore,
            level:          getUserLevel(totalScore),
            completionRate: completionRate(tasks),
            overdueRate:    overdueRate(tasks),
            taskCount:      tasks.length,
            completedTasks: tasks.filter(t => t.completed).length,
            goalCount:      goals.length,
            completedGoals: goals.filter(g => g.subGoals?.every(s => s.completed)).length,
            byPriority,
            goalDetails,
            bonusHistory: user.activityLogs?.filter(l => l.action === 'bonus_awarded') || [],
        });
    } catch (err) {
        console.error('Get user performance error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── ORG / TEAM PERFORMANCE OVERVIEW ──────────────────────────────────────────
// Aggregated stats — used by executive dashboard
export const getPerformanceOverview = async (req, res) => {
    try {
        const { unitSector } = req.query;

        let userFilter = { isActive: true };
        if (req.admin.role === 'team-lead') {
            if (!req.admin.managedSector) {
                return res.status(403).json({ success: false, message: 'No managed sector assigned' });
            }
            userFilter.unitSector = req.admin.managedSector;
        } else if (unitSector) {
            userFilter.unitSector = unitSector;
        }

        const users   = await User.find(userFilter).select('_id unitSector').lean();
        const userIds = users.map(u => u._id);

        const [tasks, goals] = await Promise.all([
            Task.find({ owner: { $in: userIds } })
                .select('owner completed dueDate submissionStatus priority')
                .lean(),
            Goal.find({ owner: { $in: userIds } }).select('owner subGoals').lean(),
        ]);

        const totalTasks     = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const overdueTasks   = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
        const approvedTasks  = tasks.filter(t => t.submissionStatus === 'approved').length;
        const submittedTasks = tasks.filter(t => t.submissionStatus === 'submitted').length;

        const totalGoals     = goals.length;
        const completedGoals = goals.filter(g => g.subGoals?.every(s => s.completed)).length;

        // Per-sector breakdown (for executives/super-admin)
        const sectorMap = {};
        users.forEach(u => {
            if (!sectorMap[u.unitSector]) sectorMap[u.unitSector] = { users: 0, userIds: [] };
            sectorMap[u.unitSector].users++;
            sectorMap[u.unitSector].userIds.push(u._id.toString());
        });

        const bySector = Object.entries(sectorMap).map(([sector, data]) => {
            const sectorTasks = tasks.filter(t => data.userIds.includes(t.owner.toString()));
            const done        = sectorTasks.filter(t => t.completed).length;
            return {
                sector,
                users:          data.users,
                totalTasks:     sectorTasks.length,
                completedTasks: done,
                completionRate: sectorTasks.length ? Math.round((done / sectorTasks.length) * 100) : 0,
            };
        });

        res.json({
            success: true,
            overview: {
                totalUsers:      users.length,
                totalTasks,
                completedTasks,
                incompleteTasks: totalTasks - completedTasks,
                overdueTasks,
                approvedTasks,
                submittedTasks,
                completionRate:  totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
                totalGoals,
                completedGoals,
                goalCompletionRate: totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0,
                bySector,
            },
        });
    } catch (err) {
        console.error('Performance overview error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── AWARD BONUS (super-admin and executive) ───────────────────────────────────
export const awardBonus = async (req, res) => {
    try {
        if (req.admin.role === 'team-lead') {
            return res.status(403).json({ success: false, message: 'Team leads cannot award bonuses' });
        }

        const { userId, bonusAmount, reason } = req.body;

        if (!userId || !bonusAmount || bonusAmount <= 0) {
            return res.status(400).json({ success: false, message: 'userId and a positive bonusAmount are required' });
        }
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.points = (user.points || 0) + bonusAmount;
        user.level  = getUserLevel(user.points);
        user.activityLogs.push({
            action:    'bonus_awarded',
            details:   `${bonusAmount} points awarded by ${req.admin.firstName} ${req.admin.lastName} (${req.admin.role}). Reason: ${reason || 'No reason provided'}`,
            timestamp: new Date(),
        });
        await user.save();

        await emitToUser(userId, 'bonusAwarded', {
            points:   bonusAmount,
            reason:   reason || '',
            newTotal: user.points,
        });

        res.json({
            success: true,
            message:   `${bonusAmount} points awarded to ${user.firstName} ${user.lastName}`,
            newPoints: user.points,
            newLevel:  user.level,
        });
    } catch (err) {
        console.error('Award bonus error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── TOP / BOTTOM PERFORMERS ───────────────────────────────────────────────────
export const getTopPerformers = async (req, res) => {
    try {
        const { top = 5, bottom = 5, unitSector } = req.query;

        let userFilter = { isActive: true };
        if (req.admin.role === 'team-lead') {
            if (!req.admin.managedSector) {
                return res.status(403).json({ success: false, message: 'No managed sector assigned' });
            }
            userFilter.unitSector = req.admin.managedSector;
        } else if (unitSector) {
            userFilter.unitSector = unitSector;
        }

        const users   = await User.find(userFilter).select('firstName lastName email position unitSector').lean();
        const userIds = users.map(u => u._id);

        const [allTasks, allGoals] = await Promise.all([
            Task.find({ owner: { $in: userIds } }).select('owner completed submissionStatus checklist dueDate priority').lean(),
            Goal.find({ owner: { $in: userIds } }).select('owner subGoals').lean(),
        ]);

        const taskMap = {};
        const goalMap = {};
        allTasks.forEach(t => { const uid = t.owner.toString(); if (!taskMap[uid]) taskMap[uid] = []; taskMap[uid].push(t); });
        allGoals.forEach(g => { const uid = g.owner.toString(); if (!goalMap[uid]) goalMap[uid] = []; goalMap[uid].push(g); });

        const scored = users.map(u => {
            const uid   = u._id.toString();
            const tasks = taskMap[uid] || [];
            const goals = goalMap[uid] || [];
            return {
                _id:            u._id,
                firstName:      u.firstName,
                lastName:       u.lastName,
                email:          u.email,
                position:       u.position,
                unitSector:     u.unitSector,
                totalScore:     calcUserScore(tasks, goals),
                completionRate: completionRate(tasks),
                taskCount:      tasks.length,
            };
        }).sort((a, b) => b.totalScore - a.totalScore);

        res.json({
            success:        true,
            topPerformers:    scored.slice(0, parseInt(top)),
            bottomPerformers: scored.slice(-parseInt(bottom)).reverse(),
        });
    } catch (err) {
        console.error('Top performers error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};