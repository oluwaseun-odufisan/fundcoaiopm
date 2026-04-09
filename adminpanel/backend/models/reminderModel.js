// Connects to the same 'Reminder' collection as the user-side backend.
import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
        type: {
            type: String,
            enum: ['task_due', 'meeting', 'goal_deadline', 'appraisal_submission', 'manager_feedback', 'custom'],
            required: true,
        },
        targetId:    { type: mongoose.Schema.Types.ObjectId },
        targetModel: { type: String, enum: ['Task', 'Goal', 'Meeting', 'Custom'] },
        message:     { type: String, required: true },
        deliveryChannels: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
            push:  { type: Boolean, default: false },
        },
        remindAt:    { type: Date, required: true },
        status: {
            type: String,
            enum: ['pending', 'sent', 'dismissed'],
            default: 'pending',
        },
        snoozeUntil: { type: Date, default: null },
        createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        isUserCreated:{ type: Boolean, default: false },
        isActive:    { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);
export default Reminder;