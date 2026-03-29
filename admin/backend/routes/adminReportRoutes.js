// admin/backend/routes/adminReportRoutes.js
import express from 'express';
import { getAllReports, getReportById, reviewReport, deleteReport, getReportsStats } from '../controllers/adminReportController.js';
import adminAuthMiddleware from '../middleware/adminAuth.js';

const router = express.Router();
router.use(adminAuthMiddleware);

router.get('/', getAllReports);
router.get('/stats', getReportsStats);
router.get('/:id', getReportById);
router.put('/:id/review', reviewReport);
router.delete('/:id', deleteReport);

export default router;