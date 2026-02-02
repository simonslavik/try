"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBooksService = void 0;
const userBooks_repository_1 = require("../repositories/userBooks.repository");
const books_repository_1 = require("../repositories/books.repository");
const googleBooks_service_1 = require("./googleBooks.service");
const logger_1 = __importDefault(require("../utils/logger"));
class UserBooksService {
    /**
     * Get user's books with optional status filter
     */
    static async getUserBooks(userId, status) {
        try {
            return await userBooks_repository_1.UserBooksRepository.findByUserId(userId, status);
        }
        catch (error) {
            logger_1.default.error('Error fetching user books:', { error: error.message, userId, status });
            throw error;
        }
    }
    /**
     * Add book to user's library
     */
    static async addUserBook(userId, googleBooksId, status, rating, review) {
        try {
            // Fetch book data from Google Books API
            const bookData = await googleBooks_service_1.GoogleBooksService.getBookById(googleBooksId);
            // Create or find book in database
            const book = await books_repository_1.BooksRepository.upsert(googleBooksId, bookData);
            // Add to user's library
            const userBook = await userBooks_repository_1.UserBooksRepository.upsert(userId, book.id, {
                status,
                rating,
                review
            });
            logger_1.default.info('Book added to user library:', { userId, bookId: book.id, status });
            return userBook;
        }
        catch (error) {
            logger_1.default.error('Error adding user book:', { error: error.message, userId, googleBooksId });
            throw error;
        }
    }
    /**
     * Update user book
     */
    static async updateUserBook(userId, bookId, data) {
        try {
            // Check if book exists in user's library
            const existingUserBook = await userBooks_repository_1.UserBooksRepository.findOne(userId, bookId);
            if (!existingUserBook) {
                throw new Error('Book not found in your library. Please add it first.');
            }
            const updatedBook = await userBooks_repository_1.UserBooksRepository.update(userId, bookId, data);
            logger_1.default.info('User book updated:', { userId, bookId });
            return updatedBook;
        }
        catch (error) {
            logger_1.default.error('Error updating user book:', { error: error.message, userId, bookId });
            throw error;
        }
    }
    /**
     * Delete book from user's library
     */
    static async deleteUserBook(userId, bookId) {
        try {
            // Check if book exists in user's library
            const existingUserBook = await userBooks_repository_1.UserBooksRepository.findOne(userId, bookId);
            if (!existingUserBook) {
                throw new Error('Book not found in your library');
            }
            await userBooks_repository_1.UserBooksRepository.delete(userId, bookId);
            logger_1.default.info('User book deleted:', { userId, bookId });
        }
        catch (error) {
            logger_1.default.error('Error deleting user book:', { error: error.message, userId, bookId });
            throw error;
        }
    }
}
exports.UserBooksService = UserBooksService;
