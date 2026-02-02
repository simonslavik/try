"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookClubBooksRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
class BookClubBooksRepository {
    /**
     * Find bookclub books with optional status filter
     */
    static async findByBookClubId(bookClubId, status) {
        const where = { bookClubId };
        if (status)
            where.status = status;
        return await database_1.default.bookClubBook.findMany({
            where,
            include: {
                book: true,
                readingProgress: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Find specific bookclub book
     */
    static async findOne(bookClubId, bookId) {
        return await database_1.default.bookClubBook.findUnique({
            where: {
                bookClubId_bookId: { bookClubId, bookId }
            },
            include: { book: true }
        });
    }
    /**
     * Create bookclub book
     */
    static async create(data) {
        return await database_1.default.bookClubBook.create({
            data,
            include: { book: true }
        });
    }
    /**
     * Update bookclub book
     */
    static async update(bookClubId, bookId, data) {
        return await database_1.default.bookClubBook.update({
            where: {
                bookClubId_bookId: { bookClubId, bookId }
            },
            data,
            include: { book: true }
        });
    }
    /**
     * Delete bookclub book
     */
    static async delete(bookClubId, bookId) {
        return await database_1.default.bookClubBook.delete({
            where: {
                bookClubId_bookId: { bookClubId, bookId }
            }
        });
    }
}
exports.BookClubBooksRepository = BookClubBooksRepository;
