// backend/routes/documentRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { createDocument, rawExtract, extractText, generatePPT, getHistory } from '../controllers/documentController.js';

const router = express.Router();

router.post('/', authMiddleware, createDocument);
router.post('/raw-extract', authMiddleware, rawExtract); // New for full text
router.post('/extract', authMiddleware, extractText); // Meaningful
router.post('/generate-ppt', authMiddleware, generatePPT);
router.get('/history', authMiddleware, getHistory);

export default router;