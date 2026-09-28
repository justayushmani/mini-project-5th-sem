import cors from 'cors';
import env from './env.js';

/**
 * CORS configuration.
 * In production, only allows the configured frontend URL.
 * In development, allows localhost origins.
 */
const corsOptions = {
  origin: env.isDev
    ? [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ]
    : env.frontendUrl,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default cors(corsOptions);
