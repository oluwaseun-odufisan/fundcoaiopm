import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import Task from '../models/adminTaskModel.js';
import jwt from 'jsonwebtoken';

jest.mock('../models/adminTaskModel.js');
jest.mock('jsonwebtoken');

describe('Admin Task Controller', () => {
    beforeAll(async () => {
        await mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true, useUnifiedTopology: true });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should get all tasks for admin', async () => {
        const mockTasks = [
            { _id: '123', title: 'Admin Task 1', assignedTo: 'user123', status: 'pending' },
            { _id: '124', title: 'Admin Task 2', assignedTo: 'user124', status: 'completed' },
        ];

        Task.find.mockResolvedValue(mockTasks);
        jwt.verify.mockReturnValue({ userId: 'admin123', isAdmin: true });

        const res = await request(app)
            .get('/api/admin/tasks')
            .set('Authorization', 'Bearer mockToken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockTasks);
        expect(Task.find).toHaveBeenCalled();
    });

    it('should assign a task to a user', async () => {
        const mockTask = {
            _id: '123',
            title: 'Admin Task',
            assignedTo: 'user123',
            status: 'pending',
        };

        Task.findByIdAndUpdate.mockResolvedValue(mockTask);
        jwt.verify.mockReturnValue({ userId: 'admin123', isAdmin: true });

        const res = await request(app)
            .put('/api/admin/tasks/123/assign')
            .set('Authorization', 'Bearer mockToken')
            .send({ assignedTo: 'user123' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockTask);
        expect(Task.findByIdAndUpdate).toHaveBeenCalledWith('123', { assignedTo: 'user123' }, { new: true });
    });

    it('should return 403 for non-admin user', async () => {
        jwt.verify.mockReturnValue({ userId: 'user123', isAdmin: false });

        const res = await request(app)
            .get('/api/admin/tasks')
            .set('Authorization', 'Bearer mockToken');

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ success: false, message: 'Admin access required' });
    });
});