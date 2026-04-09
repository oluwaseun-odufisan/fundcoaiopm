import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

// ── MODELS (register all shared collections on startup) ───────────────────────
import './models/adminModel.js';
import './models/userModel.js';
import './models/taskModel.js';
import './models/goalModel.js';
import './models/reminderModel.js';
import './models/reportModel.js';
import './models/postModel.js';
import './models/learningModel.js';
import './models/roomModel.js';

// ── ROUTES ────────────────────────────────────────────────────────────────────
import adminRoutes       from './routes/adminRoutes.js';
import userRoutes        from './routes/userRoutes.js';
import taskRoutes        from './routes/taskRoutes.js';
import goalRoutes        from './routes/goalRoutes.js';
import reminderRoutes    from './routes/reminderRoutes.js';
import reportRoutes      from './routes/reportRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import learningRoutes    from './routes/learningRoutes.js';
import postRoutes        from './routes/postRoutes.js';
import roomRoutes        from './routes/roomRoutes.js';

const app  = express();
const port = parseInt(process.env.ADMIN_PORT, 10) || 4002;

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.ADMIN_CLIENT_URL,
    process.env.USER_API_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:    true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── ROUTE MOUNTS ──────────────────────────────────────────────────────────────
app.use('/api/admin/accounts',    adminRoutes);
app.use('/api/admin/users',       userRoutes);
app.use('/api/admin/tasks',       taskRoutes);
app.use('/api/admin/goals',       goalRoutes);
app.use('/api/admin/reminders',   reminderRoutes);
app.use('/api/admin/reports',     reportRoutes);
app.use('/api/admin/performance', performanceRoutes);
app.use('/api/admin/learning',    learningRoutes);
app.use('/api/admin/posts',       postRoutes);
app.use('/api/admin/rooms',       roomRoutes);

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Admin API is running',
        port,
        env: process.env.NODE_ENV || 'development',
        routes: [
            '/api/admin/accounts',
            '/api/admin/users',
            '/api/admin/tasks',
            '/api/admin/goals',
            '/api/admin/reminders',
            '/api/admin/reports',
            '/api/admin/performance',
            '/api/admin/learning',
            '/api/admin/posts',
            '/api/admin/rooms',
        ],
    });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:   process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// ── ENV VALIDATION ────────────────────────────────────────────────────────────
const requiredEnvVars = ['MONGO_URI', 'ADMIN_JWT_SECRET', 'ADMIN_CLIENT_URL', 'USER_API_URL', 'ADMIN_PORT'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

// ── START SERVER ──────────────────────────────────────────────────────────────
async function startServer() {
    try {
        await connectDB();
        app.listen(port, '0.0.0.0', () => {
            console.log(`Admin server running on port ${port}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`User API URL: ${process.env.USER_API_URL}`);
            console.log(`Admin client URL: ${process.env.ADMIN_CLIENT_URL}`);
        });
    } catch (err) {
        console.error('Failed to start admin server:', err.message);
        process.exit(1);
    }
}

export { app };
if (process.env.NODE_ENV !== 'test') startServer();