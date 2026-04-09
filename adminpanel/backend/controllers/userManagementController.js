import bcrypt from 'bcryptjs';
import validator from 'validator';
import User from '../models/userModel.js';

// ── HELPER: filter users by team lead's managed sector ───────────────────────
const getSectorFilter = (admin) => {
    // Team leads can only see/manage users in their managed sector
    if (admin.role === 'team-lead') {
        return admin.managedSector ? { unitSector: admin.managedSector } : { _id: null }; // no sector = no access
    }
    return {}; // executives and super-admins see all
};

// ── GET ALL USERS ─────────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
    try {
        const filter = getSectorFilter(req.admin);
        const { role, isActive, unitSector, search } = req.query;

        if (role)      filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (unitSector && req.admin.role !== 'team-lead') filter.unitSector = unitSector;

        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName:  { $regex: search, $options: 'i' } },
                { email:     { $regex: search, $options: 'i' } },
                { position:  { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(filter)
            .select('-password -activityLogs -pushToken')
            .sort({ createdAt: -1 });

        res.json({ success: true, users, total: users.length });
    } catch (err) {
        console.error('Get all users error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET USER BY ID ────────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Team leads can only view users in their sector
        if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: User not in your team' });
        }

        res.json({ success: true, user });
    } catch (err) {
        console.error('Get user by id error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── CREATE USER (super-admin only) ────────────────────────────────────────────
export const createUser = async (req, res) => {
    const { firstName, lastName, otherName, position, unitSector, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({
            success: false,
            message: 'First name, last name, email, password and role are required',
        });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (!['standard', 'team-lead', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A user with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            otherName:  otherName || '',
            position:   position || '',
            unitSector: unitSector || '',
            email,
            password:   hashedPassword,
            role,
            activityLogs: [
                {
                    action:  'account_created',
                    details: `Created by admin ${req.admin.email} (${req.admin.role})`,
                },
            ],
        });

        // Emit socket event to user backend
        try {
            const axios = (await import('axios')).default;
            await axios.post(`${process.env.USER_API_URL}/api/emit`, {
                event: 'userCreated',
                data:  { userId: user._id },
            });
        } catch (_) { /* non-critical */ }

        res.status(201).json({
            success: true,
            user: {
                id:         user._id,
                firstName:  user.firstName,
                lastName:   user.lastName,
                otherName:  user.otherName,
                fullName:   user.fullName,
                position:   user.position,
                unitSector: user.unitSector,
                email:      user.email,
                role:       user.role,
                isActive:   user.isActive,
                createdAt:  user.createdAt,
            },
        });
    } catch (err) {
        console.error('Create user error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── UPDATE USER PROFILE ───────────────────────────────────────────────────────
// Super-admin: can update any field including role
// Team-lead: can update only users in their sector, cannot change roles
export const updateUserProfile = async (req, res) => {
    const { userId } = req.params;
    const { firstName, lastName, otherName, position, unitSector, email, role } = req.body;

    if (!firstName || !lastName || !email) {
        return res.status(400).json({
            success: false,
            message: 'First name, last name and email are required',
        });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Team leads can only update users in their sector
        if (req.admin.role === 'team-lead' && user.unitSector !== req.admin.managedSector) {
            return res.status(403).json({ success: false, message: 'Access denied: User not in your team' });
        }

        const emailConflict = await User.findOne({ email, _id: { $ne: userId } });
        if (emailConflict) {
            return res.status(409).json({ success: false, message: 'Email already in use by another account' });
        }

        user.firstName  = firstName.trim();
        user.lastName   = lastName.trim();
        user.otherName  = otherName || '';
        user.position   = position || '';
        user.unitSector = unitSector || '';
        user.email      = email.toLowerCase().trim();

        // Only super-admin can change roles
        if (role && req.admin.role === 'super-admin') {
            if (!['standard', 'team-lead', 'admin'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid user role' });
            }
            user.role = role;
        }

        user.activityLogs.push({
            action:  'profile_updated',
            details: `Updated by ${req.admin.role} ${req.admin.email}`,
        });
        await user.save();

        res.json({
            success: true,
            user: {
                id:         user._id,
                firstName:  user.firstName,
                lastName:   user.lastName,
                otherName:  user.otherName,
                fullName:   user.fullName,
                position:   user.position,
                unitSector: user.unitSector,
                email:      user.email,
                role:       user.role,
                isActive:   user.isActive,
            },
        });
    } catch (err) {
        console.error('Update user profile error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── ASSIGN USER ROLE (super-admin only) ───────────────────────────────────────
export const assignUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['standard', 'team-lead', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            {
                role,
                $push: {
                    activityLogs: {
                        action:  'role_assigned',
                        details: `Role set to '${role}' by super-admin ${req.admin.email}`,
                    },
                },
            },
            { new: true }
        ).select('firstName lastName email role');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'Role assigned successfully', user });
    } catch (err) {
        console.error('Assign user role error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── RESET USER PASSWORD (super-admin only) ────────────────────────────────────
export const resetUserPassword = async (req, res) => {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(userId, {
            $set:  { password: hashed },
            $push: {
                activityLogs: {
                    action:  'password_reset',
                    details: `Reset by super-admin ${req.admin.email}`,
                },
            },
        });

        res.json({ success: true, message: 'User password reset successfully' });
    } catch (err) {
        console.error('Reset user password error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── TOGGLE USER ACTIVE STATUS (super-admin only) ──────────────────────────────
export const toggleUserStatus = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isActive = !user.isActive;
        user.activityLogs.push({
            action:  user.isActive ? 'account_activated' : 'account_deactivated',
            details: `Status changed by super-admin ${req.admin.email}`,
        });
        await user.save();

        res.json({
            success: true,
            message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: user.isActive,
        });
    } catch (err) {
        console.error('Toggle user status error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── DELETE USER (super-admin only) ────────────────────────────────────────────
export const deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User account deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET USER ACTIVITY LOGS (super-admin only) ─────────────────────────────────
export const getUserActivityLogs = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId).select('activityLogs firstName lastName email');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, activityLogs: user.activityLogs });
    } catch (err) {
        console.error('Get user activity logs error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET USERS BY SECTOR ───────────────────────────────────────────────────────
export const getUsersBySector = async (req, res) => {
    try {
        // Executives and super-admins can pass any sector; team-leads get their own
        const sector = req.admin.role === 'team-lead'
            ? req.admin.managedSector
            : req.params.sector || req.query.sector;

        if (!sector) {
            return res.status(400).json({ success: false, message: 'Sector is required' });
        }

        const users = await User.find({ unitSector: sector })
            .select('-password -activityLogs -pushToken')
            .sort({ firstName: 1 });

        res.json({ success: true, sector, users, total: users.length });
    } catch (err) {
        console.error('Get users by sector error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET UNIQUE SECTORS ────────────────────────────────────────────────────────
export const getUniqueSectors = async (req, res) => {
    try {
        const sectors = await User.distinct('unitSector', { unitSector: { $ne: '' } });
        res.json({ success: true, sectors });
    } catch (err) {
        console.error('Get unique sectors error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};