import { UserBooksRepository } from '../repositories/userBooks.repository';
import { BooksRepository } from '../repositories/books.repository';
import { GoogleBooksService } from './googleBooks.service';
import logger from '../utils/logger';

export class UserBooksService {
  /**
   * Get user's books with optional status filter
   */
  static async getUserBooks(userId: string, status?: string) {
    try {
      return await UserBooksRepository.findByUserId(userId, status);
    } catch (error: any) {
      logger.error('Error fetching user books:', { error: error.message, userId, status });
      throw error;
    }
  }

  /**
   * Add book to user's library
   */
  static async addUserBook(
    userId: string,
    googleBooksId: string,
    status: string,
    rating?: number,
    review?: string
  ) {
    try {
      // Fetch book data from Google Books API
      const bookData = await GoogleBooksService.getBookById(googleBooksId);

      // Create or find book in database
      const book = await BooksRepository.upsert(googleBooksId, bookData);

      // Add to user's library
      const userBook = await UserBooksRepository.upsert(userId, book.id, {
        status,
        rating,
        review,
      });

      logger.info('Book added to user library:', { userId, bookId: book.id, status });
      return userBook;
    } catch (error: any) {
      logger.error('Error adding user book:', { error: error.message, userId, googleBooksId });
      throw error;
    }
  }

  /**
   * Update user book
   */
  static async updateUserBook(
    userId: string,
    bookId: string,
    data: { status?: string; rating?: number; review?: string }
  ) {
    try {
      // Check if book exists in user's library
      const existingUserBook = await UserBooksRepository.findOne(userId, bookId);

      if (!existingUserBook) {
        throw new Error('Book not found in your library. Please add it first.');
      }

      const updatedBook = await UserBooksRepository.update(userId, bookId, data);

      logger.info('User book updated:', { userId, bookId });
      return updatedBook;
    } catch (error: any) {
      logger.error('Error updating user book:', { error: error.message, userId, bookId });
      throw error;
    }
  }

  /**
   * Delete book from user's library
   */
  static async deleteUserBook(userId: string, bookId: string) {
    try {
      // Check if book exists in user's library
      const existingUserBook = await UserBooksRepository.findOne(userId, bookId);

      if (!existingUserBook) {
        throw new Error('Book not found in your library');
      }

      await UserBooksRepository.delete(userId, bookId);

      logger.info('User book deleted:', { userId, bookId });
    } catch (error: any) {
      logger.error('Error deleting user book:', { error: error.message, userId, bookId });
      throw error;
    }
  }
}
