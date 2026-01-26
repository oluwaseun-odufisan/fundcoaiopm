// New routes/performanceRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getUsersPerformance, redeemPoints } from '../controllers/performanceController.js';

const performanceRouter = express.Router();

performanceRouter.get('/users', authMiddleware, getUsersPerformance);
performanceRouter.post('/redeem', authMiddleware, redeemPoints);  // Assume only admin or self, add check if needed

export default performanceRouter;