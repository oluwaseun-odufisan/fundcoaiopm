import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    reportType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    content: {
      type: String, // Markdown / rich text
      required: true,
    },
    metricsSnapshot: {
      totalTasks: Number,
      completedTasks: Number,
      completionRate: Number,
      overdueCount: Number,
      productivityScore: Number, // 0-100
      // Can be extended later
    },
    selectedTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    }],
    attachments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    }],
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    customPromptUsed: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    submittedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', // admin who reviewed
    },
    feedback: String,
    versions: [{
      content: String,
      metricsSnapshot: Object,
      selectedTasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      }],
      updatedAt: Date,
      updatedBy: String, // user or admin email
    }],
    tags: [{
      type: String,
      trim: true,
    }],
  },
  { timestamps: true }
);

// Indexes for fast queries
reportSchema.index({ user: 1, status: 1, createdAt: -1 });
reportSchema.index({ title: 'text', content: 'text' });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export default Report;