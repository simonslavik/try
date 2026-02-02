"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserBook = exports.removeUserBook = exports.updateUserBook = exports.addUserBook = exports.getUserBooks = void 0;
const userBooks_service_1 = require("../services/userBooks.service");
const validation_1 = require("../utils/validation");
const userBooks_repository_1 = require("../repositories/userBooks.repository");
/**
 * Get user's books (favorites, reading, etc.)
 */
const getUserBooks = async (req, res) => {
    try {
        const { status } = req.query;
        const userBooks = await userBooks_service_1.UserBooksService.getUserBooks(req.user.userId, status);
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
        const userBook = await userBooks_service_1.UserBooksService.addUserBook(req.user.userId, googleBooksId, status, rating, review);
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
        const userBook = await userBooks_service_1.UserBooksService.updateUserBook(req.user.userId, bookId, {
            status,
            rating,
            review
        });
        res.json({ success: true, data: userBook });
    }
    catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
};
exports.updateUserBook = updateUserBook;
/**
 * Remove book from user's library
 */
const removeUserBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        await userBooks_service_1.UserBooksService.deleteUserBook(req.user.userId, bookId);
        res.json({ success: true, message: 'Book removed from library' });
    }
    catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
};
exports.removeUserBook = removeUserBook;
/**
 * Remove book from user's library (by userBookId)
 */
const deleteUserBook = async (req, res) => {
    try {
        const { userBookId } = req.params;
        // Check if book exists and belongs to user
        const existingUserBook = await userBooks_repository_1.UserBooksRepository.findOne(req.user.userId, userBookId);
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
        await userBooks_service_1.UserBooksService.deleteUserBook(req.user.userId, userBookId);
        res.json({ success: true, message: 'Book removed from library' });
    }
    catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
};
exports.deleteUserBook = deleteUserBook;
