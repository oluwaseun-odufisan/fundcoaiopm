// reminderRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
    createReminder,
    getReminders,
    updateReminder,
    deleteReminder,
    snoozeReminder,
    dismissReminder,
    updatePreferences,
} from '../controllers/reminderController.js';

const router = express.Router();

router.post('/', authMiddleware, createReminder);
router.get('/', authMiddleware, getReminders);
router.put('/:id', authMiddleware, updateReminder);
router.delete('/:id', authMiddleware, deleteReminder);
router.put('/:id/snooze', authMiddleware, snoozeReminder);
router.put('/:id/dismiss', authMiddleware, dismissReminder);
router.put('/preferences', authMiddleware, updatePreferences);

export default router;