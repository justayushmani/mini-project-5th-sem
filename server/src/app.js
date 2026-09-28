import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import corsMiddleware from './config/cors.js';
import { generalLimiter } from './config/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import schemeRoutes from './routes/scheme.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import bookmarkRoutes from './routes/bookmark.routes.js';
import aiRoutes from './routes/ai.routes.js';
import chatRoutes from './routes/chat.routes.js';

const app = express();

// ── Security middleware ──
app.use(helmet());
app.use(corsMiddleware);
app.use(generalLimiter);

// ── Body parsing ──
app.use(express.json({ limit: '10kb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ── API routes ──
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);

// ── 404 handler ──
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global error handler (must be last) ──
app.use(errorHandler);

export default app;
