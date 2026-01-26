import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import bcrypt from 'bcryptjs';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin || !admin.isActive) {
            console.log('Admin not found or inactive:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            console.log('Password mismatch for admin:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const secret = process.env.ADMIN_JWT_SECRET;
        if (!secret) {
            console.error('ADMIN_JWT_SECRET is not defined');
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }
        const token = jwt.sign({ id: admin._id }, secret, { expiresIn: '1d' });
        console.log('Generated admin token:', token.slice(0, 15) + '...', 'Admin ID:', admin._id.toString());
        res.json({ success: true, token });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};