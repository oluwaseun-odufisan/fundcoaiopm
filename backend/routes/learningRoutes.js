// backend/routes/learningRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getCourses, getCourseById, getUserProgress, updateProgress, aiQuery, generateQuiz } from '../controllers/learningController.js';
const router = express.Router();
router.get('/courses', authMiddleware, getCourses);
router.get('/courses/:id', authMiddleware, getCourseById);
router.get('/progress', authMiddleware, getUserProgress);
router.post('/progress', authMiddleware, updateProgress);
router.post('/ai-query', authMiddleware, aiQuery);
router.get('/quiz/:moduleId', authMiddleware, generateQuiz);
export default router;