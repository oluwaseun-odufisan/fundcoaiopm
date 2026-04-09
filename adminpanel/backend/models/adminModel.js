import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const adminSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
        },
        otherName: {
            type: String,
            trim: true,
            default: '',
        },
        position: {
            type: String,
            trim: true,
            default: '',
        },
        unitSector: {
            type: String,
            trim: true,
            default: '',
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, 'Invalid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
        },
        role: {
            type: String,
            required: [true, 'Role is required'],
            // team-lead: manages their team tasks/goals/reports
            // executive: org-wide read + announcements + analytics
            // super-admin: full unrestricted access + system management
            enum: ['team-lead', 'executive', 'super-admin'],
            default: 'team-lead',
        },
        // For team leads - which unit/sector they manage
        managedSector: {
            type: String,
            trim: true,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
        lastActive: {
            type: Date,
        },
        avatar: {
            type: String,
            trim: true,
            default: '',
        },
        notifications: {
            type: Boolean,
            default: true,
        },
        activityLogs: {
            type: [
                {
                    action: { type: String, required: true },
                    timestamp: { type: Date, default: Date.now },
                    details: { type: String },
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

// Virtual fullName
adminSchema.virtual('fullName').get(function () {
    const parts = [this.firstName, this.lastName];
    if (this.otherName) parts.push(this.otherName);
    return parts.join(' ');
});

adminSchema.set('toJSON', { virtuals: true });
adminSchema.set('toObject', { virtuals: true });

// Hash password before saving
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export default Admin;