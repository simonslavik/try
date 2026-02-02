import axios from 'axios';
import logger from '../utils/logger';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    pageCount?: number;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

interface BookData {
  googleBooksId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string | null;
  pageCount: number | null;
  isbn: string | null;
}

export class GoogleBooksService {
  /**
   * Search books from Google Books API
   */
  static async searchBooks(query: string, maxResults: number = 20): Promise<BookData[]> {
    try {
      const params: any = {
        q: query,
        maxResults,
        printType: 'books'
      };
      
      if (API_KEY) {
        params.key = API_KEY;
      }

      const response = await axios.get(GOOGLE_BOOKS_API, { params });
      
      return response.data.items?.map((item: GoogleBook) => ({
        googleBooksId: item.id,
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
        coverUrl: item.volumeInfo.imageLinks?.thumbnail || null,
        description: item.volumeInfo.description || null,
        pageCount: item.volumeInfo.pageCount || null,
        isbn: item.volumeInfo.industryIdentifiers?.find(
          (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier || null
      })) || [];
    } catch (error: any) {
      logger.error('Google Books API search error:', { error: error.message, query });
      throw new Error('Failed to search books');
    }
  }

  /**
   * Get book details by Google Books ID
   */
  static async getBookById(googleBooksId: string): Promise<BookData> {
    try {
      const params: any = {};
      if (API_KEY) params.key = API_KEY;

      const response = await axios.get(`${GOOGLE_BOOKS_API}/${googleBooksId}`, { params });
      const book = response.data;

      return {
        googleBooksId: book.id,
        title: book.volumeInfo.title,
        author: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
        coverUrl: book.volumeInfo.imageLinks?.thumbnail || null,
        description: book.volumeInfo.description || null,
        pageCount: book.volumeInfo.pageCount || null,
        isbn: book.volumeInfo.industryIdentifiers?.find(
          (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier || null
      };
    } catch (error: any) {
      logger.error('Google Books API get book error:', { error: error.message, googleBooksId });
      throw new Error('Failed to fetch book details');
    }
  }
}
