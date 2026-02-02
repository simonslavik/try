import { ReadingProgressRepository } from '../repositories/readingProgress.repository';
import { BookClubBooksRepository } from '../repositories/bookClubBooks.repository';
import { BookClubReviewsRepository } from '../repositories/bookClubReviews.repository';
import logger from '../utils/logger';

export class ReadingProgressService {
  /**
   * Get reading progress for a bookclub book
   */
  static async getReadingProgress(bookClubBookId: string) {
    try {
      return await ReadingProgressRepository.findByBookClubBook(bookClubBookId);
    } catch (error: any) {
      logger.error('Error fetching reading progress:', { error: error.message, bookClubBookId });
      throw error;
    }
  }

  /**
   * Post reading progress
   */
  static async postReadingProgress(
    userId: string,
    bookClubBookId: string,
    pagesRead: number,
    notes?: string
  ) {
    try {
      const progress = await ReadingProgressRepository.create({
        userId,
        bookClubBookId,
        pagesRead,
        notes: notes || null
      });

      logger.info('Reading progress posted:', { userId, bookClubBookId, pagesRead });
      return progress;
    } catch (error: any) {
      logger.error('Error posting reading progress:', { error: error.message, userId, bookClubBookId });
      throw error;
    }
  }

  /**
   * Get reviews for a bookclub book
   */
  static async getReviews(bookClubBookId: string) {
    try {
      return await BookClubReviewsRepository.findByBookClubBook(bookClubBookId);
    } catch (error: any) {
      logger.error('Error fetching reviews:', { error: error.message, bookClubBookId });
      throw error;
    }
  }

  /**
   * Add or update review
   */
  static async addOrUpdateReview(
    userId: string,
    bookClubBookId: string,
    rating: number,
    reviewText?: string
  ) {
    try {
      const review = await BookClubReviewsRepository.upsert(userId, bookClubBookId, {
        rating,
        reviewText: reviewText || null
      });

      logger.info('Review posted:', { userId, bookClubBookId, rating });
      return review;
    } catch (error: any) {
      logger.error('Error posting review:', { error: error.message, userId, bookClubBookId });
      throw error;
    }
  }
}
