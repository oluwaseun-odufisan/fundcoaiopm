import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/adminDb.js';
import adminRouter from './routes/adminRoutes.js';
import adminUserRouter from './routes/adminUserRoutes.js';
import adminTaskRouter from './routes/adminTaskRoutes.js';
import adminGoalRouter from './routes/adminGoalRoutes.js';
import adminFileRouter from './routes/adminFileRoutes.js';

const app = express();
const port = process.env.ADMIN_PORT || 4000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5174',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validate environment variables
const requiredEnvVars = ['MONGO_URI', 'ADMIN_JWT_SECRET', 'CLIENT_URL', 'USER_API_URL', 'USER_API_TOKEN'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

// Log environment variables for debugging (sensitive data masked)
console.log('Environment variables loaded:');
console.log(`ADMIN_PORT: ${process.env.ADMIN_PORT}`);
console.log(`MONGO_URI: ${process.env.MONGO_URI ? 'Set' : 'Not set'}`);
console.log(`ADMIN_JWT_SECRET: ${process.env.ADMIN_JWT_SECRET ? 'Set' : 'Not set'}`);
console.log(`USER_API_URL: ${process.env.USER_API_URL ? 'Set' : 'Not set'}`);
console.log(`USER_API_TOKEN: ${process.env.USER_API_TOKEN ? 'Set' : 'Not set'}`);
console.log(`CLIENT_URL: ${process.env.CLIENT_URL}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Routes
app.use('/api/admin', adminRouter);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/admin', adminTaskRouter);
app.use('/api/admin', adminGoalRouter);
app.use('/api/admin', adminFileRouter);

// Health check route
app.get('/', (req, res) => {
    res.send('Admin API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// Start server after DB connection
async function startServer() {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Admin server started on http://localhost:${port}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
}

// Export app for testing
export { app };

// Start server only when run directly
if (process.env.NODE_ENV !== 'test') {
    startServer();
}