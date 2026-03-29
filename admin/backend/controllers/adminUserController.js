import User from '../models/adminUserModel.js';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_jwt_secret_here';

// Get all users
export async function getAllUsers(req, res) {
    try {
        if (req.admin.role !== 'super-admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const users = await User.find()
            .select('firstName lastName otherName position unitSector email role isActive createdAt lastLogin preferences fullName')
            .sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Create a new user - UPDATED
export async function createUser(req, res) {
    const { firstName, lastName, otherName, position, unitSector, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'First name, last name, email, password and role are required' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email' });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (!['standard', 'team-lead', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (req.admin.role !== 'super-admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        if (await User.findOne({ email })) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstName,
            lastName,
            otherName: otherName || '',
            position: position || '',
            unitSector: unitSector || '',
            email,
            password: hashedPassword,
            role,
            activityLogs: [{ action: 'account_created', details: `Created by admin ${req.admin.email}` }],
        });
        res.status(201).json({
            success: true,
            user: { 
                id: user._id, 
                firstName: user.firstName,
                lastName: user.lastName,
                otherName: user.otherName,
                fullName: user.fullName,
                position: user.position,
                unitSector: user.unitSector,
                email: user.email, 
                role: user.role, 
                isActive: user.isActive 
            },
        });
    } catch (err) {
        console.error('Error creating user:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Update user profile - UPDATED
export async function updateUserProfile(req, res) {
    const { userId } = req.params;
    const { firstName, lastName, otherName, position, unitSector, email, preferences } = req.body;

    if (!firstName || !lastName || !email || !validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Valid first name, last name and email required' });
    }
    if (req.admin.role !== 'super-admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already in use' });
        }
        const user = await User.findByIdAndUpdate(
            userId,
            {
                firstName,
                lastName,
                otherName,
                position,
                unitSector,
                email,
                preferences: preferences || { notifications: true },
                $push: { activityLogs: { action: 'profile_updated', details: `Updated by admin ${req.admin.email}` } },
            },
            { new: true, runValidators: true }
        ).select('firstName lastName otherName position unitSector email role preferences fullName');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error('Error updating user profile:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Reset user password - FIXED (atomic update)
export async function resetUserPassword(req, res) {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (req.admin.role !== 'super-admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(userId, {
            $set: { password: hashed },
            $push: {
                activityLogs: {
                    action: 'password_reset',
                    details: `Reset by admin ${req.admin.email}`
                }
            }
        });

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('Error resetting password:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
 
// Deactivate user account
export async function deactivateUser(req, res) {
    const { userId } = req.params;
    if (req.admin.role !== 'super-admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
 
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            {
                isActive: false,
                $push: { activityLogs: { action: 'deactivated', details: `Deactivated by admin ${req.admin.email}` } },
            },
            { new: true }
        ).select('name email isActive');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deactivated', user });
    } catch (err) {
        console.error('Error deactivating user:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
 
// Delete user account
export async function deleteUser(req, res) {
    const { userId } = req.params;
    if (req.admin.role !== 'super-admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
 
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error('Error deleting user:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
 
 
// Assign user role
export async function assignUserRole(req, res) {
    const { userId } = req.params;
    const { role } = req.body;
 
    if (!role || !['standard', 'team-lead', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (req.admin.role !== 'super-admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
 
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            {
                role,
                $push: { activityLogs: { action: 'role_assigned', details: `Role set to ${role} by admin ${req.admin.email}` } },
            },
            { new: true }
        ).select('name email role');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'Role assigned', user });
    } catch (err) {
        console.error('Error assigning role:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
 
// Get user activity logs
export async function getUserActivityLogs(req, res) {
    const { userId } = req.params;
    if (req.admin.role !== 'super-admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
 
    try {
        const user = await User.findById(userId).select('activityLogs');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, activityLogs: user.activityLogs });
    } catch (err) {
        console.error('Error fetching activity logs:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}