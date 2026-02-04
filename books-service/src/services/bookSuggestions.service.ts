import { BookSuggestionsRepository } from '../repositories/bookSuggestions.repository';
import { BooksRepository } from '../repositories/books.repository';
import { GoogleBooksService } from './googleBooks.service';
import logger from '../utils/logger';

export class BookSuggestionsService {
  /**
   * Get suggestions for a bookclub
   */
  static async getBookSuggestions(bookClubId: string) {
    try {
      return await BookSuggestionsRepository.findByBookClubId(bookClubId);
    } catch (error: any) {
      logger.error('Error fetching book suggestions:', { error: error.message, bookClubId });
      throw error;
    }
  }

  /**
   * Suggest a book for bookclub
   */
  static async suggestBook(
    bookClubId: string,
    userId: string,
    googleBooksId: string,
    reason?: string
  ) {
    try {
      // Fetch book data from Google Books API
      const bookData = await GoogleBooksService.getBookById(googleBooksId);

      // Create or find book in database
      const book = await BooksRepository.upsert(googleBooksId, bookData);

      // Create suggestion
      const suggestion = await BookSuggestionsRepository.create({
        bookClubId,
        bookId: book.id,
        suggestedById: userId,
        reason: reason || null,
      });

      logger.info('Book suggested:', { bookClubId, bookId: book.id, userId });
      return suggestion;
    } catch (error: any) {
      logger.error('Error suggesting book:', { error: error.message, bookClubId, googleBooksId });
      throw error;
    }
  }

  /**
   * Delete book suggestion
   */
  static async deleteSuggestion(suggestionId: string, userId: string) {
    try {
      // Note: Add authorization check if needed (verify userId is the suggester)
      await BookSuggestionsRepository.delete(suggestionId);

      logger.info('Book suggestion deleted:', { suggestionId, userId });
    } catch (error: any) {
      logger.error('Error deleting suggestion:', { error: error.message, suggestionId });
      throw error;
    }
  }
}
