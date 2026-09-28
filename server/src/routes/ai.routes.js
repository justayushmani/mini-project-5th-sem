import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { aiLimiter } from '../config/rateLimiter.js';
import validate from '../middleware/validate.js';
import { extractProfileSchema } from '../validators/ai.validator.js';

const router = Router();

router.post('/extract-profile', aiLimiter, validate(extractProfileSchema), aiController.extractProfile);

export default router;
