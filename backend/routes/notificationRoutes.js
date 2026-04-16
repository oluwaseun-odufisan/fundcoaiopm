import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  markNotificationsByContext,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', getNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/context-read', markNotificationsByContext);
router.patch('/:id/read', markNotificationRead);

export default router;
