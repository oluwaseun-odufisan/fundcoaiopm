import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin, isTeamLeadOrAbove } from '../middleware/rbac.js';
import {
    getAllGoals,
    getGoalById,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalReport,
    assignTeamGoal,
} from '../controllers/goalController.js';

const router = express.Router();

// All routes require authentication
router.use(adminAuthMiddleware);

// ── READ (all admin roles) ────────────────────────────────────────────────────
router.get('/',        isTeamLeadOrAbove, getAllGoals);
router.get('/report',  isTeamLeadOrAbove, getGoalReport);
router.get('/:id',     isTeamLeadOrAbove, getGoalById);

// ── CREATE (team-lead and above) ──────────────────────────────────────────────
router.post('/',           isTeamLeadOrAbove, createGoal);
router.post('/assign-team', isTeamLeadOrAbove, assignTeamGoal);

// ── UPDATE (team-lead and above — executive blocked inside handler) ─────────────
router.put('/:id', isTeamLeadOrAbove, updateGoal);

// ── DELETE (team-lead and above — executive blocked inside handler) ─────────────
router.delete('/:id', isTeamLeadOrAbove, deleteGoal);

export default router;