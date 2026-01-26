import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { server } from '../jest.setup.js';
import AdminTaskManagement from '../src/pages/AdminTaskManagement.jsx';
import '@testing-library/jest-dom';

describe('AdminTaskManagement Page', () => {
    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it('renders task list', async () => {
        server.use(
            rest.get('http://localhost:4000/api/admin/tasks', (req, res, ctx) => {
                return res(ctx.json([
                    { _id: '123', title: 'Admin Task 1', assignedTo: 'user123', completed: 'No', priority: 'medium' },
                    { _id: '124', title: 'Admin Task 2', assignedTo: 'user124', completed: 'Yes', priority: 'high' },
                ]));
            })
        );

        render(<AdminTaskManagement />);
        await waitFor(() => {
            expect(screen.getByText('Admin Task 1')).toBeInTheDocument();
            expect(screen.getByText('Admin Task 2')).toBeInTheDocument();
            expect(screen.getByText('user123')).toBeInTheDocument();
            expect(screen.getByText('user124')).toBeInTheDocument();
            expect(screen.getByText((content, element) => {
                return element.tagName.toLowerCase() === 'span' && content === 'medium';
            })).toBeInTheDocument();
            expect(screen.getByText((content, element) => {
                return element.tagName.toLowerCase() === 'span' && content === 'high';
            })).toBeInTheDocument();
        });
    });

    it('handles API error', async () => {
        server.use(
            rest.get('http://localhost:4000/api/admin/tasks', (req, res, ctx) => {
                return res(ctx.status(500), ctx.json({ message: 'Server error' }));
            })
        );

        render(<AdminTaskManagement />);
        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });
});