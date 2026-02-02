import request from 'supertest';
import express, { Express } from 'express';
import bookSearchRoutes from '../../src/routes/bookSearchRoutes';
import { GoogleBooksService } from '../../src/services/googleBooks.service';

// Mock Google Books API
jest.mock('../../src/services/googleBooks.service');

const app: Express = express();
app.use(express.json());
app.use('/v1/books', bookSearchRoutes);

describe('Book Search Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/books/search', () => {
    it('should search books by query', async () => {
      const mockSearchResults = [
        {
          googleBooksId: 'book1',
          title: 'Test Book 1',
          author: 'Author 1',
          description: 'Description 1',
          coverUrl: 'http://example.com/cover1.jpg',
          pageCount: 200,
          publishedDate: '2020-01-01',
          isbn: '1234567890'
        },
        {
          googleBooksId: 'book2',
          title: 'Test Book 2',
          author: 'Author 2',
          description: 'Description 2',
          coverUrl: 'http://example.com/cover2.jpg',
          pageCount: 300,
          publishedDate: '2021-01-01',
          isbn: '0987654321'
        }
      ];

      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue(mockSearchResults);

      const response = await request(app)
        .get('/v1/books/search?q=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBe('Test Book 1');
      expect(GoogleBooksService.searchBooks).toHaveBeenCalledWith('test', 20);
    });

    it('should return 400 if query is missing', async () => {
      const response = await request(app)
        .get('/v1/books/search')
        .expect(400);

      expect(response.body.error).toContain('Query parameter');
    });

    it('should handle search errors', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      const response = await request(app)
        .get('/v1/books/search?q=test')
        .expect(500);

      expect(response.body.error).toBe('API error');
    });

    it('should return empty array for no results', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/v1/books/search?q=nonexistent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should handle empty query string', async () => {
      const response = await request(app)
        .get('/v1/books/search?q=')
        .expect(400);

      expect(response.body.error).toContain('Query parameter');
    });

    it('should handle special characters in query', async () => {
      const mockResults = [{
        googleBooksId: 'cpp1',
        title: 'C++ Programming',
        author: 'Test Author',
        description: 'Test',
        coverUrl: 'http://example.com/cover.jpg',
        pageCount: 300,
        publishedDate: '2020-01-01',
        isbn: '1234567890'
      }];

      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/v1/books/search?q=C%2B%2B')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(GoogleBooksService.searchBooks).toHaveBeenCalledWith('C++', 20);
    });

    it('should handle unicode characters in query', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/v1/books/search?q=日本語')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(GoogleBooksService.searchBooks).toHaveBeenCalledWith('日本語', 20);
    });

    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(500);
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get(`/v1/books/search?q=${longQuery}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle whitespace in query', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/v1/books/search?q=test%20book%20title')
        .expect(200);

      expect(GoogleBooksService.searchBooks).toHaveBeenCalledWith('test book title', 20);
    });

    it('should handle network timeout', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );

      const response = await request(app)
        .get('/v1/books/search?q=test')
        .expect(500);

      expect(response.body.error).toBe('Network timeout');
    });

    it('should handle malformed API response', async () => {
      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue([
        {
          googleBooksId: 'book1',
          title: 'Test Book',
          // Missing required fields
        }
      ]);

      const response = await request(app)
        .get('/v1/books/search?q=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should handle single result', async () => {
      const mockResult = [{
        googleBooksId: 'book1',
        title: 'Single Book',
        author: 'Author',
        description: 'Description',
        coverUrl: 'http://example.com/cover.jpg',
        pageCount: 200,
        publishedDate: '2020-01-01',
        isbn: '1234567890'
      }];

      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/v1/books/search?q=single')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should handle large result sets', async () => {
      const largeResults = Array.from({ length: 40 }, (_, i) => ({
        googleBooksId: `book${i}`,
        title: `Book ${i}`,
        author: `Author ${i}`,
        description: `Description ${i}`,
        coverUrl: `http://example.com/cover${i}.jpg`,
        pageCount: 200,
        publishedDate: '2020-01-01',
        isbn: `123456789${i}`
      }));

      (GoogleBooksService.searchBooks as jest.Mock).mockResolvedValue(largeResults);

      const response = await request(app)
        .get('/v1/books/search?q=popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(40);
    });
  });

  describe('GET /v1/books/google/:googleBooksId', () => {
    it('should get book by ID', async () => {
      const mockBook = {
        googleBooksId: 'abc123',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test description',
        coverUrl: 'http://example.com/cover.jpg',
        pageCount: 250,
        publishedDate: '2020-01-01',
        isbn: '1234567890'
      };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(mockBook);

      const response = await request(app)
        .get('/v1/books/google/abc123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Book');
      expect(GoogleBooksService.getBookById).toHaveBeenCalledWith('abc123');
    });

    it('should return 500 for non-existent book', async () => {
      (GoogleBooksService.getBookById as jest.Mock).mockRejectedValue(
        new Error('Book not found')
      );

      const response = await request(app)
        .get('/v1/books/google/nonexistent')
        .expect(500);

      expect(response.body.error).toBe('Book not found');
    });

    it('should handle book ID with special characters', async () => {
      const mockBook = {
        googleBooksId: 'abc-123_xyz',
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test description',
        coverUrl: 'http://example.com/cover.jpg',
        pageCount: 250,
        publishedDate: '2020-01-01',
        isbn: '1234567890'
      };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(mockBook);

      const response = await request(app)
        .get('/v1/books/google/abc-123_xyz')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.googleBooksId).toBe('abc-123_xyz');
    });

    it('should handle API timeout for book lookup', async () => {
      (GoogleBooksService.getBookById as jest.Mock).mockRejectedValue(
        new Error('Request timeout')
      );

      const response = await request(app)
        .get('/v1/books/google/timeout123')
        .expect(500);

      expect(response.body.error).toBe('Request timeout');
    });

    it('should handle book with missing optional fields', async () => {
      const mockBook = {
        googleBooksId: 'minimal123',
        title: 'Minimal Book',
        author: 'Unknown',
        description: '',
        coverUrl: '',
        pageCount: 0,
        publishedDate: '',
        isbn: ''
      };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(mockBook);

      const response = await request(app)
        .get('/v1/books/google/minimal123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Minimal Book');
    });

    it('should handle very long book IDs', async () => {
      const longId = 'a'.repeat(200);
      const mockBook = {
        googleBooksId: longId,
        title: 'Test',
        author: 'Test',
        description: 'Test',
        coverUrl: 'http://example.com/cover.jpg',
        pageCount: 100,
        publishedDate: '2020-01-01',
        isbn: '1234567890'
      };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(mockBook);

      const response = await request(app)
        .get(`/v1/books/google/${longId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle numeric book IDs', async () => {
      const mockBook = {
        googleBooksId: '12345',
        title: 'Numeric ID Book',
        author: 'Test',
        description: 'Test',
        coverUrl: 'http://example.com/cover.jpg',
        pageCount: 100,
        publishedDate: '2020-01-01',
        isbn: '1234567890'
      };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(mockBook);

      const response = await request(app)
        .get('/v1/books/google/12345')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.googleBooksId).toBe('12345');
    });

    it('should handle book with null values', async () => {
      const mockBook = {
        googleBooksId: 'null123',
        title: 'Test',
        author: null,
        description: null,
        coverUrl: null,
        pageCount: null,
        publishedDate: null,
        isbn: null
      };

      (GoogleBooksService.getBookById as jest.Mock).mockResolvedValue(mockBook);

      const response = await request(app)
        .get('/v1/books/google/null123')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
