// routes/reminderRoutes.js
import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin, isTeamLeadOrAbove } from '../middleware/rbac.js';
import {
    getAllReminders,
    getUserReminders,
    createReminderForUser,
    bulkCreateReminders,
    deleteReminder,
    getReminderStats,
} from '../controllers/reminderController.js';

const reminderRouter = express.Router();
reminderRouter.use(adminAuthMiddleware);

reminderRouter.get ('/',                    isTeamLeadOrAbove, getAllReminders);
reminderRouter.get ('/stats',               isTeamLeadOrAbove, getReminderStats);
reminderRouter.get ('/user/:userId',         isTeamLeadOrAbove, getUserReminders);
reminderRouter.post('/',                    isTeamLeadOrAbove, createReminderForUser);
reminderRouter.post('/bulk',               isTeamLeadOrAbove, bulkCreateReminders);
reminderRouter.delete('/:id',               isSuperAdmin,       deleteReminder);

export default reminderRouter;