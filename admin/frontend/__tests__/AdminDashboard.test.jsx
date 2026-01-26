import { describe, it, expect } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../jest.setup.js';
import AdminDashboard from '../src/pages/AdminDashboard.jsx';
import '@testing-library/jest-dom';

describe('AdminDashboard Page', () => {
    it('renders dashboard metrics', async () => {
        server.use(
            rest.get('http://localhost:4000/api/admin/dashboard', (req, res, ctx) => {
                return res(ctx.json({
                    totalUsers: 10,
                    totalTasks: 20,
                    completedTasks: 15,
                }));
            })
        );

        render(<AdminDashboard />);

        await waitFor(() => {
            expect(screen.getByText(/total users: 10/i)).toBeInTheDocument();
            expect(screen.getByText(/total tasks: 20/i)).toBeInTheDocument();
            expect(screen.getByText(/completed tasks: 15/i)).toBeInTheDocument();
        });
    });

    it('handles API error', async () => {
        server.use(
            rest.get('http://localhost:4000/api/admin/dashboard', (req, res, ctx) => {
                return res(ctx.status(500), ctx.json({ message: 'Server error' }));
            })
        );

        render(<AdminDashboard />);

        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });
});