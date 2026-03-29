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

adminUserRouter.get('/', adminAuthMiddleware, getAllUsers);
adminUserRouter.post('/', adminAuthMiddleware, createUser);
adminUserRouter.put('/:userId', adminAuthMiddleware, updateUserProfile);
adminUserRouter.put('/:userId/deactivate', adminAuthMiddleware, deactivateUser);
adminUserRouter.delete('/:userId', adminAuthMiddleware, deleteUser);
adminUserRouter.put('/:userId/password', adminAuthMiddleware, resetUserPassword);
adminUserRouter.put('/:userId/role', adminAuthMiddleware, assignUserRole);
adminUserRouter.get('/:userId/activity', adminAuthMiddleware, getUserActivityLogs);

export default adminUserRouter;