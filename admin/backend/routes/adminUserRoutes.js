import express from 'express';
import {
    getAllUsers,
    createUser,
    updateUserProfile,
    deactivateUser,
    deleteUser,
    resetUserPassword,
    assignUserRole,
    getUserActivityLogs,
} from '../controllers/adminUserController.js';
import adminAuthMiddleware from '../middleware/adminAuth.js';

const adminUserRouter = express.Router();

// User Management Routes (all require authentication via middleware)
adminUserRouter.get('/', adminAuthMiddleware, getAllUsers); // Get all users
adminUserRouter.post('/', adminAuthMiddleware, createUser); // Create a new user
adminUserRouter.put('/:userId', adminAuthMiddleware, updateUserProfile); // Update user profile
adminUserRouter.put('/:userId/deactivate', adminAuthMiddleware, deactivateUser); // Deactivate user
adminUserRouter.delete('/:userId', adminAuthMiddleware, deleteUser); // Delete user
adminUserRouter.put('/:userId/password', adminAuthMiddleware, resetUserPassword); // Reset user password
adminUserRouter.put('/:userId/role', adminAuthMiddleware, assignUserRole); // Assign user role
adminUserRouter.get('/:userId/activity', adminAuthMiddleware, getUserActivityLogs); // Get user activity logs

export default adminUserRouter;