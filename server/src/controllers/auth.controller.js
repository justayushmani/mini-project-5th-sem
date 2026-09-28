import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma, { withConnectionRetry } from '../lib/prisma.js';
import env from '../config/env.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const SALT_ROUNDS = 12;

// Helper: issue JWT and set HTTP-only cookie
function issueToken(res, userId) {
  const token = jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

  res.cookie('token', token, {
    httpOnly: true,                    // Not accessible from JS — XSS protection
    secure: env.isProd,               // HTTPS only in production
    sameSite: env.isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
}

// Helper: safe user object (never expose passwordHash)
function safeUser(user) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existing = await withConnectionRetry(() =>
      prisma.user.findUnique({ where: { email } })
    );
    if (existing) {
      return errorResponse(res, 'An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    issueToken(res, user.id);

    logger.info(`New user registered: ${user.id}`);
    return successResponse(res, { user: safeUser(user) }, 201);
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await withConnectionRetry(() =>
      prisma.user.findUnique({ where: { email } })
    );
    if (!user) {
      // Use same message as wrong password — prevents email enumeration
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    issueToken(res, user.id);

    logger.info(`User logged in: ${user.id}`);
    return successResponse(res, { user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'strict' : 'lax',
  });
  return successResponse(res, { message: 'Logged out successfully' });
}

// GET /api/auth/me
export async function getMe(req, res) {
  // req.user is attached by authenticate middleware
  return successResponse(res, { user: req.user });
}
