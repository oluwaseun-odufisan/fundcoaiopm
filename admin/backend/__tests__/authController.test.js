import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import Admin from '../models/adminModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

jest.mock('../models/adminModel.js');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Admin Auth Controller', () => {
    beforeAll(async () => {
        await mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true, useUnifiedTopology: true });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should login an admin', async () => {
        const mockAdmin = {
            _id: 'admin123',
            username: 'adminuser',
            email: 'admin@example.com',
            password: 'hashedPassword',
            isAdmin: true,
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('mockToken');

        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'admin@example.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ token: 'mockToken' });
        expect(Admin.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
        expect(jwt.sign).toHaveBeenCalledWith({ userId: 'admin123', isAdmin: true }, process.env.ADMIN_JWT_SECRET, { expiresIn: '1h' });
    });

    it('should return 401 for invalid admin login', async () => {
        Admin.findOne.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/admin/login')
            .send({ email: 'admin@example.com', password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ success: false, message: 'Invalid credentials' });
    });
});