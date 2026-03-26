import express from 'express';
import authMiddleware from '../middleware/auth.js';
import multer from 'multer';
import {
  createManualReport,
  generateAIReport,
  getMyReports,
  getReportById,
  updateReport,
  submitReport,
  deleteReport,
} from '../controllers/reportController.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.use(authMiddleware);

// Manual creation (supports image attachments)
router.post('/', upload.array('attachments'), createManualReport);

// AI generation
router.post('/ai-generate', upload.array('attachments'), generateAIReport);

// List my reports
router.get('/', getMyReports);

// Single report
router.get('/:id', getReportById);

// Update (only drafts)
router.put('/:id', updateReport);

// Submit
router.post('/:id/submit', submitReport);

// Delete draft
router.delete('/:id', deleteReport);

export default router;