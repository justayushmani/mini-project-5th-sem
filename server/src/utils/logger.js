import winston from 'winston';
import env from '../config/env.js';

/**
 * Application logger using Winston.
 * 
 * - Development: colorized console output with debug level
 * - Production: JSON format for log aggregation services
 * 
 * NEVER log passwords, API keys, JWT secrets, or unnecessary PII.
 */
const logger = winston.createLogger({
  level: env.isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.isDev
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} ${level}: ${stack || message}`;
          })
        )
      : winston.format.json()
  ),
  transports: [new winston.transports.Console()],
  // Don't exit on uncaught exceptions — let the process manager handle restarts
  exitOnError: false,
});

export default logger;
