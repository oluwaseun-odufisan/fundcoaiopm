import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import {
    getAllGoals,
    getGoalById,
    createGoal,
    updateGoal,
    approveOrRejectGoal,
    deleteGoal,
    generateGoalReport,
} from '../controllers/adminGoalController.js';

const router = express.Router();

// Protect all routes with admin authentication
router.use(adminAuthMiddleware);

// Goal routes
router.route('/goals')
    .get(getAllGoals)
    .post(createGoal);

router.route('/goals/:id')
    .get(getGoalById)
    .put(updateGoal)
    .delete(deleteGoal);

router.put('/goals/:id/approve', approveOrRejectGoal);
router.get('/goals/report', generateGoalReport);

export default router;