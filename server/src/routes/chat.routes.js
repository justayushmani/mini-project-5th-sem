import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { chatLimiter } from '../config/rateLimiter.js';
import { chatMessageSchema } from '../validators/chat.validator.js';

const router = Router();
router.use(authenticate);

router.post('/', chatLimiter, validate(chatMessageSchema), chatController.sendMessage);
router.get('/sessions', chatLimiter, chatController.getSessions);
router.get('/sessions/:sessionId', chatLimiter, chatController.getSession);
router.delete('/sessions/:sessionId', chatLimiter, chatController.deleteSession);

export default router;
