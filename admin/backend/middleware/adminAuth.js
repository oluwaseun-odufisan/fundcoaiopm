import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js'; // Import Admin model for additional validation

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_jwt_secret_here';

const adminAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('No token provided or invalid format', { authHeader });
        return res.status(401).json({ success: false, message: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        console.error('Token is empty', { authHeader });
        return res.status(401).json({ success: false, message: 'Token is empty' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded:', decoded); // Debug log
        const admin = await Admin.findById(decoded.id).select('role isActive');
        if (!admin || !admin.isActive) {
            console.error('Admin not found or inactive:', { adminId: decoded.id });
            return res.status(401).json({ success: false, message: 'Invalid or inactive admin account' });
        }
        req.admin = { id: decoded.id, role: admin.role, email: admin.email };
        next();
    } catch (err) {
        console.error('JWT verification error:', {
            message: err.message,
            name: err.name,
            token,
        });
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        res.status(500).json({ success: false, message: 'Server error during token verification' });
    }
};

export default adminAuthMiddleware;