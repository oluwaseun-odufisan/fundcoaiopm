// adminTaskModel.js
import mongoose from 'mongoose';
 
// Reuse the user-side Task model by connecting to the same database
const Task = mongoose.models.Task || mongoose.model('Task', new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low',
    },
    dueDate: {
        type: Date,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    checklist: [{
        text: {
            type: String,
            required: true,
        },
        completed: {
            type: Boolean,
            default: false,
        }
    }],
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
    createdByAdmin: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    files: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
    }],
}));
 
export default Task;