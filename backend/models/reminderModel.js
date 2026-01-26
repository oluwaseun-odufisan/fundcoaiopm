import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        type: {
            type: String,
            enum: ['task_due', 'meeting', 'goal_deadline', 'appraisal_submission', 'manager_feedback', 'custom'],
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        targetModel: {
            type: String,
            enum: ['Task', 'Meeting', 'Goal', 'Appraisal', 'Feedback', null],
            required: false,
        },
        message: {
            type: String,
            trim: true,
            required: true,
        },
        deliveryChannels: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: false },
        },
        remindAt: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'snoozed', 'dismissed'],
            default: 'pending',
        },
        snoozeUntil: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        isUserCreated: {
            type: Boolean,
            default: false,
        },
        repeatInterval: {
            type: Number,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        emailOverride: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
        },
    },
    { timestamps: true }
);

reminderSchema.index({ user: 1, remindAt: 1, status: 1 });

const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);

export default Reminder;