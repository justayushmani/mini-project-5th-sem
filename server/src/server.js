import 'dotenv/config';
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import prisma, { withConnectionRetry } from './lib/prisma.js';

const PORT = env.port;

async function startServer() {
  try {
    // Verify database connection
    await withConnectionRetry(() => prisma.$connect());
    logger.info('✅ Database connected');

    app.listen(PORT, () => {
      logger.info(`🚀 Yojana Saathi server running on port ${PORT}`);
      logger.info(`📍 Environment: ${env.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
