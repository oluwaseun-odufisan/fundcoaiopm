import express from 'express';
import adminAuthMiddleware from '../middleware/adminAuth.js';
import { io } from '../server.js';

const router = express.Router();

// Mock Data
const mockMetrics = {
    totalUsers: 100,
    activeUsers: 75,
    pendingTasks: 30,
    completedTasks: 120,
    goalsInProgress: 15,
    goalsCompleted: 50,
    storageUsed: 2048, // MB
    newRegistrations: 10,
    overdueTasks: 5,
    activeSessions: 50,
};

const mockActivities = [
    { _id: '1', message: 'User John created a new task', createdAt: new Date('2025-06-16T10:00:00Z') },
    { _id: '2', message: 'Goal "Q2 Sales" completed', createdAt: new Date('2025-06-16T09:30:00Z') },
];

const mockNotifications = [
    { _id: '1', message: 'New admin registered: Jane Doe', createdAt: new Date('2025-06-16T08:00:00Z') },
];

const mockAuditLogs = [
    { _id: '1', action: 'Deactivated user Jane Doe', createdAt: new Date('2025-06-16T08:30:00Z') },
    { _id: '2', action: 'Reassigned task T123 to John', createdAt: new Date('2025-06-16T08:15:00Z') },
];

const mockSearchResults = [
    { _id: 'u1', type: 'user', name: 'John Doe' },
    { _id: 't1', type: 'task', title: 'Complete Q2 Report' },
    { _id: 'g1', type: 'goal', title: 'Increase Sales by 10%' },
];

// Metrics
router.get('/metrics', adminAuthMiddleware, (req, res) => {
    res.json(mockMetrics);
});

// Activities
router.get('/activities', adminAuthMiddleware, (req, res) => {
    res.json(mockActivities);
});

// Notifications
router.get('/notifications', adminAuthMiddleware, (req, res) => {
    res.json(mockNotifications);
});

router.put('/notifications/read', adminAuthMiddleware, (req, res) => {
    res.json({ success: true, message: 'Notifications marked as read' });
});

// Audit Logs
router.get('/audit-logs', adminAuthMiddleware, (req, res) => {
    res.json(mockAuditLogs);
});

// Search
router.get('/search', adminAuthMiddleware, (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const filteredResults = mockSearchResults.filter(
        (item) =>
            item.name?.toLowerCase().includes(q.toLowerCase()) ||
            item.title?.toLowerCase().includes(q.toLowerCase())
    );
    res.json(filteredResults);
});

export default router;