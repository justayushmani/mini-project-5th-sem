import rateLimit from 'express-rate-limit';

/**
 * Rate limiters for different endpoint categories.
 * AI endpoints get stricter limits to control cost.
 */

// General API — 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints — 20 requests per 15 minutes (prevent brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints — 30 requests per 15 minutes (cost control)
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many AI requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat endpoints — 60 requests per 15 minutes
export const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many chat requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
