import { GoogleBooksService } from './googleBooks.service';
import logger from '../utils/logger';

export class BookSearchService {
  /**
   * Search books using Google Books API
   */
  static async searchBooks(query: string, limit: number = 20) {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }

      const maxResults = Math.min(limit, 40); // Google Books API limit
      const books = await GoogleBooksService.searchBooks(query, maxResults);
      
      logger.info('Books search completed:', { query, resultsCount: books.length });
      return books;
    } catch (error: any) {
      logger.error('Error searching books:', { error: error.message, query });
      throw error;
    }
  }

  /**
   * Get book details by Google Books ID
   */
  static async getBookDetails(googleBooksId: string) {
    try {
      const book = await GoogleBooksService.getBookById(googleBooksId);
      
      logger.info('Book details fetched:', { googleBooksId });
      return book;
    } catch (error: any) {
      logger.error('Error fetching book details:', { error: error.message, googleBooksId });
      throw error;
    }
  }
}
