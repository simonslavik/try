"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleBooksService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
const redis_1 = require("../config/redis");
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds
class GoogleBooksService {
    /**
     * Search books from Google Books API with Redis caching
     */
    static async searchBooks(query, maxResults = 20) {
        const redis = (0, redis_1.getRedisClient)();
        const cacheKey = `books:search:${query}:${maxResults}`;
        try {
            // Try to get from cache first
            if (redis && redis.isOpen) {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    logger_1.default.info('✅ Cache hit for book search:', { query });
                    return JSON.parse(cached);
                }
                logger_1.default.info('❌ Cache miss for book search:', { query });
            }
            const params = {
                q: query,
                maxResults,
                printType: 'books',
            };
            if (API_KEY) {
                params.key = API_KEY;
            }
            const response = await axios_1.default.get(GOOGLE_BOOKS_API, { params });
            const books = response.data.items?.map((item) => ({
                googleBooksId: item.id,
                title: item.volumeInfo.title,
                author: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
                coverUrl: item.volumeInfo.imageLinks?.thumbnail || null,
                description: item.volumeInfo.description || null,
                pageCount: item.volumeInfo.pageCount || null,
                isbn: item.volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier || null,
            })) || [];
            // Cache the results
            if (redis && redis.isOpen && books.length > 0) {
                await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(books));
                logger_1.default.info('💾 Cached book search results:', { query, count: books.length });
            }
            return books;
        }
        catch (error) {
            logger_1.default.error('Google Books API search error:', { error: error.message, query });
            throw new Error('Failed to search books');
        }
    }
    /**
     * Get book details by Google Books ID with Redis caching
     */
    static async getBookById(googleBooksId) {
        const redis = (0, redis_1.getRedisClient)();
        const cacheKey = `books:details:${googleBooksId}`;
        try {
            // Try to get from cache first
            if (redis && redis.isOpen) {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    logger_1.default.info('✅ Cache hit for book details:', { googleBooksId });
                    return JSON.parse(cached);
                }
                logger_1.default.info('❌ Cache miss for book details:', { googleBooksId });
            }
            const params = {};
            if (API_KEY)
                params.key = API_KEY;
            const response = await axios_1.default.get(`${GOOGLE_BOOKS_API}/${googleBooksId}`, { params });
            const book = response.data;
            const bookData = {
                googleBooksId: book.id,
                title: book.volumeInfo.title,
                author: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
                coverUrl: book.volumeInfo.imageLinks?.thumbnail || null,
                description: book.volumeInfo.description || null,
                pageCount: book.volumeInfo.pageCount || null,
                isbn: book.volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier || null,
            };
            // Cache the result
            if (redis && redis.isOpen) {
                await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(bookData));
                logger_1.default.info('💾 Cached book details:', { googleBooksId });
            }
            return bookData;
        }
        catch (error) {
            logger_1.default.error('Google Books API get book error:', { error: error.message, googleBooksId });
            throw new Error('Failed to fetch book details');
        }
    }
}
exports.GoogleBooksService = GoogleBooksService;
