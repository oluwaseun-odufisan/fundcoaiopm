// routes/performanceRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  getLeaderboard,
  getMyPerformance,
  getUserPerformance,
  awardBonus,
} from '../controllers/performanceController.js';

const performanceRouter = express.Router();

// PUBLIC TO ALL AUTHENTICATED USERS
performanceRouter.get('/leaderboard', authMiddleware, getLeaderboard);
performanceRouter.get('/me', authMiddleware, getMyPerformance);

// ADMIN / TEAM-LEAD ONLY
performanceRouter.get('/:userId', authMiddleware, getUserPerformance);
performanceRouter.post('/award', authMiddleware, awardBonus);

export default performanceRouter;