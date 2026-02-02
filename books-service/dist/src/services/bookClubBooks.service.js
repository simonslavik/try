"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookClubBooksService = void 0;
const bookClubBooks_repository_1 = require("../repositories/bookClubBooks.repository");
const books_repository_1 = require("../repositories/books.repository");
const googleBooks_service_1 = require("./googleBooks.service");
const logger_1 = __importDefault(require("../utils/logger"));
class BookClubBooksService {
    /**
     * Get books for a bookclub
     */
    static async getBookClubBooks(bookClubId, status) {
        try {
            return await bookClubBooks_repository_1.BookClubBooksRepository.findByBookClubId(bookClubId, status);
        }
        catch (error) {
            logger_1.default.error('Error fetching bookclub books:', { error: error.message, bookClubId, status });
            throw error;
        }
    }
    /**
     * Add book to bookclub
     */
    static async addBookClubBook(bookClubId, userId, googleBooksId, status = 'upcoming', startDate, endDate) {
        try {
            // Fetch book data from Google Books API
            const bookData = await googleBooks_service_1.GoogleBooksService.getBookById(googleBooksId);
            // Create or find book in database
            const book = await books_repository_1.BooksRepository.upsert(googleBooksId, bookData);
            // Add to bookclub
            const bookClubBook = await bookClubBooks_repository_1.BookClubBooksRepository.create({
                bookClubId,
                bookId: book.id,
                status,
                startDate: startDate || null,
                endDate: endDate || null,
                addedById: userId
            });
            logger_1.default.info('Book added to bookclub:', { bookClubId, bookId: book.id, status });
            return bookClubBook;
        }
        catch (error) {
            logger_1.default.error('Error adding bookclub book:', { error: error.message, bookClubId, googleBooksId });
            throw error;
        }
    }
    /**
     * Update bookclub book
     */
    static async updateBookClubBook(bookClubId, bookId, data) {
        try {
            // Check if book exists in bookclub
            const existingBookClubBook = await bookClubBooks_repository_1.BookClubBooksRepository.findOne(bookClubId, bookId);
            if (!existingBookClubBook) {
                throw new Error('Book not found in this bookclub. Please add it first.');
            }
            const updatedData = {};
            if (data.status)
                updatedData.status = data.status;
            if (data.startDate)
                updatedData.startDate = data.startDate;
            if (data.endDate)
                updatedData.endDate = data.endDate;
            const updatedBook = await bookClubBooks_repository_1.BookClubBooksRepository.update(bookClubId, bookId, updatedData);
            logger_1.default.info('Bookclub book updated:', { bookClubId, bookId });
            return updatedBook;
        }
        catch (error) {
            logger_1.default.error('Error updating bookclub book:', { error: error.message, bookClubId, bookId });
            throw error;
        }
    }
    /**
     * Delete book from bookclub
     */
    static async deleteBookClubBook(bookClubId, bookId) {
        try {
            // Check if book exists in bookclub
            const existingBookClubBook = await bookClubBooks_repository_1.BookClubBooksRepository.findOne(bookClubId, bookId);
            if (!existingBookClubBook) {
                throw new Error('Book not found in this bookclub');
            }
            await bookClubBooks_repository_1.BookClubBooksRepository.delete(bookClubId, bookId);
            logger_1.default.info('Bookclub book deleted:', { bookClubId, bookId });
        }
        catch (error) {
            logger_1.default.error('Error deleting bookclub book:', { error: error.message, bookClubId, bookId });
            throw error;
        }
    }
}
exports.BookClubBooksService = BookClubBooksService;
