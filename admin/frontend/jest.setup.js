import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const server = setupServer(
    rest.get('http://localhost:4000/api/admin/tasks', (req, res, ctx) => {
        return res(ctx.json({ tasks: [] }));
    })
);