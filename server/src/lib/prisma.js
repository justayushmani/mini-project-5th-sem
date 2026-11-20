import { PrismaClient } from '@prisma/client';

/**
 * Ensure database connection string includes essential pool and timeout options
 * for serverless PostgreSQL (e.g. Neon with PgBouncer).
 */
function enrichDatabaseUrl(url) {
  if (!url) return url;
  let enriched = url;
  if (!enriched.includes('connect_timeout=')) {
    enriched += (enriched.includes('?') ? '&' : '?') + 'connect_timeout=30';
  }
  if (!enriched.includes('pool_timeout=')) {
    enriched += (enriched.includes('?') ? '&' : '?') + 'pool_timeout=30';
  }
  if (!enriched.includes('connection_limit=')) {
    enriched += (enriched.includes('?') ? '&' : '?') + 'connection_limit=15';
  }
  return enriched;
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = enrichDatabaseUrl(process.env.DATABASE_URL);
}

/**
 * Determines whether a Prisma or PostgreSQL error is transient and retryable.
 */
export function isConnectionError(error) {
  if (!error) return false;

  const code = error?.code || error?.errorCode;
  // P1001: Can't reach database server
  // P1002: Database server was reached but timed out
  // P1008: Operations timed out
  // P1017: Server has closed the connection
  // P2024: Timed out fetching a new connection from the connection pool
  if (['P1001', 'P1002', 'P1008', 'P1017', 'P2024'].includes(code)) {
    return true;
  }

  if (
    error?.name === 'PrismaClientInitializationError' ||
    error?.name === 'PrismaClientRustPanicError'
  ) {
    return true;
  }

  const msg = (error?.message || '').toLowerCase();
  return (
    msg.includes('connection pool') ||
    msg.includes('timed out fetching a new connection') ||
    msg.includes('connection closed') ||
    msg.includes('connection lost') ||
    msg.includes('socket hang up') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('econnrefused') ||
    msg.includes("can't reach database server")
  );
}

/**
 * Execute an asynchronous operation with retry on transient database connection errors.
 */
export async function withConnectionRetry(operation, maxRetries = 3) {
  const retryDelays = [1000, 2500, 5000];

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isConnectionError(error) || attempt >= maxRetries) {
        throw error;
      }

      const reason = error?.code || error?.name || error?.message?.slice(0, 120);
      console.warn(
        `[Prisma] Connection/pool attempt ${attempt + 1} failed (${reason}). Retrying in ${retryDelays[attempt]}ms (Neon DB may be waking up or pool is busy)...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }
  }
}

/**
 * Prisma client singleton.
 * Uses Prisma Client extensions ($extends) to automatically wrap all model operations
 * in withConnectionRetry, preventing pool exhaustion and cold-start failures.
 */
const globalForPrisma = globalThis;

const basePrisma =
  globalForPrisma.rawPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

const prisma =
  globalForPrisma.prisma ??
  basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          return withConnectionRetry(() => query(args));
        },
      },
    },
  });

// Ensure top-level lifecycle methods remain directly callable
if (typeof prisma.$connect !== 'function') {
  prisma.$connect = () => basePrisma.$connect();
}
if (typeof prisma.$disconnect !== 'function') {
  prisma.$disconnect = () => basePrisma.$disconnect();
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.rawPrisma = basePrisma;
  globalForPrisma.prisma = prisma;
}

export default prisma;
