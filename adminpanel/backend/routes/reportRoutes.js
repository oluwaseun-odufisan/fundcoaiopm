import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin, isTeamLeadOrAbove, isExecutiveOrAbove } from '../middleware/rbac.js';
import {
    getAllReports,
    getReportById,
    reviewReport,
    getPendingReports,
    getReportStats,
    exportReports,
} from '../controllers/reportController.js';

const reportRouter = express.Router();
reportRouter.use(adminAuthMiddleware);

// All roles can read reports within their scope
reportRouter.get ('/',                isTeamLeadOrAbove, getAllReports);
reportRouter.get ('/stats',           isTeamLeadOrAbove, getReportStats);
reportRouter.get ('/pending',         isTeamLeadOrAbove, getPendingReports);
reportRouter.get ('/export',          isExecutiveOrAbove, exportReports);
reportRouter.get ('/:id',             isTeamLeadOrAbove, getReportById);

// Team-leads and above can approve/reject reports in their scope
reportRouter.post('/:id/review',      isTeamLeadOrAbove, reviewReport);

export default reportRouter;