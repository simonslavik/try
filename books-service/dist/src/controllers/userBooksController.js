"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserBook = exports.removeUserBook = exports.updateUserBook = exports.addUserBook = exports.getUserBooks = void 0;
const database_1 = __importDefault(require("../config/database"));
const googlebookapi_1 = require("../../utils/googlebookapi");
const validation_1 = require("../../utils/validation");
/**
 * Get user's books (favorites, reading, etc.)
 */
const getUserBooks = async (req, res) => {
    try {
        const { status } = req.query;
        const where = { userId: req.user.userId };
        if (status)
            where.status = status;
        const userBooks = await database_1.default.userBook.findMany({
            where,
            include: { book: true },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ success: true, data: userBooks });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getUserBooks = getUserBooks;
/**
 * Add book to user's library
 */
const addUserBook = async (req, res) => {
    try {
        const { error, value } = validation_1.addBookSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        const { googleBooksId, status, rating, review } = value;
        // Fetch book from Google Books API
        const bookData = await googlebookapi_1.GoogleBooksService.getBookById(googleBooksId);
        // Create or find book in our database
        const book = await database_1.default.book.upsert({
            where: { googleBooksId },
            update: {},
            create: bookData
        });
        // Add to user's library
        const userBook = await database_1.default.userBook.upsert({
            where: {
                userId_bookId: {
                    userId: req.user.userId,
                    bookId: book.id
                }
            },
            update: { status, rating, review },
            create: {
                userId: req.user.userId,
                bookId: book.id,
                status,
                rating,
                review
            },
            include: { book: true }
        });
        res.json({ success: true, data: userBook });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addUserBook = addUserBook;
/**
 * Update user book status/rating
 */
const updateUserBook = async (req, res) => {
    try {
        const { error, value } = validation_1.updateBookSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        const { bookId } = req.params;
        const { status, rating, review } = value;
        // Check if book exists in user's library
        const existingUserBook = await database_1.default.userBook.findUnique({
            where: {
                userId_bookId: {
                    userId: req.user.userId,
                    bookId: bookId
                }
            }
        });
        if (!existingUserBook) {
            res.status(404).json({
                error: 'Book not found in your library. Please add it first.'
            });
            return;
        }
        // Build update data object with only provided fields
        const updateData = {};
        if (status !== undefined)
            updateData.status = status;
        if (rating !== undefined)
            updateData.rating = rating;
        if (review !== undefined)
            updateData.review = review;
        const userBook = await database_1.default.userBook.update({
            where: {
                userId_bookId: {
                    userId: req.user.userId,
                    bookId: bookId
                }
            },
            data: updateData,
            include: { book: true }
        });
        res.json({ success: true, data: userBook });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateUserBook = updateUserBook;
/**
 * Remove book from user's library
 */
const removeUserBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        // Check if book exists in user's library
        const existingUserBook = await database_1.default.userBook.findUnique({
            where: {
                userId_bookId: {
                    userId: req.user.userId,
                    bookId: bookId
                }
            }
        });
        if (!existingUserBook) {
            res.status(404).json({
                error: 'Book not found in your library'
            });
            return;
        }
        await database_1.default.userBook.delete({
            where: {
                userId_bookId: {
                    userId: req.user.userId,
                    bookId: bookId
                }
            }
        });
        res.json({ success: true, message: 'Book removed from library' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.removeUserBook = removeUserBook;
/**
 * Remove book from user's library (by userBookId)
 */
const deleteUserBook = async (req, res) => {
    try {
        const { userBookId } = req.params;
        // Check if book exists in user's library
        const existingUserBook = await database_1.default.userBook.findUnique({
            where: { id: userBookId }
        });
        if (!existingUserBook) {
            res.status(404).json({
                error: 'Book not found in your library'
            });
            return;
        }
        // Verify the book belongs to the requesting user
        if (existingUserBook.userId !== req.user.userId) {
            res.status(403).json({
                error: 'You can only delete books from your own library'
            });
            return;
        }
        await database_1.default.userBook.delete({
            where: { id: userBookId }
        });
        res.json({ success: true, message: 'Book removed from library' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteUserBook = deleteUserBook;
