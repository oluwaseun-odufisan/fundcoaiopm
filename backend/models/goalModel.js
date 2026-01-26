import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    subGoals: [{
        title: {
            type: String,
            required: true,
            trim: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            default: null,
        },
    }],
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
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const Goal = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
export default Goal;