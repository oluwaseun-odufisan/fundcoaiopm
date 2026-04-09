import jwt from 'jsonwebtoken';
import validator from 'validator';
import Admin from '../models/adminModel.js';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const TOKEN_EXPIRES = '24h';

const createToken = (adminId) =>
    jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

// ── SIGNUP ────────────────────────────────────────────────────────────────────
// Only super-admins can create other admin accounts (enforced in routes).
// The very first super-admin can be seeded via the /seed endpoint.
export const signupAdmin = async (req, res) => {
    const { firstName, lastName, otherName, position, unitSector, email, password, role, managedSector } = req.body;

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
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters',
        });
    }
    if (!['team-lead', 'executive', 'super-admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    try {
        const existing = await Admin.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Admin account already exists with this email' });
        }

        const admin = new Admin({
            firstName,
            lastName,
            otherName:     otherName || '',
            position:      position || '',
            unitSector:    unitSector || '',
            email,
            password,      // hashed by pre-save hook
            role,
            managedSector: managedSector || '',
        });

        admin.activityLogs.push({
            action:  'account_created',
            details: `Account created${req.admin ? ` by super-admin ${req.admin.email}` : ' via seed'}`,
        });

        await admin.save();

        const token = createToken(admin._id);

        res.status(201).json({
            success: true,
            token,
            admin: {
                id:            admin._id,
                firstName:     admin.firstName,
                lastName:      admin.lastName,
                otherName:     admin.otherName,
                fullName:      admin.fullName,
                position:      admin.position,
                unitSector:    admin.unitSector,
                email:         admin.email,
                role:          admin.role,
                managedSector: admin.managedSector,
                notifications: admin.notifications,
            },
        });
    } catch (err) {
        console.error('Admin signup error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    // ←←← ADD THESE LOGS (temporary)
    console.log('\n=== LOGIN ATTEMPT RECEIVED ===');
    console.log('Raw email from frontend :', `'${email}'`);
    console.log('Raw password length    :', password ? password.length : 0);
    console.log('Full req.body          :', req.body);

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // ←←← PERMANENT FIX: normalize email
    const normalizedEmail = email.toLowerCase().trim();

    try {
        const admin = await Admin.findOne({ email: normalizedEmail });

        console.log('Admin found after normalization?', !!admin);

        if (!admin || !admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials or account disabled',
            });
        }

        const matched = await admin.comparePassword(password);
        console.log('Password comparison result:', matched);

        if (!matched) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const now = new Date();
        admin.lastLogin  = now;
        admin.lastActive = now;
        admin.activityLogs.push({
            action:  'login',
            details: `Logged in from IP ${req.ip}`,
        });
        await admin.save();

        const token = createToken(admin._id);
        res.json({
            success: true,
            token,
            admin: {
                id:            admin._id,
                firstName:     admin.firstName,
                lastName:      admin.lastName,
                otherName:     admin.otherName,
                fullName:      admin.fullName,
                position:      admin.position,
                unitSector:    admin.unitSector,
                email:         admin.email,
                role:          admin.role,
                managedSector: admin.managedSector,
                notifications: admin.notifications,
                lastLogin:     admin.lastLogin,
            },
        });
    } catch (err) {
        console.error('Admin login error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// ── GET CURRENT ADMIN ─────────────────────────────────────────────────────────
export const getCurrentAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password -activityLogs');
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, admin });
    } catch (err) {
        console.error('Get current admin error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
export const updateAdminProfile = async (req, res) => {
    const { firstName, lastName, otherName, position, unitSector, email, notifications, managedSector } = req.body;

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
        const emailConflict = await Admin.findOne({ email, _id: { $ne: req.admin.id } });
        if (emailConflict) {
            return res.status(409).json({ success: false, message: 'Email already in use by another account' });
        }

        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        admin.firstName     = firstName.trim();
        admin.lastName      = lastName.trim();
        admin.otherName     = otherName || '';
        admin.position      = position || '';
        admin.unitSector    = unitSector || '';
        admin.email         = email.toLowerCase().trim();
        admin.managedSector = managedSector || admin.managedSector;
        if (typeof notifications === 'boolean') admin.notifications = notifications;

        admin.activityLogs.push({
            action:  'profile_updated',
            details: `Profile updated from IP ${req.ip}`,
        });
        await admin.save();

        res.json({
            success: true,
            admin: {
                id:            admin._id,
                firstName:     admin.firstName,
                lastName:      admin.lastName,
                otherName:     admin.otherName,
                fullName:      admin.fullName,
                position:      admin.position,
                unitSector:    admin.unitSector,
                email:         admin.email,
                role:          admin.role,
                managedSector: admin.managedSector,
                notifications: admin.notifications,
            },
        });
    } catch (err) {
        console.error('Update admin profile error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
export const changeAdminPassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All password fields are required' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'New password must be at least 8 characters',
        });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    try {
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const matched = await admin.comparePassword(currentPassword);
        if (!matched) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        admin.password = newPassword; // hashed by pre-save hook
        admin.activityLogs.push({
            action:  'password_changed',
            details: `Password changed from IP ${req.ip}`,
        });
        await admin.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change admin password error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── LIST ALL ADMINS (super-admin only) ────────────────────────────────────────
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find()
            .select('-password -activityLogs')
            .sort({ createdAt: -1 });
        res.json({ success: true, admins });
    } catch (err) {
        console.error('Get all admins error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET SINGLE ADMIN (super-admin only) ───────────────────────────────────────
export const getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.adminId).select('-password');
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, admin });
    } catch (err) {
        console.error('Get admin by id error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── UPDATE ANY ADMIN (super-admin only) ───────────────────────────────────────
export const updateAnyAdmin = async (req, res) => {
    const { firstName, lastName, otherName, position, unitSector, email, role, managedSector, isActive, notifications } = req.body;

    try {
        const admin = await Admin.findById(req.params.adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (email && email !== admin.email) {
            if (!validator.isEmail(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email' });
            }
            const conflict = await Admin.findOne({ email, _id: { $ne: admin._id } });
            if (conflict) {
                return res.status(409).json({ success: false, message: 'Email already in use' });
            }
            admin.email = email.toLowerCase().trim();
        }

        if (role && !['team-lead', 'executive', 'super-admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        if (firstName)     admin.firstName     = firstName.trim();
        if (lastName)      admin.lastName      = lastName.trim();
        if (otherName !== undefined)  admin.otherName  = otherName;
        if (position !== undefined)   admin.position   = position;
        if (unitSector !== undefined) admin.unitSector = unitSector;
        if (role)          admin.role          = role;
        if (managedSector !== undefined) admin.managedSector = managedSector;
        if (typeof isActive === 'boolean')       admin.isActive = isActive;
        if (typeof notifications === 'boolean')  admin.notifications = notifications;

        admin.activityLogs.push({
            action:  'account_updated',
            details: `Updated by super-admin ${req.admin.email}`,
        });
        await admin.save();

        res.json({ success: true, admin: { ...admin.toObject(), password: undefined } });
    } catch (err) {
        console.error('Update any admin error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── RESET ADMIN PASSWORD (super-admin only) ───────────────────────────────────
export const resetAdminPassword = async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'New password must be at least 8 characters',
        });
    }

    try {
        const admin = await Admin.findById(req.params.adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        admin.password = newPassword; // hashed by pre-save hook
        admin.activityLogs.push({
            action:  'password_reset',
            details: `Reset by super-admin ${req.admin.email}`,
        });
        await admin.save();

        res.json({ success: true, message: 'Admin password reset successfully' });
    } catch (err) {
        console.error('Reset admin password error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── DEACTIVATE / ACTIVATE ADMIN (super-admin only) ───────────────────────────
export const toggleAdminStatus = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Prevent super-admin from deactivating themselves
        if (admin._id.toString() === req.admin._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account',
            });
        }

        admin.isActive = !admin.isActive;
        admin.activityLogs.push({
            action:  admin.isActive ? 'account_activated' : 'account_deactivated',
            details: `Status changed by super-admin ${req.admin.email}`,
        });
        await admin.save();

        res.json({
            success: true,
            message: `Admin account ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: admin.isActive,
        });
    } catch (err) {
        console.error('Toggle admin status error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── DELETE ADMIN (super-admin only) ───────────────────────────────────────────
export const deleteAdmin = async (req, res) => {
    try {
        if (req.params.adminId === req.admin._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account',
            });
        }

        const admin = await Admin.findByIdAndDelete(req.params.adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({ success: true, message: 'Admin account deleted successfully' });
    } catch (err) {
        console.error('Delete admin error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET ADMIN ACTIVITY LOGS (super-admin only) ────────────────────────────────
export const getAdminActivityLogs = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.adminId).select('activityLogs firstName lastName email');
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, activityLogs: admin.activityLogs });
    } catch (err) {
        console.error('Get admin activity logs error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── TOKEN VERIFY (used by user-side backend) ──────────────────────────────────
export const verifyAdminToken = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required' });
    }
    try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select('role isActive email firstName lastName');
        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid or inactive admin account' });
        }
        res.json({
            success: true,
            admin: {
                id:        decoded.id,
                role:      admin.role,
                email:     admin.email,
                firstName: admin.firstName,
                lastName:  admin.lastName,
            },
        });
    } catch (err) {
        if (err.name === 'JsonWebTokenError')  return res.status(401).json({ success: false, message: 'Invalid token' });
        if (err.name === 'TokenExpiredError')  return res.status(401).json({ success: false, message: 'Token expired' });
        res.status(500).json({ success: false, message: 'Server error during token verification' });
    }
};