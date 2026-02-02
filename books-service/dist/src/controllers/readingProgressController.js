"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.getReviews = exports.addOrUpdateReview = exports.updateReadingProgress = exports.getReadingProgress = void 0;
const database_1 = __importDefault(require("../config/database"));
const validation_1 = require("../../utils/validation");
/**
 * Get user's reading progress for a bookclub book
 */
const getReadingProgress = async (req, res) => {
    try {
        const paramValidation = validation_1.bookClubBookIdParamSchema.validate(req.params);
        if (paramValidation.error) {
            res.status(400).json({ error: paramValidation.error.details[0].message });
            return;
        }
        const { bookClubBookId } = req.params;
        const existingBookClubBook = await database_1.default.bookClubBook.findUnique({
            where: { id: bookClubBookId }
        });
        if (!existingBookClubBook) {
            res.status(404).json({
                error: 'Book not found in bookclub'
            });
            return;
        }
        const progress = await database_1.default.readingProgress.findUnique({
            where: {
                bookClubBookId_userId: {
                    bookClubBookId: bookClubBookId,
                    userId: req.user.userId
                }
            },
            include: {
                bookClubBook: {
                    include: { book: true }
                }
            }
        });
        res.json({ success: true, data: progress });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getReadingProgress = getReadingProgress;
/**
 * Update reading progress
 */
const updateReadingProgress = async (req, res) => {
    try {
        const paramValidation = validation_1.bookClubBookIdParamSchema.validate(req.params);
        if (paramValidation.error) {
            res.status(400).json({ error: paramValidation.error.details[0].message });
            return;
        }
        const bodyValidation = validation_1.postsBookProgressSchema.validate(req.body);
        if (bodyValidation.error) {
            res.status(400).json({ error: bodyValidation.error.details[0].message });
            return;
        }
        const { bookClubBookId } = req.params;
        const { pagesRead, notes } = req.body;
        const bookClubBook = await database_1.default.bookClubBook.findUnique({
            where: { id: bookClubBookId },
            include: { book: true }
        });
        if (!bookClubBook) {
            res.status(404).json({ error: 'Book not found' });
            return;
        }
        const totalPages = bookClubBook.book.pageCount || 100;
        const percentage = Math.min(Math.round((pagesRead / totalPages) * 100), 100);
        const progress = await database_1.default.readingProgress.upsert({
            where: {
                bookClubBookId_userId: {
                    bookClubBookId: bookClubBookId,
                    userId: req.user.userId
                }
            },
            update: {
                pagesRead,
                percentage,
                notes,
                lastReadDate: new Date()
            },
            create: {
                bookClubBookId: bookClubBookId,
                userId: req.user.userId,
                pagesRead,
                percentage,
                notes
            }
        });
        res.json({ success: true, data: progress });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateReadingProgress = updateReadingProgress;
/**
 * Add or update review for a bookclub book
 */
const addOrUpdateReview = async (req, res) => {
    try {
        const paramValidation = validation_1.bookClubBookIdParamSchema.validate(req.params);
        if (paramValidation.error) {
            res.status(400).json({ error: paramValidation.error.details[0].message });
            return;
        }
        const bodyValidation = validation_1.bookClubBookReviewSchema.validate(req.body);
        if (bodyValidation.error) {
            res.status(400).json({ error: bodyValidation.error.details[0].message });
            return;
        }
        const { bookClubBookId } = req.params;
        const { rating, reviewText } = req.body;
        const bookClubBook = await database_1.default.bookClubBook.findUnique({
            where: { id: bookClubBookId }
        });
        if (!bookClubBook) {
            res.status(404).json({ error: 'Book not found in bookclub' });
            return;
        }
        const review = await database_1.default.bookClubBookReview.upsert({
            where: {
                bookClubBookId_userId: {
                    bookClubBookId: bookClubBookId,
                    userId: req.user.userId
                }
            },
            update: {
                rating,
                reviewText: reviewText || null
            },
            create: {
                bookClubBookId: bookClubBookId,
                userId: req.user.userId,
                rating,
                reviewText: reviewText || null
            }
        });
        res.json({ success: true, data: review });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addOrUpdateReview = addOrUpdateReview;
/**
 * Get all reviews for a bookclub book
 */
const getReviews = async (req, res) => {
    try {
        const paramValidation = validation_1.bookClubBookIdParamSchema.validate(req.params);
        if (paramValidation.error) {
            res.status(400).json({ error: paramValidation.error.details[0].message });
            return;
        }
        const { bookClubBookId } = req.params;
        const reviews = await database_1.default.bookClubBookReview.findMany({
            where: { bookClubBookId: bookClubBookId },
            orderBy: { createdAt: 'desc' }
        });
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        res.json({
            success: true,
            data: {
                reviews,
                averageRating: Math.round(averageRating * 10) / 10,
                totalReviews: reviews.length
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getReviews = getReviews;
/**
 * Delete user's review
 */
const deleteReview = async (req, res) => {
    try {
        const paramValidation = validation_1.bookClubBookIdParamSchema.validate(req.params);
        if (paramValidation.error) {
            res.status(400).json({ error: paramValidation.error.details[0].message });
            return;
        }
        const { bookClubBookId } = req.params;
        await database_1.default.bookClubBookReview.delete({
            where: {
                bookClubBookId_userId: {
                    bookClubBookId: bookClubBookId,
                    userId: req.user.userId
                }
            }
        });
        res.json({ success: true, message: 'Review deleted successfully' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Review not found' });
            return;
        }
        res.status(500).json({ error: error.message });
    }
};
exports.deleteReview = deleteReview;
