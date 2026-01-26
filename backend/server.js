// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import fileUpload from 'express-fileupload';
import cron from 'node-cron';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoute.js';
import taskRouter from './routes/taskRoutes.js';
import fileRouter from './routes/fileRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import botChatRouter from './routes/botChatRoutes.js';
import urlRouter from './routes/urlRoutes.js';
import postRouter from './routes/postRoutes.js';
import reminderRouter from './routes/reminderRoutes.js';
import goalRouter from './routes/goalRoutes.js';
import performanceRouter from './routes/performanceRoutes.js';
import meetingRouter from './routes/meetingRoutes.js';
import learningRouter from './routes/learningRoutes.js'; // New
import { startReminderScheduler } from './utils/reminderScheduler.js';
import Meeting from './models/meetingModel.js';
import './models/userModel.js';
import './models/chatModel.js';
import './models/messageModel.js';
import './models/botChatModel.js';
import './models/postModel.js';
import './models/reminderModel.js';
import './models/goalModel.js';
import './models/meetingModel.js';
import './models/learningMaterialModel.js'; // New
import grokRouter from './routes/grokRoutes.js'

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Make io globally accessible
global.io = io;

// Attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Global middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply express-fileupload for chat, bot, and post routes
app.use('/api/chats', fileUpload());
app.use('/api/bot', fileUpload());
app.use('/api/posts', fileUpload());
app.use('/api/user', userRouter);

// Environment variable validation
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'WIT_AI_TOKEN',
  'PINATA_API_KEY',
  'PINATA_SECRET_API_KEY',
  'PINATA_JWT',
  'BASE_URL',
  'FRONTEND_URL',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FIREBASE_CREDENTIALS',
  'GROK_API_KEY',
  'ZOOM_CLIENT_ID',
  'ZOOM_CLIENT_SECRET',
  'ZOOM_ACCOUNT_ID',
  'ZOOM_SDK_KEY',
  'ZOOM_SDK_SECRET',
];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}
console.log('Environment variables loaded:');
requiredEnvVars.forEach((varName) =>
  console.log(`${varName}: ${process.env[varName] ? 'Set' : 'Not set'}`)
);

// Socket.IO authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('No token provided');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handlers
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  // Chat-related events (original)
  socket.on('joinChat', (chatId) => {
    if (typeof chatId === 'string') {
      socket.join(chatId);
      console.log(`User ${socket.user.id} joined chat ${chatId}`);
    }
  });
  socket.on('leaveChat', (chatId) => {
    if (typeof chatId === 'string') {
      socket.leave(chatId);
      console.log(`User ${socket.user.id} left chat ${chatId}`);
    }
  });
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    if (typeof chatId === 'string' && typeof userId === 'string') {
      socket.to(chatId).emit('typing', { chatId, userId, isTyping });
    }
  });
  // Post-related events (corrected from provided snippet)
  socket.on('joinPost', (postId) => {
    if (typeof postId === 'string') {
      socket.join(`post:${postId}`);
      console.log(`User ${socket.user.id} joined post ${postId}`);
    }
  });
  socket.on('leavePost', (postId) => {
    if (typeof postId === 'string') {
      socket.leave(`post:${postId}`);
      console.log(`User ${socket.user.id} left post ${postId}`);
    }
  });
  socket.on('posting', ({ postId, userId, isPosting }) => {
    if (typeof postId === 'string' && typeof userId === 'string') {
      socket.to(`post:${postId}`).emit('posting', { postId, userId, isPosting });
    }
  });
  // Real-time post creation event
  socket.on('newPost', (post) => {
    // Broadcast to all connected clients
    io.emit('newPost', post);
  });
  socket.on('postUpdated', (post) => {
    io.emit('postUpdated', post);
  });
  socket.on('postDeleted', (postId) => {
    io.emit('postDeleted', postId);
  });
  socket.on('newReminder', (reminder) => {
    io.to(`user:${socket.user.id}`).emit('newReminder', reminder);
  });
  socket.on('reminderUpdated', (reminder) => {
    io.to(`user:${socket.user.id}`).emit('reminderUpdated', reminder);
  });
  socket.on('reminderTriggered', (reminder) => {
    io.to(`user:${socket.user.id}`).emit('reminderTriggered', reminder);
  });
  socket.on('newGoal', (goal) => {
    io.to(`user:${socket.user.id}`).emit('newGoal', goal);
  });
  socket.on('goalUpdated', (goal) => {
    io.to(`user:${socket.user.id}`).emit('goalUpdated', goal);
  });
  socket.on('goalDeleted', (id) => {
    io.to(`user:${socket.user.id}`).emit('goalDeleted', id);
  });
  // Meeting-related socket events
  socket.on('newMeeting', (meeting) => {
    io.emit('newMeeting', meeting);
  });
  socket.on('meetingUpdated', (meeting) => {
    io.emit('meetingUpdated', meeting);
  });
  socket.on('meetingDeleted', (id) => {
    io.emit('meetingDeleted', id);
  });
  socket.on('newMeetingInvitation', (data) => {
    io.to(`user:${data.participantId}`).emit('newMeetingInvitation', data);
  });
  socket.on('error', (error) => {
    console.error('Socket error:', error.message);
  });
  socket.join(`user:${socket.user.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/user', userRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/files', fileRouter);
app.use('/api/chats', chatRouter);
app.use('/api/urls', urlRouter);
app.use('/download', urlRouter);
app.use('/api/bot', botChatRouter);
app.use('/api/posts', postRouter);
app.use('/api/reminders', reminderRouter);
app.use('/api/goals', goalRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/grok', grokRouter);
app.use('/api/meetings', meetingRouter);
app.use('/api/learning', learningRouter); 

// Emit endpoint for admin
app.post('/api/emit', (req, res) => {
  const { event, data } = req.body;
  if (!event || !data) {
    return res.status(400).json({ success: false, message: 'Event and data are required' });
  }
  io.emit(event, data);
  res.json({ success: true, message: 'Event emitted' });
});

// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// Cron for meeting status update (every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    // Set ongoing
    await Meeting.updateMany(
      { status: 'scheduled', startTime: { $lte: now } },
      { status: 'ongoing' }
    );
    // Set ended
    await Meeting.updateMany(
      { status: 'ongoing', $expr: { $gt: [{ $subtract: [now, '$startTime'] }, { $multiply: ['$duration', 60000] }] } },
      { status: 'ended', endedAt: now }
    );
    console.log('Meeting statuses updated');
  } catch (err) {
    console.error('Cron meeting status error:', err);
  }
});

// Start server
async function startServer() {
  try {
    await connectDB();
    httpServer.listen(port, () => {
      console.log(`Server started on http://localhost:${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      startReminderScheduler();
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