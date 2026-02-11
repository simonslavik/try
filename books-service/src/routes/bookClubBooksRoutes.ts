import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireBookClubRole } from '../middleware/bookclubRoleMiddleware';
import { validate } from '../middleware/validate';
import {
  bookClubIdParamSchema,
  bookIdParamSchema,
  addBookForBookClubSchema,
  updateBookClubBookSchema,
  batchCurrentBooksSchema,
} from '../utils/validation';
import * as bookClubBooksController from '../controllers/bookClubBooksController';

const router = Router();

// Batch endpoint for fetching current books (public)
router.post(
  '/batch-current-books',
  validate({ body: batchCurrentBooksSchema }),
  bookClubBooksController.getBatchCurrentBooks
);

// Get books for a bookclub (public)
router.get(
  '/:bookClubId/books',
  validate({ params: bookClubIdParamSchema }),
  bookClubBooksController.getBookClubBooks
);

// Protected routes - require MODERATOR role or higher
router.post(
  '/:bookClubId/books',
  authMiddleware,
  requireBookClubRole('MODERATOR'),
  validate({ params: bookClubIdParamSchema, body: addBookForBookClubSchema }),
  bookClubBooksController.addBookClubBook
);

router.patch(
  '/:bookClubId/books/:bookId',
  authMiddleware,
  requireBookClubRole('MODERATOR'),
  validate({ params: bookClubIdParamSchema, body: updateBookClubBookSchema }),
  bookClubBooksController.updateBookClubBook
);

router.delete(
  '/:bookClubId/books/:bookId',
  authMiddleware,
  requireBookClubRole('MODERATOR'),
  validate({ params: bookClubIdParamSchema }),
  bookClubBooksController.deleteBookClubBook
);

export default router;
