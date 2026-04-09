import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin } from '../middleware/rbac.js';
import {
    loginAdmin,
    signupAdmin,
    getCurrentAdmin,
    updateAdminProfile,
    changeAdminPassword,
    getAllAdmins,
    getAdminById,
    updateAnyAdmin,
    resetAdminPassword,
    toggleAdminStatus,
    deleteAdmin,
    getAdminActivityLogs,
    verifyAdminToken,
} from '../controllers/adminController.js';

const router = express.Router();

// ── PUBLIC ────────────────────────────────────────────────────────────────────
router.post('/login',  loginAdmin);
router.post('/verify', verifyAdminToken); // Called by user-side backend

// ── SELF (any authenticated admin) ───────────────────────────────────────────
router.get('/me',          adminAuthMiddleware, getCurrentAdmin);
router.put('/me/profile',  adminAuthMiddleware, updateAdminProfile);
router.put('/me/password', adminAuthMiddleware, changeAdminPassword);

// ── ADMIN MANAGEMENT (super-admin only) ───────────────────────────────────────
router.get('/',                              adminAuthMiddleware, isSuperAdmin, getAllAdmins);
router.post('/create',                       adminAuthMiddleware, isSuperAdmin, signupAdmin);
router.get('/:adminId',                      adminAuthMiddleware, isSuperAdmin, getAdminById);
router.put('/:adminId',                      adminAuthMiddleware, isSuperAdmin, updateAnyAdmin);
router.put('/:adminId/password',             adminAuthMiddleware, isSuperAdmin, resetAdminPassword);
router.patch('/:adminId/toggle-status',      adminAuthMiddleware, isSuperAdmin, toggleAdminStatus);
router.delete('/:adminId',                   adminAuthMiddleware, isSuperAdmin, deleteAdmin);
router.get('/:adminId/activity',             adminAuthMiddleware, isSuperAdmin, getAdminActivityLogs);

export default router;