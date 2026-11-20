import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import 'dotenv/config';
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import prisma, { withConnectionRetry } from './lib/prisma.js';
import { warmUpEmbeddings } from './services/rag/embedding.service.js';

const PORT = env.port;

async function startServer() {
  try {
    // Verify database connection
    await withConnectionRetry(() => prisma.$connect());
    logger.info('✅ Database connected');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Yojana Saathi server running on port ${PORT}`);
      logger.info(`📍 Environment: ${env.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);

      // Warm up local embedding model in the background (non-blocking)
      warmUpEmbeddings().catch((err) => {
        logger.error(`❌ Embedding warmup failed: ${err.message}`);
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use. Kill it with: npx kill-port ${PORT}`);
      } else {
        logger.error('❌ Server error:', err);
      }
      process.exit(1);
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
