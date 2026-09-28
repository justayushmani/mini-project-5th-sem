import logger from '../utils/logger.js';
import env from '../config/env.js';

/**
 * Global error handler middleware.
 * Must be registered LAST in the Express middleware chain.
 * 
 * - In development: returns the stack trace for debugging
 * - In production: returns a safe generic message
 * - Never exposes internal errors or stack traces to end users
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, _next) {
  // Log the full error server-side
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    stack: err.stack,
    statusCode: err.statusCode,
  });

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: env.isProd && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Something went wrong',
    ...(env.isDev && { stack: err.stack }),
  });
}
