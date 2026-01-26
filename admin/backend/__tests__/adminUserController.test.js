import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import User from '../models/adminUserModel.js';
import jwt from 'jsonwebtoken';

jest.mock('../models/adminUserModel.js');
jest.mock('jsonwebtoken');

describe('Admin User Controller', () => {
    beforeAll(async () => {
        await mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true, useUnifiedTopology: true });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should get all users', async () => {
        const mockUsers = [
            { _id: 'user123', username: 'user1', email: 'user1@example.com' },
            { _id: 'user124', username: 'user2', email: 'user2@example.com' },
        ];

        User.find.mockResolvedValue(mockUsers);
        jwt.verify.mockReturnValue({ userId: 'admin123', isAdmin: true });

        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', 'Bearer mockToken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockUsers);
        expect(User.find).toHaveBeenCalled();
    });

    it('should update a user', async () => {
        const mockUser = {
            _id: 'user123',
            username: 'updatedUser',
            email: 'updated@example.com',
        };

        User.findByIdAndUpdate.mockResolvedValue(mockUser);
        jwt.verify.mockReturnValue({ userId: 'admin123', isAdmin: true });

        const res = await request(app)
            .put('/api/admin/users/user123')
            .set('Authorization', 'Bearer mockToken')
            .send({ username: 'updatedUser', email: 'updated@example.com' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockUser);
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
            username: 'updatedUser',
            email: 'updated@example.com',
        }, { new: true });
    });

    it('should delete a user', async () => {
        User.findByIdAndDelete.mockResolvedValue({ _id: 'user123' });
        jwt.verify.mockReturnValue({ userId: 'admin123', isAdmin: true });

        const res = await request(app)
            .delete('/api/admin/users/user123')
            .set('Authorization', 'Bearer mockToken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'User deleted' });
        expect(User.findByIdAndDelete).toHaveBeenCalledWith('user123');
    });

    it('should return 403 for non-admin user', async () => {
        jwt.verify.mockReturnValue({ userId: 'user123', isAdmin: false });

        const res = await request(app)
            .get('/api/admin/users')
            .set('Authorization', 'Bearer mockToken');

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ success: false, message: 'Admin access required' });
    });
});