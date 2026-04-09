import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';

const adminAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authorization token required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid or inactive admin account' });
        }

        req.admin = admin;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        console.error('Admin auth middleware error:', err.message);
        res.status(500).json({ success: false, message: 'Server error during authentication' });
    }
};

export default adminAuthMiddleware;