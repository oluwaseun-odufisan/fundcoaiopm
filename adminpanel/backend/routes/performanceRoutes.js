import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { isSuperAdmin, isTeamLeadOrAbove, isExecutiveOrAbove } from '../middleware/rbac.js';
import {
    getLeaderboard,
    getUserPerformance,
    getPerformanceOverview,
    awardBonus,
    getTopPerformers,
} from '../controllers/performanceController.js';

const performanceRouter = express.Router();
performanceRouter.use(adminAuthMiddleware);

// Read: all roles
performanceRouter.get('/leaderboard',          isTeamLeadOrAbove, getLeaderboard);
performanceRouter.get('/overview',             isTeamLeadOrAbove, getPerformanceOverview);
performanceRouter.get('/top-performers',       isTeamLeadOrAbove, getTopPerformers);
performanceRouter.get('/user/:userId',         isTeamLeadOrAbove, getUserPerformance);

// Award bonus: executive and above only
performanceRouter.post('/award-bonus',         isExecutiveOrAbove, awardBonus);

export default performanceRouter;