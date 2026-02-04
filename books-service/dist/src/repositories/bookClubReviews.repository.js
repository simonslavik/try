"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookClubReviewsRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
class BookClubReviewsRepository {
    /**
     * Find review by user and bookclub book
     */
    static async findByUserAndBook(userId, bookClubBookId) {
        return await database_1.default.bookClubBookReview.findUnique({
            where: {
                bookClubBookId_userId: {
                    bookClubBookId,
                    userId,
                },
            },
        });
    }
    /**
     * Find all reviews for a bookclub book
     */
    static async findByBookClubBook(bookClubBookId) {
        return await database_1.default.bookClubBookReview.findMany({
            where: { bookClubBookId },
            orderBy: { updatedAt: 'desc' },
        });
    }
    /**
     * Create or update review
     */
    static async upsert(userId, bookClubBookId, data) {
        return await database_1.default.bookClubBookReview.upsert({
            where: {
                bookClubBookId_userId: {
                    bookClubBookId,
                    userId,
                },
            },
            update: data,
            create: {
                userId,
                bookClubBookId,
                ...data,
            },
        });
    }
}
exports.BookClubReviewsRepository = BookClubReviewsRepository;
