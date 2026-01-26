import express from 'express';
import { signupAdmin, loginAdmin, getCurrentAdmin, updateAdminProfile, changeAdminPassword } from '../controllers/adminController.js';
import adminAuthMiddleware from '../middleware/adminAuth.js';

const adminRouter = express.Router();

// Public Routes
adminRouter.post('/signup', signupAdmin);
adminRouter.post('/login', loginAdmin);

// Protected Routes
adminRouter.get('/me', adminAuthMiddleware, getCurrentAdmin);
adminRouter.put('/profile', adminAuthMiddleware, updateAdminProfile);
adminRouter.put('/password', adminAuthMiddleware, changeAdminPassword);

export default adminRouter;