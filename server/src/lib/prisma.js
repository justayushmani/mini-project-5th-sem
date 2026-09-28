import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton.
 * Prevents creating multiple database connections during hot-reload in development.
 */
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function withConnectionRetry(operation) {
  const retryDelays = [1000, 3000];

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (error?.code !== 'P1001' || attempt >= retryDelays.length) throw error;

      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
