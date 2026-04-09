// Connects to the same 'Goal' collection as the user-side backend.
import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        subGoals: [
            {
                title:     { type: String, required: true, trim: true },
                completed: { type: Boolean, default: false },
                taskId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
            },
        ],
        type: {
            type: String,
            enum: ['task', 'personal'],
            default: 'personal',
        },
        timeframe: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'custom'],
            required: true,
        },
        startDate: { type: Date, required: true },
        endDate:   { type: Date, required: true },
        associatedTasks: [
            { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: [] },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        // For team-lead / exec created goals
        createdByAdmin: { type: Boolean, default: false },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
            default: null,
        },
        // Org-wide or team goals (set by exec / super-admin)
        scope: {
            type: String,
            enum: ['personal', 'team', 'organization'],
            default: 'personal',
        },
    },
    { timestamps: true }
);

const Goal = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
export default Goal;