// backend/routes/documentRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { createDocument, rawExtract, extractText, generatePPT, getHistory, extractTemplateStructure, cleanTemplate } from '../controllers/documentController.js';

const router = express.Router();

router.post('/', authMiddleware, createDocument);
router.post('/raw-extract', authMiddleware, rawExtract);
router.post('/extract', authMiddleware, extractText);
router.post('/generate-ppt', authMiddleware, generatePPT);
router.post('/extract-template-structure', authMiddleware, extractTemplateStructure);
router.post('/clean-template', authMiddleware, cleanTemplate);
router.get('/history', authMiddleware, getHistory);

export default router;