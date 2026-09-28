import { Router } from 'express';
import * as profileController from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/profile.validator.js';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

router.get('/', profileController.getProfile);
router.put('/', validate(updateProfileSchema), profileController.updateProfile);

export default router;
