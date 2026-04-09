import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin, isTeamLeadOrAbove, isExecutiveOrAbove } from '../middleware/rbac.js';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUserProfile,
    assignUserRole,
    resetUserPassword,
    toggleUserStatus,
    deleteUser,
    getUserActivityLogs,
    getUsersBySector,
    getUniqueSectors,
} from '../controllers/userManagementController.js';

const router = express.Router();

// All routes require authentication
router.use(adminAuthMiddleware);

// ── READ (team-lead and above) ────────────────────────────────────────────────
router.get('/',                 isTeamLeadOrAbove, getAllUsers);
router.get('/sectors',          isTeamLeadOrAbove, getUniqueSectors);
router.get('/sector/:sector',   isTeamLeadOrAbove, getUsersBySector);
router.get('/:userId',          isTeamLeadOrAbove, getUserById);

// ── CREATE (super-admin only) ─────────────────────────────────────────────────
router.post('/', isSuperAdmin, createUser);

// ── UPDATE PROFILE (team-lead for their sector, super-admin for all) ──────────
router.put('/:userId',          isTeamLeadOrAbove, updateUserProfile);

// ── ROLE ASSIGNMENT (super-admin only) ────────────────────────────────────────
router.put('/:userId/role',     isSuperAdmin, assignUserRole);

// ── PASSWORD RESET (super-admin only) ─────────────────────────────────────────
router.put('/:userId/password', isSuperAdmin, resetUserPassword);

// ── ACTIVATE / DEACTIVATE (super-admin only) ──────────────────────────────────
router.patch('/:userId/toggle-status', isSuperAdmin, toggleUserStatus);

// ── DELETE (super-admin only) ─────────────────────────────────────────────────
router.delete('/:userId', isSuperAdmin, deleteUser);

// ── ACTIVITY LOGS (super-admin only) ─────────────────────────────────────────
router.get('/:userId/activity', isSuperAdmin, getUserActivityLogs);

export default router;