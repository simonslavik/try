"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookClubBook = exports.updateBookClubBook = exports.addBookClubBook = exports.getBookClubBooks = void 0;
const database_1 = __importDefault(require("../config/database"));
const googlebookapi_1 = require("../../utils/googlebookapi");
const validation_1 = require("../../utils/validation");
/**
 * Get books for a bookclub
 */
const getBookClubBooks = async (req, res) => {
    try {
        const { bookClubId } = req.params;
        const { status } = req.query;
        const where = { bookClubId };
        if (status)
            where.status = status;
        const books = await database_1.default.bookClubBook.findMany({
            where,
            include: {
                book: true,
                readingProgress: true
            },
            orderBy: { createdAt: 'desc' }
        });
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
        const bookData = await googlebookapi_1.GoogleBooksService.getBookById(googleBooksId);
        const book = await database_1.default.book.upsert({
            where: { googleBooksId },
            update: {},
            create: bookData
        });
        const bookClubBook = await database_1.default.bookClubBook.create({
            data: {
                bookClubId: bookClubId,
                bookId: book.id,
                status,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                addedById: req.user.userId
            },
            include: { book: true }
        });
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
        const existingBookClubBook = await database_1.default.bookClubBook.findUnique({
            where: { bookClubId_bookId: { bookClubId: bookClubId, bookId: bookId } }
        });
        if (!existingBookClubBook) {
            res.status(404).json({
                error: 'Book not found in this bookclub. Please add it first.'
            });
            return;
        }
        const bookClubBook = await database_1.default.bookClubBook.update({
            where: { bookClubId_bookId: { bookClubId: bookClubId, bookId: bookId } },
            data: {
                status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            },
            include: { book: true }
        });
        res.json({ success: true, data: bookClubBook });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
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
        const existingBookClubBook = await database_1.default.bookClubBook.findUnique({
            where: { bookClubId_bookId: { bookClubId: bookClubId, bookId: bookId } }
        });
        if (!existingBookClubBook) {
            res.status(404).json({
                error: 'Book not found in this bookclub'
            });
            return;
        }
        await database_1.default.bookClubBook.delete({
            where: { bookClubId_bookId: { bookClubId: bookClubId, bookId: bookId } }
        });
        res.json({ success: true, message: 'Book removed from bookclub' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteBookClubBook = deleteBookClubBook;
