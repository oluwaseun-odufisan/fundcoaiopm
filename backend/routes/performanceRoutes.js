// routes/performanceRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  getLeaderboard,
  getMyPerformance,
  getUserDetails,        // ← added
  awardBonus,
} from '../controllers/performanceController.js';

const performanceRouter = express.Router();

performanceRouter.get('/leaderboard', authMiddleware, getLeaderboard);
performanceRouter.get('/me', authMiddleware, getMyPerformance);
performanceRouter.get('/user/:userId/details', authMiddleware, getUserDetails); // ← new protected route
performanceRouter.post('/award', authMiddleware, awardBonus);

export default performanceRouter;