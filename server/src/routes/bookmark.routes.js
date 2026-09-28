import { Router } from 'express';
import * as bookmarkController from '../controllers/bookmark.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All bookmark routes require authentication
router.use(authenticate);

router.post('/',           bookmarkController.addBookmark);
router.get('/',            bookmarkController.getBookmarks);
router.delete('/:schemeId', bookmarkController.removeBookmark);

export default router;
