"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const bookSearchRoutes_1 = __importDefault(require("../../src/routes/bookSearchRoutes"));
const googleBooks_service_1 = require("../../src/services/googleBooks.service");
// Mock Google Books API
jest.mock('../../src/services/googleBooks.service');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/v1/books', bookSearchRoutes_1.default);
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
                    isbn: '1234567890',
                },
                {
                    googleBooksId: 'book2',
                    title: 'Test Book 2',
                    author: 'Author 2',
                    description: 'Description 2',
                    coverUrl: 'http://example.com/cover2.jpg',
                    pageCount: 300,
                    publishedDate: '2021-01-01',
                    isbn: '0987654321',
                },
            ];
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue(mockSearchResults);
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=test').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0].title).toBe('Test Book 1');
            expect(googleBooks_service_1.GoogleBooksService.searchBooks).toHaveBeenCalledWith('intitle:test', 20);
        });
        it('should return 400 if query is missing', async () => {
            const response = await (0, supertest_1.default)(app).get('/v1/books/search').expect(400);
            expect(response.body.error).toContain('Query parameter');
        });
        it('should handle search errors', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockRejectedValue(new Error('API error'));
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=test').expect(500);
            expect(response.body.error).toBe('API error');
        });
        it('should return empty array for no results', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue([]);
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=nonexistent').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });
        it('should handle empty query string', async () => {
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=').expect(400);
            expect(response.body.error).toContain('Query parameter');
        });
        it('should handle special characters in query', async () => {
            const mockResults = [
                {
                    googleBooksId: 'cpp1',
                    title: 'C++ Programming',
                    author: 'Test Author',
                    description: 'Test',
                    coverUrl: 'http://example.com/cover.jpg',
                    pageCount: 300,
                    publishedDate: '2020-01-01',
                    isbn: '1234567890',
                },
            ];
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue(mockResults);
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=C%2B%2B').expect(200);
            expect(response.body.success).toBe(true);
            expect(googleBooks_service_1.GoogleBooksService.searchBooks).toHaveBeenCalledWith('intitle:C++', 20);
        });
        it('should handle unicode characters in query', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue([]);
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=日本語').expect(200);
            expect(response.body.success).toBe(true);
            expect(googleBooks_service_1.GoogleBooksService.searchBooks).toHaveBeenCalledWith('intitle:日本語', 20);
        });
        it('should handle very long query strings', async () => {
            const longQuery = 'a'.repeat(500);
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue([]);
            const response = await (0, supertest_1.default)(app).get(`/v1/books/search?q=${longQuery}`).expect(200);
            expect(response.body.success).toBe(true);
        });
        it('should handle whitespace in query', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue([]);
            await (0, supertest_1.default)(app).get('/v1/books/search?q=test%20book%20title').expect(200);
            expect(googleBooks_service_1.GoogleBooksService.searchBooks).toHaveBeenCalledWith('intitle:test book title', 20);
        });
        it('should handle network timeout', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockRejectedValue(new Error('Network timeout'));
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=test').expect(500);
            expect(response.body.error).toBe('Network timeout');
        });
        it('should handle malformed API response', async () => {
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue([
                {
                    googleBooksId: 'book1',
                    title: 'Test Book',
                    // Missing required fields
                },
            ]);
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=test').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
        });
        it('should handle single result', async () => {
            const mockResult = [
                {
                    googleBooksId: 'book1',
                    title: 'Single Book',
                    author: 'Author',
                    description: 'Description',
                    coverUrl: 'http://example.com/cover.jpg',
                    pageCount: 200,
                    publishedDate: '2020-01-01',
                    isbn: '1234567890',
                },
            ];
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=single').expect(200);
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
                isbn: `123456789${i}`,
            }));
            googleBooks_service_1.GoogleBooksService.searchBooks.mockResolvedValue(largeResults);
            const response = await (0, supertest_1.default)(app).get('/v1/books/search?q=popular').expect(200);
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
                isbn: '1234567890',
            };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(mockBook);
            const response = await (0, supertest_1.default)(app).get('/v1/books/google/abc123').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Test Book');
            expect(googleBooks_service_1.GoogleBooksService.getBookById).toHaveBeenCalledWith('abc123');
        });
        it('should return 500 for non-existent book', async () => {
            googleBooks_service_1.GoogleBooksService.getBookById.mockRejectedValue(new Error('Book not found'));
            const response = await (0, supertest_1.default)(app).get('/v1/books/google/nonexistent').expect(500);
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
                isbn: '1234567890',
            };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(mockBook);
            const response = await (0, supertest_1.default)(app).get('/v1/books/google/abc-123_xyz').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.googleBooksId).toBe('abc-123_xyz');
        });
        it('should handle API timeout for book lookup', async () => {
            googleBooks_service_1.GoogleBooksService.getBookById.mockRejectedValue(new Error('Request timeout'));
            const response = await (0, supertest_1.default)(app).get('/v1/books/google/timeout123').expect(500);
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
                isbn: '',
            };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(mockBook);
            const response = await (0, supertest_1.default)(app).get('/v1/books/google/minimal123').expect(200);
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
                isbn: '1234567890',
            };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(mockBook);
            const response = await (0, supertest_1.default)(app).get(`/v1/books/google/${longId}`).expect(200);
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
                isbn: '1234567890',
            };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(mockBook);
            const response = await (0, supertest_1.default)(app).get('/v1/books/google/12345').expect(200);
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
                isbn: null,
            };
            googleBooks_service_1.GoogleBooksService.getBookById.mockResolvedValue(mockBook);
            const response = await (0, supertest_1.default)(app).get('/v1/books/google/null123').expect(200);
            expect(response.body.success).toBe(true);
        });
    });
});
