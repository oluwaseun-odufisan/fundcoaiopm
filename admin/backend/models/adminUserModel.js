import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        otherName: {
            type: String,
            trim: true,
        },
        position: {        // Position held / Job Role
            type: String,
            trim: true,
        },
        unitSector: {      // Unit/Sector of the company
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validate: [validator.isEmail, 'Invalid email address'],
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['standard', 'team-lead', 'admin'],
            default: 'standard',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        lastLogin: {
            type: Date,
        },
        activityLogs: {
            type: [{
                action: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                details: {
                    type: String,
                },
            }],
            default: [],          // ← Fixed: prevents "Cannot read properties of undefined (reading 'push')"
        },
        pushToken: {
            type: String,
            trim: true,
        },
        preferences: {
            reminders: {
                defaultDeliveryChannels: {
                    inApp: { type: Boolean, default: true },
                    email: { type: Boolean, default: true },
                    push: { type: Boolean, default: false },
                },
                defaultReminderTimes: {
                    task_due: { type: Number, default: 60 },
                    meeting: { type: Number, default: 30 },
                    goal_deadline: { type: Number, default: 1440 },
                    appraisal_submission: { type: Number, default: 1440 },
                    manager_feedback: { type: Number, default: 720 },
                    custom: { type: Number, default: 60 },
                },
            },
        },
    },
    { timestamps: true }
);

// Virtual fullName for easy display
userSchema.virtual('fullName').get(function() {
    const parts = [this.firstName, this.lastName];
    if (this.otherName) parts.push(this.otherName);
    return parts.join(' ');
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.models.user || mongoose.model('user', userSchema);
export default User;