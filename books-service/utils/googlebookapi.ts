import axios from 'axios';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY; // Optional, higher rate limits with key

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

export class GoogleBooksService {
  static async searchBooks(query: string, maxResults: number = 20) {
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
    } catch (error) {
      console.error('Google Books API error:', error);
      throw new Error('Failed to search books');
    }
  }

  static async getBookById(googleBooksId: string) {
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
    } catch (error) {
      console.error('Google Books API error:', error);
      throw new Error('Failed to fetch book details');
    }
  }
}