import { Router } from 'express';
import * as docSimplifierController from '../controllers/docSimplifier.controller.js';
import documentUpload from '../middleware/upload.middleware.js';
import validateDocSimplifierBody from '../validators/docSimplifier.validator.js';
import { docSimplifierLimiter } from '../config/rateLimiter.js';

const router = Router();

// POST /api/doc-simplifier/simplify
// Public route with dedicated rate limiting for shared Gemini quota
router.post(
  '/simplify',
  docSimplifierLimiter,
  documentUpload,
  validateDocSimplifierBody,
  docSimplifierController.simplify
);

export default router;
