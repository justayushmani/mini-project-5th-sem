import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';
import prisma, { withConnectionRetry } from '../lib/prisma.js';

/**
 * In-memory user cache with 60-second TTL.
 * Avoids exhausting database connection pool when multiple parallel API requests
 * arrive for the same authenticated user session.
 */
const USER_CACHE_TTL_MS = 60 * 1000;
const userCache = new Map(); // userId -> { user, expiresAt }

export function invalidateUserCache(userId) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

async function getAuthenticatedUser(userId) {
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const user = await withConnectionRetry(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, preferredLanguage: true },
    })
  );

  if (user) {
    if (userCache.size > 1000) {
      const oldestKey = userCache.keys().next().value;
      userCache.delete(oldestKey);
    }
    userCache.set(userId, { user, expiresAt: now + USER_CACHE_TTL_MS });
  } else {
    userCache.delete(userId);
  }

  return user;
}

/**
 * Authentication middleware.
 * Checks for JWT in:
 *   1. HTTP-only cookie ('token')
 *   2. Authorization header ('Bearer <token>')
 * 
 * On success, attaches req.user = { id, email, name, preferredLanguage }
 */
export async function authenticate(req, res, next) {
  try {
    // Extract token from cookie or Authorization header
    const token = req.cookies?.token
      || (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return errorResponse(res, 'Authentication required', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, env.jwtSecret);

    // Fetch user with in-memory caching and connection pool retry
    const user = await getAuthenticatedUser(decoded.userId);

    if (!user) {
      return errorResponse(res, 'User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Invalid or expired token', 401);
    }
    next(error);
  }
}

/**
 * Optional authentication — doesn't block unauthenticated requests
 * but attaches req.user if a valid token is present.
 * Useful for endpoints that behave differently for logged-in users.
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.token
      || (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (token) {
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await getAuthenticatedUser(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Silently ignore invalid tokens — user just isn't authenticated
  }
  next();
}
