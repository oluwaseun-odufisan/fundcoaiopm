// Updated models/userModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
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
        activityLogs: [{
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
        pushToken: {
            type: String,
            trim: true,
        },
        preferences: {
            reminders: {
                defaultDeliveryChannels: {
                    inApp: { type: Boolean, default: true },
                    email: { type: Boolean, default: true }, // Default to true
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
        points: {
            type: Number,
            default: 0,
        },
        badges: [{
            type: String,
        }],
        level: {
            type: String,
            default: 'Novice',
        },
        redemptionHistory: [{
            amount: Number,
            date: { type: Date, default: Date.now },
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        }],
    },
    { timestamps: true }
);

const User = mongoose.models.user || mongoose.model('user', userSchema);
export default User;