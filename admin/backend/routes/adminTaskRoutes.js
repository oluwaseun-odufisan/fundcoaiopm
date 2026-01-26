import express from 'express';
import {
    getAllTasks,
    createTask,
    updateTask,
    deleteTask,
    reassignTask,
    generateTaskReport,
} from '../controllers/adminTaskController.js';
import  adminAuthMiddleware  from '../middleware/adminAuth.js';

const taskRouter = express.Router();

// All routes require authentication and super-admin role
taskRouter.use(adminAuthMiddleware);

taskRouter.route('/tasks')
    .get(getAllTasks)
    .post(createTask);

taskRouter.route('/tasks/:id')
    .put(updateTask)
    .delete(deleteTask);

taskRouter.route('/tasks/:id/reassign')
    .put(reassignTask);

taskRouter.route('/tasks/report')
    .get(generateTaskReport);

export default taskRouter;