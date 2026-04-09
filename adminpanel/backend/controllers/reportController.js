import mongoose from 'mongoose';
import axios from 'axios';
import Report from '../models/reportModel.js';
import User from '../models/userModel.js';

// ── SOCKET EMITTER ────────────────────────────────────────────────────────────
const emitToUser = async (userId, event, data) => {
    try {
        await axios.post(`${process.env.USER_API_URL}/api/emit`, { event, data: { userId, ...data } });
    } catch (err) {
        console.error(`Socket emit [${event}] error:`, err.message);
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

// ── GET ALL REPORTS ───────────────────────────────────────────────────────────
// Team-lead: their sector only
// Executive: all (read + review can approve/reject, handled below)
// Super-admin: all + export
export const getAllReports = async (req, res) => {
    try {
        const { status, type, userId, unitSector, search, page = 1, limit = 20 } = req.query;

        const scopeFilter = await buildScopeFilter(req.admin);
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const query = { ...scopeFilter };

        if (status) query.status     = status;
        if (type)   query.reportType = type;

        if (userId) {
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ success: false, message: 'Invalid user ID' });
            }
            if (req.admin.role === 'team-lead') {
                const u = await User.findById(userId).select('unitSector');
                if (u?.unitSector !== req.admin.managedSector) {
                    return res.status(403).json({ success: false, message: 'Access denied' });
                }
            }
            query.user = userId;
        }

        if (unitSector && req.admin.role !== 'team-lead') {
            const sectorUsers = await User.find({ unitSector }).select('_id');
            query.user = { $in: sectorUsers.map(u => u._id) };
        }

        if (search) query.$text = { $search: search };

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await Report.countDocuments(query);

        const reports = await Report.find(query)
            .populate('user',       'firstName lastName email unitSector position')
            .populate('reviewedBy', 'firstName lastName email role')
            .populate('selectedTasks', 'title completed')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            reports,
            pagination: {
                total,
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error('Get all reports error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET SINGLE REPORT ─────────────────────────────────────────────────────────
export const getReportById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid report ID' });
        }

        const report = await Report.findById(req.params.id)
            .populate('user',          'firstName lastName email unitSector position')
            .populate('reviewedBy',    'firstName lastName email role')
            .populate('selectedTasks', 'title completed dueDate priority');

        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        if (req.admin.role === 'team-lead') {
            const owner = await User.findById(report.user._id).select('unitSector');
            if (owner?.unitSector !== req.admin.managedSector) {
                return res.status(403).json({ success: false, message: 'Access denied: Report not in your team' });
            }
        }

        res.json({ success: true, report });
    } catch (err) {
        console.error('Get report by id error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── REVIEW REPORT (approve / reject) ─────────────────────────────────────────
// Team-lead: reviews their sector's submitted reports
// Executive/Super-admin: reviews all submitted reports
export const reviewReport = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid report ID' });
        }

        const { action, feedback } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" });
        }

        const report = await Report.findById(req.params.id)
            .populate('user', 'unitSector firstName lastName email');

        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

        if (report.status !== 'submitted') {
            return res.status(400).json({ success: false, message: 'Only submitted reports can be reviewed' });
        }

        if (req.admin.role === 'team-lead' && report.user?.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: Report not in your team' });
        }

        report.status     = action === 'approve' ? 'approved' : 'rejected';
        report.reviewedBy = req.admin._id;
        report.reviewedAt = new Date();
        report.feedback   = feedback || '';
        await report.save();

        // Notify the report owner
        await emitToUser(report.user._id, 'report:reviewed', {
            reportId: report._id,
            title:    report.title,
            status:   report.status,
            feedback: report.feedback,
            reviewedBy: `${req.admin.firstName} ${req.admin.lastName}`,
        });

        res.json({ success: true, report });
    } catch (err) {
        console.error('Review report error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET SUBMITTED REPORTS (pending review) ────────────────────────────────────
export const getPendingReports = async (req, res) => {
    try {
        const scopeFilter = await buildScopeFilter(req.admin, { status: 'submitted' });
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const reports = await Report.find(scopeFilter)
            .populate('user', 'firstName lastName email unitSector position')
            .sort({ submittedAt: 1 }); // oldest first — review in order

        res.json({ success: true, reports, total: reports.length });
    } catch (err) {
        console.error('Get pending reports error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── REPORT SUMMARY / STATS ────────────────────────────────────────────────────
export const getReportStats = async (req, res) => {
    try {
        const scopeFilter = await buildScopeFilter(req.admin);
        if (!scopeFilter) {
            return res.status(403).json({ success: false, message: 'No managed sector assigned' });
        }

        const [total, draft, submitted, approved, rejected] = await Promise.all([
            Report.countDocuments(scopeFilter),
            Report.countDocuments({ ...scopeFilter, status: 'draft' }),
            Report.countDocuments({ ...scopeFilter, status: 'submitted' }),
            Report.countDocuments({ ...scopeFilter, status: 'approved' }),
            Report.countDocuments({ ...scopeFilter, status: 'rejected' }),
        ]);

        // Per-user breakdown
        const pipeline = [
            { $match: scopeFilter },
            {
                $group: {
                    _id:      '$user',
                    total:    { $sum: 1 },
                    approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                    pending:  { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
                },
            },
            {
                $lookup: {
                    from: 'users', localField: '_id', foreignField: '_id', as: 'user',
                },
            },
            { $unwind: { path: '$user', preserveNullAndEmpty: true } },
            {
                $project: {
                    name:     { $concat: ['$user.firstName', ' ', '$user.lastName'] },
                    email:    '$user.email',
                    sector:   '$user.unitSector',
                    total:    1, approved: 1, rejected: 1, pending: 1,
                },
            },
            { $sort: { total: -1 } },
        ];

        const perUser = await Report.aggregate(pipeline);

        res.json({
            success: true,
            stats: { total, draft, submitted, approved, rejected, perUser },
        });
    } catch (err) {
        console.error('Report stats error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── EXPORT REPORTS (executive and super-admin) ────────────────────────────────
// Returns full report data for CSV/PDF export on the frontend
export const exportReports = async (req, res) => {
    try {
        if (req.admin.role === 'team-lead') {
            return res.status(403).json({ success: false, message: 'Team leads cannot export org-wide reports' });
        }

        const { status, type, unitSector, from, to } = req.query;
        const query = {};

        if (status)     query.status     = status;
        if (type)       query.reportType = type;
        if (unitSector) {
            const sectorUsers = await User.find({ unitSector }).select('_id');
            query.user = { $in: sectorUsers.map(u => u._id) };
        }
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to)   query.createdAt.$lte = new Date(to);
        }

        const reports = await Report.find(query)
            .populate('user',       'firstName lastName email unitSector position')
            .populate('reviewedBy', 'firstName lastName email')
            .sort({ createdAt: -1 });

        // Return raw data — frontend handles CSV/PDF generation
        res.json({ success: true, reports, total: reports.length });
    } catch (err) {
        console.error('Export reports error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};