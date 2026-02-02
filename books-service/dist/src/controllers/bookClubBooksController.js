"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookClubBook = exports.updateBookClubBook = exports.addBookClubBook = exports.getBookClubBooks = void 0;
const bookClubBooks_service_1 = require("../services/bookClubBooks.service");
const validation_1 = require("../utils/validation");
/**
 * Get books for a bookclub
 */
const getBookClubBooks = async (req, res) => {
    try {
        const { bookClubId } = req.params;
        const { status } = req.query;
        const books = await bookClubBooks_service_1.BookClubBooksService.getBookClubBooks(bookClubId, status);
        res.json({ success: true, data: books });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getBookClubBooks = getBookClubBooks;
/**
 * Add book to bookclub
 */
const addBookClubBook = async (req, res) => {
    try {
        const paramValidation = validation_1.bookClubIdParamSchema.validate(req.params);
        if (paramValidation.error) {
            res.status(400).json({ error: paramValidation.error.details[0].message });
            return;
        }
        const bodyValidation = validation_1.addBookForBookClubSchema.validate(req.body);
        if (bodyValidation.error) {
            res.status(400).json({ error: bodyValidation.error.details[0].message });
            return;
        }
        const { bookClubId } = req.params;
        const { googleBooksId, status = 'upcoming', startDate, endDate } = req.body;
        const bookClubBook = await bookClubBooks_service_1.BookClubBooksService.addBookClubBook(bookClubId, req.user.userId, googleBooksId, status, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.json({ success: true, data: bookClubBook });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addBookClubBook = addBookClubBook;
/**
 * Update bookclub book status
 */
const updateBookClubBook = async (req, res) => {
    try {
        const paramValidation = validation_1.bookClubIdParamSchema.validate({ bookClubId: req.params.bookClubId });
        if (paramValidation.error) {
            res.status(400).json({ error: paramValidation.error.details[0].message });
            return;
        }
        const bookIdValidation = validation_1.bookIdParamSchema.validate({ bookId: req.params.bookId });
        if (bookIdValidation.error) {
            res.status(400).json({ error: bookIdValidation.error.details[0].message });
            return;
        }
        const bodyValidation = validation_1.updateBookClubBookSchema.validate(req.body);
        if (bodyValidation.error) {
            res.status(400).json({ error: bodyValidation.error.details[0].message });
            return;
        }
        const { bookClubId, bookId } = req.params;
        const { status, startDate, endDate } = req.body;
        const bookClubBook = await bookClubBooks_service_1.BookClubBooksService.updateBookClubBook(bookClubId, bookId, {
            status,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        res.json({ success: true, data: bookClubBook });
    }
    catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
};
exports.updateBookClubBook = updateBookClubBook;
/**
 * Delete book from bookclub
 */
const deleteBookClubBook = async (req, res) => {
    try {
        const paramValidation = validation_1.bookClubIdParamSchema.validate({ bookClubId: req.params.bookClubId });
        if (paramValidation.error) {
            res.status(400).json({ error: paramValidation.error.details[0].message });
            return;
        }
        const bookIdValidation = validation_1.bookIdParamSchema.validate({ bookId: req.params.bookId });
        if (bookIdValidation.error) {
            res.status(400).json({ error: bookIdValidation.error.details[0].message });
            return;
        }
        const { bookClubId, bookId } = req.params;
        await bookClubBooks_service_1.BookClubBooksService.deleteBookClubBook(bookClubId, bookId);
        res.json({ success: true, message: 'Book removed from bookclub' });
    }
    catch (error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
};
exports.deleteBookClubBook = deleteBookClubBook;
