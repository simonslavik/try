import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserBooksService } from '../services/userBooks.service';
import { addBookSchema, updateBookSchema } from '../utils/validation';
import { UserBooksRepository } from '../repositories/userBooks.repository';

/**
 * Get user's books (favorites, reading, etc.)
 */
export const getUserBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const userBooks = await UserBooksService.getUserBooks(req.user!.userId, status as string);
    res.json({ success: true, data: userBooks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add book to user's library
 */
export const addUserBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = addBookSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { googleBooksId, status, rating, review } = value;
    const userBook = await UserBooksService.addUserBook(
      req.user!.userId,
      googleBooksId,
      status,
      rating,
      review
    );

    res.json({ success: true, data: userBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update user book status/rating
 */
export const updateUserBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = updateBookSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { bookId } = req.params;
    const { status, rating, review } = value;

    const userBook = await UserBooksService.updateUserBook(req.user!.userId, bookId as string, {
      status,
      rating,
      review
    });

    res.json({ success: true, data: userBook });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Remove book from user's library
 */
export const removeUserBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;
    await UserBooksService.deleteUserBook(req.user!.userId, bookId as string);
    res.json({ success: true, message: 'Book removed from library' });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Remove book from user's library (by userBookId)
 */
export const deleteUserBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userBookId } = req.params;

    // Check if book exists and belongs to user
    const existingUserBook = await UserBooksRepository.findById(userBookId as string);

    if (!existingUserBook) {
      res.status(404).json({
        error: 'Book not found in your library'
      });
      return;
    }

    // Verify the book belongs to the requesting user
    if (existingUserBook.userId !== req.user!.userId) {
      res.status(403).json({
        error: 'You can only delete books from your own library'
      });
      return;
    }

    await UserBooksRepository.deleteById(userBookId as string);
    res.json({ success: true, message: 'Book removed from library' });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
};
