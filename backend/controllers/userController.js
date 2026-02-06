import User from '../models/userModel.js';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const TOKEN_EXPIRES = '24h';
// Create JWT token
const createToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
// Register user
export async function registerUser(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email' });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    try {
        if (await User.findOne({ email })) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashed });
        const token = createToken(user._id);
        // Log registration activity
        user.activityLogs.push({ action: 'register', details: `User registered from IP ${req.ip}` });
        await user.save();
        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error('Error registering user:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
// Login user
export async function loginUser(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
        }
        const matched = await bcrypt.compare(password, user.password);
        if (!matched) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        // Update lastLogin and lastActive, add login activity log
        const now = new Date();
        user.lastLogin = now;
        user.lastActive = now;  // Added: Update lastActive on login
        user.activityLogs.push({ action: 'login', details: `User logged in from IP ${req.ip}` });
        await user.save();
        const token = createToken(user._id);
        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error('Error logging in:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
// Get current user
export async function getCurrentUser(req, res) {
    try {
        const user = await User.findById(req.user.id).select('name email role preferences pushToken');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error('Error fetching user:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
// Update user profile
export async function updateProfile(req, res) {
    const { name, email, role } = req.body;
    if (!name || !email || !validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Valid name and email required' });
    }
    if (role && !['standard', 'team-lead', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    try {
        const exists = await User.findOne({ email, _id: { $ne: req.user.id } });
        if (exists) {
            return res.status(409).json({ success: false, message: 'Email already in use by another account' });
        }
        const updateData = { name, email };
        if (role) {
            updateData.role = role;
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('name email role');
        // Log role change if applicable
        if (role && role !== req.user.role) {
            user.activityLogs.push({ action: 'role_change', details: `Role changed to ${role} from IP ${req.ip}` });
            await user.save();
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error('Error updating profile:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
// Update password
export async function updatePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password invalid or too short' });
    }
    try {
        const user = await User.findById(req.user.id).select('password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Current password incorrect' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.activityLogs.push({ action: 'password_change', details: `Password changed from IP ${req.ip}` });
        await user.save();
        res.json({ success: true, message: 'Password changed' });
    } catch (err) {
        console.error('Error updating password:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
// Update push token
export async function updatePushToken(req, res) {
    const { pushToken } = req.body;
    if (!pushToken) {
        return res.status(400).json({ success: false, message: 'Push token is required' });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.pushToken = pushToken;
        user.activityLogs.push({ action: 'push_token_update', details: `Push token updated from IP ${req.ip}` });
        await user.save();
        res.json({ success: true, message: 'Push token updated' });
    } catch (err) {
        console.error('Error updating push token:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}