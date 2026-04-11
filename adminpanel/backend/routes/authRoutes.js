// routes/authRoutes.js
import express from 'express';
import { adminLogin, getAdminMe } from '../controllers/authController.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.post('/login', adminLogin);
router.get('/me', authMiddleware, adminOnly, getAdminMe);
export default router;
