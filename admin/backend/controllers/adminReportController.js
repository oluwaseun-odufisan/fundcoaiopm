// admin/backend/controllers/adminReportController.js
import Report from '../models/adminReportModel.js';
import File from '../models/adminFileModel.js';
import User from '../models/adminUserModel.js';
import axios from 'axios';

const emitSocketEvent = async (event, data) => {
  try {
    await axios.post('http://localhost:4001/api/emit', { event, data }, {
      headers: { Authorization: `Bearer ${process.env.ADMIN_JWT_SECRET || 'your_jwt_secret_here'}` },
    });
  } catch (err) {
    console.error('Socket emit failed:', err.message);
  }
};

// ADMIN DEFAULT: ONLY SUBMITTED + REVIEWED (NO DRAFTS, NO AI-GENERATED)
export const getAllReports = async (req, res) => {
  if (req.admin?.role !== 'super-admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Super-admin only' });
  }

  try {
    const { status, userEmail, page = 1, limit = 20 } = req.query;
    const query = { aiGenerated: false };   // Hide AI-generated reports

    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['submitted', 'reviewed'] }; // Default: only submitted + reviewed
    }

    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (user) query.user = user._id;
    }

    const reports = await Report.find(query)
      .populate('user', 'name email')
      .populate('selectedTasks', 'title')
      .populate('attachments', 'fileName cid type')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('=== ADMIN REPORTS ERROR ===', err);
    res.status(500).json({ success: false, message: 'Server error while fetching reports' });
  }
};

export const getReportById = async (req, res) => {
  if (req.admin?.role !== 'super-admin') return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'name email')
      .populate('selectedTasks', 'title description checklist')
      .populate('attachments', 'fileName cid type')
      .populate('reviewedBy', 'name email');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const reviewReport = async (req, res) => {
  if (req.admin?.role !== 'super-admin') return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const { feedback } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'reviewed',
        feedback: feedback || '',
        reviewedBy: req.admin._id,
        reviewedAt: new Date(),
        $push: { versions: { content: 'Reviewed by admin', updatedAt: new Date(), updatedBy: req.admin.email } },
      },
      { new: true }
    ).populate('user', 'name email');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    await emitSocketEvent('reportReviewed', { reportId: report._id, status: 'reviewed', feedback });
    res.json({ success: true, message: 'Report reviewed successfully', report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteReport = async (req, res) => {
  if (req.admin?.role !== 'super-admin') return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    await emitSocketEvent('reportDeleted', { reportId: req.params.id });
    res.json({ success: true, message: 'Report deleted permanently' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getReportsStats = async (req, res) => {
  if (req.admin?.role !== 'super-admin') return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const [total, submitted, reviewed, aiGenerated] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'submitted' }),
      Report.countDocuments({ status: 'reviewed' }),
      Report.countDocuments({ aiGenerated: true }),
    ]);
    res.json({ success: true, stats: { total, submitted, reviewed, aiGenerated, draft: total - submitted - reviewed } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};