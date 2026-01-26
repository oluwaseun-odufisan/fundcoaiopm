// backend/routes/grokRoutes.js
import express from 'express';
import { grokChat } from '../controllers/grokController.js';
import authMiddleware from '../middleware/auth.js';
const router = express.Router();
router.post('/chat', authMiddleware, grokChat);
// Tool-specific endpoints for better organization and direct access
router.post('/report-generator', authMiddleware, (req, res) => {
  req.body.toolId = 'report-generator';
  grokChat(req, res);
});
router.post('/task-prioritizer', authMiddleware, (req, res) => {
  req.body.toolId = 'task-prioritizer';
  grokChat(req, res);
});
router.post('/effort-estimator', authMiddleware, (req, res) => {
  req.body.toolId = 'effort-estimator';
  grokChat(req, res);
});
router.post('/task-breaker', authMiddleware, (req, res) => {
  req.body.toolId = 'task-breaker';
  grokChat(req, res);
});
router.post('/email-writer', authMiddleware, (req, res) => {
  req.body.toolId = 'email-writer';
  grokChat(req, res);
});
router.post('/summary-generator', authMiddleware, (req, res) => {
  req.body.toolId = 'summary-generator';
  grokChat(req, res);
});
router.post('/brainstormer', authMiddleware, (req, res) => {
  req.body.toolId = 'brainstormer';
  grokChat(req, res);
});
router.post('/performance-analyzer', authMiddleware, (req, res) => {
  req.body.toolId = 'performance-analyzer';
  grokChat(req, res);
});
router.post('/code-generator', authMiddleware, (req, res) => {
  req.body.toolId = 'code-generator';
  grokChat(req, res);
});
router.post('/research-assistant', authMiddleware, (req, res) => {
  req.body.toolId = 'research-assistant';
  grokChat(req, res);
});
router.post('/reminder-optimizer', authMiddleware, (req, res) => {
  req.body.toolId = 'reminder-optimizer';
  grokChat(req, res);
});
router.post('/goal-planner', authMiddleware, (req, res) => {
  req.body.toolId = 'goal-planner';
  grokChat(req, res);
});
router.post('/team-collaborator', authMiddleware, (req, res) => {
  req.body.toolId = 'team-collaborator';
  grokChat(req, res);
});
router.post('/document-analyzer', authMiddleware, (req, res) => {
  req.body.toolId = 'document-analyzer';
  grokChat(req, res);
});
router.post('/automation-builder', authMiddleware, (req, res) => {
  req.body.toolId = 'automation-builder';
  grokChat(req, res);
});
router.post('/calendar-optimizer', authMiddleware, (req, res) => {
  req.body.toolId = 'calendar-optimizer';
  grokChat(req, res);
});
export default router;