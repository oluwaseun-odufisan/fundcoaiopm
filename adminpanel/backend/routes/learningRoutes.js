import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin, isTeamLeadOrAbove } from '../middleware/rbac.js';
import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    upsertModule,
    deleteModule,
    assignCourse,
    getAllProgress,
    getTrainingStats,
    getUserTrainingProgress,
} from '../controllers/learningController.js';

const learningRouter = express.Router();
learningRouter.use(adminAuthMiddleware);

// ── COURSES ───────────────────────────────────────────────────────────────────
learningRouter.get ('/courses',                     isTeamLeadOrAbove, getAllCourses);
learningRouter.get ('/courses/:id',                 isTeamLeadOrAbove, getCourseById);
learningRouter.post('/courses',                     isSuperAdmin,       createCourse);
learningRouter.put ('/courses/:id',                 isSuperAdmin,       updateCourse);
learningRouter.delete('/courses/:id',               isSuperAdmin,       deleteCourse);

// ── MODULES (within a course) ─────────────────────────────────────────────────
learningRouter.post  ('/courses/:id/modules',           isSuperAdmin, upsertModule);
learningRouter.put   ('/courses/:id/modules',           isSuperAdmin, upsertModule); // alias for update
learningRouter.delete('/courses/:id/modules/:moduleId', isSuperAdmin, deleteModule);

// ── ASSIGNMENT ────────────────────────────────────────────────────────────────
learningRouter.post('/assign',                      isTeamLeadOrAbove, assignCourse);

// ── PROGRESS & STATS ──────────────────────────────────────────────────────────
learningRouter.get ('/progress',                    isTeamLeadOrAbove, getAllProgress);
learningRouter.get ('/progress/user/:userId',       isTeamLeadOrAbove, getUserTrainingProgress);
learningRouter.get ('/stats',                       isTeamLeadOrAbove, getTrainingStats);

export default learningRouter;