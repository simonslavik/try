"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookSuggestionsService = void 0;
const bookSuggestions_repository_1 = require("../repositories/bookSuggestions.repository");
const books_repository_1 = require("../repositories/books.repository");
const googleBooks_service_1 = require("./googleBooks.service");
const logger_1 = __importDefault(require("../utils/logger"));
class BookSuggestionsService {
    /**
     * Get suggestions for a bookclub
     */
    static async getBookSuggestions(bookClubId) {
        try {
            return await bookSuggestions_repository_1.BookSuggestionsRepository.findByBookClubId(bookClubId);
        }
        catch (error) {
            logger_1.default.error('Error fetching book suggestions:', { error: error.message, bookClubId });
            throw error;
        }
    }
    /**
     * Suggest a book for bookclub
     */
    static async suggestBook(bookClubId, userId, googleBooksId, reason) {
        try {
            // Fetch book data from Google Books API
            const bookData = await googleBooks_service_1.GoogleBooksService.getBookById(googleBooksId);
            // Create or find book in database
            const book = await books_repository_1.BooksRepository.upsert(googleBooksId, bookData);
            // Create suggestion
            const suggestion = await bookSuggestions_repository_1.BookSuggestionsRepository.create({
                bookClubId,
                bookId: book.id,
                suggestedById: userId,
                reason: reason || null
            });
            logger_1.default.info('Book suggested:', { bookClubId, bookId: book.id, userId });
            return suggestion;
        }
        catch (error) {
            logger_1.default.error('Error suggesting book:', { error: error.message, bookClubId, googleBooksId });
            throw error;
        }
    }
    /**
     * Delete book suggestion
     */
    static async deleteSuggestion(suggestionId, userId) {
        try {
            // Note: Add authorization check if needed (verify userId is the suggester)
            await bookSuggestions_repository_1.BookSuggestionsRepository.delete(suggestionId);
            logger_1.default.info('Book suggestion deleted:', { suggestionId, userId });
        }
        catch (error) {
            logger_1.default.error('Error deleting suggestion:', { error: error.message, suggestionId });
            throw error;
        }
    }
}
exports.BookSuggestionsService = BookSuggestionsService;
