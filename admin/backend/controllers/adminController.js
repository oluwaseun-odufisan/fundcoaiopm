import Admin from '../models/adminModel.js';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_jwt_secret_here';
const TOKEN_EXPIRES = '24h';

const createToken = (adminId) => jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

// Admin Signup
export async function signupAdmin(req, res) {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email' });
    }
    if (password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' });
    }
    if (!['super-admin', 'manager'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    try {
        if (await Admin.findOne({ email })) {
            return res.status(409).json({ success: false, message: 'Admin already exists' });
        }

        const admin = await Admin.create({ name, email, password, role });
        const token = createToken(admin._id);

        res.status(201).json({
            success: true,
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, notifications: admin.notifications },
        });
    } catch (err) {
        console.error('Error signing up admin:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Admin Login
export async function loginAdmin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or account disabled' });
        }

        const matched = await admin.comparePassword(password);
        if (!matched) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        admin.lastLogin = new Date();
        await admin.save();

        const token = createToken(admin._id);
        res.json({
            success: true,
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, notifications: admin.notifications },
        });
    } catch (err) {
        console.error('Error logging in admin:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Get Current Admin
export async function getCurrentAdmin(req, res) {
    try {
        const admin = await Admin.findById(req.admin.id).select('name email role notifications lastLogin');
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, admin });
    } catch (err) {
        console.error('Error fetching admin:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Update Admin Profile
export async function updateAdminProfile(req, res) {
    const { name, email, notifications } = req.body;

    if (!name || name.length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }
    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email' });
    }
    if (typeof notifications !== 'boolean') {
        return res.status(400).json({ success: false, message: 'Notifications must be a boolean' });
    }

    try {
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Check if email is taken by another admin
        if (email !== admin.email) {
            const existingAdmin = await Admin.findOne({ email });
            if (existingAdmin) {
                return res.status(409).json({ success: false, message: 'Email already in use' });
            }
        }

        admin.name = name.trim();
        admin.email = email.toLowerCase().trim();
        admin.notifications = notifications;
        await admin.save();

        res.json({
            success: true,
            admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, notifications: admin.notifications },
        });
    } catch (err) {
        console.error('Error updating admin profile:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Change Admin Password
export async function changeAdminPassword(req, res) {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All password fields are required' });
    }
    if (newPassword.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character' });
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

        admin.password = newPassword;
        await admin.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Error changing admin password:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}