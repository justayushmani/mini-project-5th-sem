import { Router } from 'express';
import * as schemeController from '../controllers/scheme.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Schemes are public — optionalAuth lets us personalize if user is logged in
router.get('/',           optionalAuth, schemeController.getSchemes);
router.get('/categories', schemeController.getCategories);
router.get('/states',     schemeController.getStates);
router.get('/:id',        optionalAuth, schemeController.getScheme);

export default router;
