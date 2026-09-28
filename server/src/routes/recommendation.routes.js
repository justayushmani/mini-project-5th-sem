import { Router } from 'express';
import * as recommendationController from '../controllers/recommendation.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../config/rateLimiter.js';

const router = Router();

// All recommendation routes require authentication
router.use(authenticate);

// History must come before :id to avoid being caught by the param route
router.get('/history', recommendationController.getHistory);
router.post('/',       aiLimiter, recommendationController.createRecommendation);
router.get('/:id',     recommendationController.getRecommendation);

export default router;
