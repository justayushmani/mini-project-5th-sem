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
  const retryDelays = [2000, 4000, 8000, 12000];

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const isConnectionError =
        error?.code === 'P1001' ||
        error?.errorCode === 'P1001' ||
        error?.name === 'PrismaClientInitializationError';

      if (!isConnectionError || attempt >= retryDelays.length) throw error;

      console.warn(`[Prisma] Database connection attempt ${attempt + 1} failed (${error?.errorCode || error?.code || error?.message}). Retrying in ${retryDelays[attempt]}ms (Neon DB may be waking up)...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
