"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadingProgressService = void 0;
const readingProgress_repository_1 = require("../repositories/readingProgress.repository");
const bookClubReviews_repository_1 = require("../repositories/bookClubReviews.repository");
const logger_1 = __importDefault(require("../utils/logger"));
class ReadingProgressService {
    /**
     * Get reading progress for a bookclub book
     */
    static async getReadingProgress(bookClubBookId) {
        try {
            return await readingProgress_repository_1.ReadingProgressRepository.findByBookClubBook(bookClubBookId);
        }
        catch (error) {
            logger_1.default.error('Error fetching reading progress:', { error: error.message, bookClubBookId });
            throw error;
        }
    }
    /**
     * Post reading progress
     */
    static async postReadingProgress(userId, bookClubBookId, pagesRead, notes) {
        try {
            const progress = await readingProgress_repository_1.ReadingProgressRepository.create({
                userId,
                bookClubBookId,
                pagesRead,
                notes: notes || null
            });
            logger_1.default.info('Reading progress posted:', { userId, bookClubBookId, pagesRead });
            return progress;
        }
        catch (error) {
            logger_1.default.error('Error posting reading progress:', { error: error.message, userId, bookClubBookId });
            throw error;
        }
    }
    /**
     * Get reviews for a bookclub book
     */
    static async getReviews(bookClubBookId) {
        try {
            return await bookClubReviews_repository_1.BookClubReviewsRepository.findByBookClubBook(bookClubBookId);
        }
        catch (error) {
            logger_1.default.error('Error fetching reviews:', { error: error.message, bookClubBookId });
            throw error;
        }
    }
    /**
     * Add or update review
     */
    static async addOrUpdateReview(userId, bookClubBookId, rating, reviewText) {
        try {
            const review = await bookClubReviews_repository_1.BookClubReviewsRepository.upsert(userId, bookClubBookId, {
                rating,
                reviewText: reviewText || null
            });
            logger_1.default.info('Review posted:', { userId, bookClubBookId, rating });
            return review;
        }
        catch (error) {
            logger_1.default.error('Error posting review:', { error: error.message, userId, bookClubBookId });
            throw error;
        }
    }
}
exports.ReadingProgressService = ReadingProgressService;
