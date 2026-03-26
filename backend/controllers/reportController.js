import Report from '../models/reportModel.js';
import Task from '../models/taskModel.js';
import File from '../models/fileModel.js';
import { grokChat } from './grokController.js'; // Reuse existing Grok streaming

// Create manual report
export const createManualReport = async (req, res) => {
  try {
    const { title, reportType, periodStart, periodEnd, content, selectedTaskIds = [] } = req.body;

    const report = new Report({
      user: req.user._id,
      title,
      reportType,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      content,
      selectedTasks: selectedTaskIds,
      aiGenerated: false,
    });

    // Attach any uploaded images/files
    if (req.files && req.files.length > 0) {
      const fileIds = await Promise.all(
        req.files.map(async (file) => {
          // Reuse your existing pinFileToIPFS logic or call it
          const savedFile = await File.create({
            fileName: file.originalname,
            cid: file.cid || 'placeholder', // you already have upload logic
            size: file.size,
            type: file.mimetype.split('/')[1],
            owner: req.user._id,
            reportId: report._id, // new field we can add to File if needed
          });
          return savedFile._id;
        })
      );
      report.attachments = fileIds;
    }

    await report.save();
    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error('Create manual report error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// AI Generate Report (extends existing report-generator)
export const generateAIReport = async (req, res) => {
  try {
    const { reportType, periodStart, periodEnd, selectedTaskIds = [], customPrompt = '' } = req.body;

    const tasks = await Task.find({
      _id: { $in: selectedTaskIds },
      owner: req.user._id,
    }).select('title description completed checklist dueDate priority createdAt');

    if (tasks.length === 0) {
      return res.json({ success: true, content: '**No Tasks Found**\n\nNo tasks were found in the selected period for this report.' });
    }

    // Send to existing Grok report-generator tool (already perfect)
    const messages = [{
      role: 'user',
      content: `Write a natural, honest, first-person report as if I am reporting to my manager.
Use ONLY the tasks below. Do not invent anything.
Include checklist progress where relevant.
Be truthful about completed and incomplete work.

Report type: ${reportType}
Period: ${periodStart} – ${periodEnd}
${customPrompt ? `Additional instructions: ${customPrompt}` : ''}

Tasks:\n${JSON.stringify(tasks, null, 2)}`,
    }];

    // Reuse your existing Grok streaming (this will stream live)
    let fullContent = '';
    // Call your existing grokChat function (you already have it)
    await grokChat({
      body: { messages, taskContext: JSON.stringify(tasks), toolId: 'report-generator' },
      user: req.user,
    }, {
      write: (chunk) => { fullContent += chunk; },
      end: () => {},
    });

    res.json({ success: true, content: fullContent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get user's reports
export const getMyReports = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (type) query.reportType = type;

    const reports = await Report.find(query)
      .populate('selectedTasks', 'title completed')
      .populate('attachments', 'fileName cid type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single report
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id })
      .populate('selectedTasks', 'title completed dueDate priority')
      .populate('attachments', 'fileName cid type size')
      .populate('reviewedBy', 'name email');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update report (creates new version)
export const updateReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (report.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft reports can be edited' });

    // Save current version
    report.versions.push({
      content: report.content,
      metricsSnapshot: report.metricsSnapshot,
      selectedTasks: report.selectedTasks,
      updatedAt: new Date(),
      updatedBy: req.user.email,
    });

    // Update
    report.content = req.body.content || report.content;
    report.title = req.body.title || report.title;
    if (req.body.selectedTaskIds) report.selectedTasks = req.body.selectedTaskIds;

    await report.save();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit report
export const submitReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (report.status !== 'draft') return res.status(400).json({ success: false, message: 'Report already submitted' });

    report.status = 'submitted';
    report.submittedAt = new Date();
    await report.save();

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete only draft reports
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (report.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft reports can be deleted' });

    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};