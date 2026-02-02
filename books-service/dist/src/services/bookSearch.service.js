"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookSearchService = void 0;
const googleBooks_service_1 = require("./googleBooks.service");
const logger_1 = __importDefault(require("../utils/logger"));
class BookSearchService {
    /**
     * Search books using Google Books API
     */
    static async searchBooks(query, limit = 20) {
        try {
            if (!query || query.trim() === '') {
                throw new Error('Search query is required');
            }
            const maxResults = Math.min(limit, 40); // Google Books API limit
            const books = await googleBooks_service_1.GoogleBooksService.searchBooks(query, maxResults);
            logger_1.default.info('Books search completed:', { query, resultsCount: books.length });
            return books;
        }
        catch (error) {
            logger_1.default.error('Error searching books:', { error: error.message, query });
            throw error;
        }
    }
    /**
     * Get book details by Google Books ID
     */
    static async getBookDetails(googleBooksId) {
        try {
            const book = await googleBooks_service_1.GoogleBooksService.getBookById(googleBooksId);
            logger_1.default.info('Book details fetched:', { googleBooksId });
            return book;
        }
        catch (error) {
            logger_1.default.error('Error fetching book details:', { error: error.message, googleBooksId });
            throw error;
        }
    }
}
exports.BookSearchService = BookSearchService;
