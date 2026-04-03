// routes/chatRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import * as chatController from '../controllers/chatController.js';
const router = express.Router();

router.get('/users', authMiddleware, chatController.getUsers);
router.post('/individual', authMiddleware, chatController.createIndividualChat);
router.get('/groups', authMiddleware, chatController.getGroups);
router.post('/groups', authMiddleware, chatController.createGroup);
router.put('/groups/:groupId/members', authMiddleware, chatController.addGroupMembers);

// Unread counts — fetch all at once on load
router.get('/unread-counts', authMiddleware, chatController.getAllUnreadCounts);

// Mark an entire chat as read (resets unread counter in DB)
router.post('/:chatId/read', authMiddleware, chatController.markChatRead);

router.get('/:chatId/messages', authMiddleware, chatController.getChatMessages);
router.post('/:chatId/messages', authMiddleware, chatController.sendMessage);
router.put('/messages/:messageId', authMiddleware, chatController.editMessage);
router.delete('/messages/:messageId', authMiddleware, chatController.deleteMessage);
router.post('/upload', authMiddleware, chatController.uploadChatFile);
router.get('/timestamps', authMiddleware, chatController.getChatTimestamps);
router.get('/unread-total', authMiddleware, chatController.getUnreadTotal);

export default router;