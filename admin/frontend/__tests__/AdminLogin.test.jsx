import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { server } from '../jest.setup.js';
import AdminLogin from '../src/components/AdminLogin.jsx';
import '@testing-library/jest-dom';

describe('AdminLogin Component', () => {
    it('renders login form', () => {
        render(<AdminLogin />);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByText(/login/i)).toBeInTheDocument();
    });

    it('submits login form with valid credentials', async () => {
        server.use(
            rest.post('http://localhost:4000/api/admin/login', (req, res, ctx) => {
                return res(ctx.json({ token: 'mockToken' }));
            })
        );

        render(<AdminLogin />);

        await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        fireEvent.click(screen.getByText(/login/i));

        await waitFor(() => {
            expect(screen.getByText(/login successful/i)).toBeInTheDocument();
        });
    });

    it('displays error for invalid credentials', async () => {
        server.use(
            rest.post('http://localhost:4000/api/admin/login', (req, res, ctx) => {
                return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }));
            })
        );

        render(<AdminLogin />);

        await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
        fireEvent.click(screen.getByText(/login/i));

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
    });
});