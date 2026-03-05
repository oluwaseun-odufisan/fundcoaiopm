// backend/routes/documentRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { createDocument, extractText, generatePPT, getHistory } from '../controllers/documentController.js';
const router = express.Router();
router.post('/', authMiddleware, createDocument);
router.post('/extract', authMiddleware, extractText);
router.post('/generate-ppt', authMiddleware, generatePPT);
router.get('/history', authMiddleware, getHistory);
export default router;

