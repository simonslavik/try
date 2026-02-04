import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireBookClubRole } from '../middleware/bookclubRoleMiddleware';
import * as bookClubBooksController from '../controllers/bookClubBooksController';

const router = Router();

// Batch endpoint for fetching current books (public)
router.post('/batch-current-books', bookClubBooksController.getBatchCurrentBooks);

// Get books for a bookclub (public)
router.get('/:bookClubId/books', bookClubBooksController.getBookClubBooks);

// Protected routes - require MODERATOR role or higher
router.post(
  '/:bookClubId/books',
  authMiddleware,
  requireBookClubRole('MODERATOR'),
  bookClubBooksController.addBookClubBook
);

router.patch(
  '/:bookClubId/books/:bookId',
  authMiddleware,
  requireBookClubRole('MODERATOR'),
  bookClubBooksController.updateBookClubBook
);

router.delete(
  '/:bookClubId/books/:bookId',
  authMiddleware,
  requireBookClubRole('MODERATOR'),
  bookClubBooksController.deleteBookClubBook
);

export default router;
