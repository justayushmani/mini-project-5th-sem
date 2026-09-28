import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';
import prisma from '../lib/prisma.js';

/**
 * Authentication middleware.
 * Checks for JWT in:
 *   1. HTTP-only cookie ('token')
 *   2. Authorization header ('Bearer <token>')
 * 
 * On success, attaches req.user = { id, email, name }
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

    // Fetch user from database (ensures user still exists and isn't deleted)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, preferredLanguage: true },
    });

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
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, preferredLanguage: true },
      });
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Silently ignore invalid tokens — user just isn't authenticated
  }
  next();
}
