import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin, isTeamLeadOrAbove, isExecutiveOrAbove } from '../middleware/rbac.js';
import {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    reviewTask,
    reassignTask,
    deleteTask,
    bulkDeleteTasks,
    getTaskReport,
    getPendingApprovals,
} from '../controllers/taskController.js';

const router = express.Router();

// All routes require authentication
router.use(adminAuthMiddleware);

// ── READ (all admin roles) ────────────────────────────────────────────────────
router.get('/',                     isTeamLeadOrAbove, getAllTasks);
router.get('/report',               isTeamLeadOrAbove, getTaskReport);
router.get('/pending-approvals',    isTeamLeadOrAbove, getPendingApprovals);
router.get('/:id',                  isTeamLeadOrAbove, getTaskById);

// ── CREATE (team-lead and above) ──────────────────────────────────────────────
router.post('/', isTeamLeadOrAbove, createTask);

// ── UPDATE (team-lead and above — executive is blocked inside handler) ─────────
router.put('/:id', isTeamLeadOrAbove, updateTask);

// ── REVIEW SUBMISSION (team-lead and above — executive is blocked inside) ──────
router.post('/:id/review', isTeamLeadOrAbove, reviewTask);

// ── REASSIGN (team-lead and above — executive is blocked inside) ───────────────
router.put('/:id/reassign', isTeamLeadOrAbove, reassignTask);

// ── DELETE (team-lead and above — executive is blocked inside) ─────────────────
router.delete('/:id', isTeamLeadOrAbove, deleteTask);

// ── BULK DELETE (super-admin only) ────────────────────────────────────────────
router.delete('/bulk', isSuperAdmin, bulkDeleteTasks);

export default router;