// Connects to the same 'Task' collection as the user-side backend.
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Low',
        },
        dueDate: { type: Date },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        // For team-lead assignment: which admin/team-lead assigned this task
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null,
        },
        completed: { type: Boolean, default: false },
        checklist: [
            {
                text:      { type: String, required: true },
                completed: { type: Boolean, default: false },
            },
        ],
        submissionStatus: {
            type: String,
            enum: ['not_submitted', 'submitted', 'approved', 'rejected'],
            default: 'not_submitted',
        },
        appealStatus: {
            type: String,
            enum: ['not_appealed', 'accepted', 'rejected'],
            default: 'not_appealed',
        },
        createdByAdmin: { type: Boolean, default: false },
        // Approval workflow: which team lead reviewed this submission
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null,
        },
        reviewedAt: { type: Date },
        rejectionReason: { type: String, default: '' },
        files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    },
    { timestamps: true }
);

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;