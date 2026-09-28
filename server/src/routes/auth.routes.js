import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authLimiter } from '../config/rateLimiter.js';

const router = Router();

// Rate-limit all auth endpoints
router.use(authLimiter);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login',    validate(loginSchema),    authController.login);
router.post('/logout',   authController.logout);
router.get('/me',        authenticate,             authController.getMe);

export default router;
