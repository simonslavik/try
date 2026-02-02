"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBooksRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
class UserBooksRepository {
    /**
     * Find user's books with optional status filter
     */
    static async findByUserId(userId, status) {
        const where = { userId };
        if (status)
            where.status = status;
        return await database_1.default.userBook.findMany({
            where,
            include: { book: true },
            orderBy: { updatedAt: 'desc' }
        });
    }
    /**
     * Find specific user book
     */
    static async findOne(userId, bookId) {
        return await database_1.default.userBook.findUnique({
            where: {
                userId_bookId: {
                    userId,
                    bookId
                }
            },
            include: { book: true }
        });
    }
    /**
     * Create or update user book
     */
    static async upsert(userId, bookId, data) {
        return await database_1.default.userBook.upsert({
            where: {
                userId_bookId: { userId, bookId }
            },
            update: data,
            create: {
                userId,
                bookId,
                ...data
            },
            include: { book: true }
        });
    }
    /**
     * Update user book
     */
    static async update(userId, bookId, data) {
        return await database_1.default.userBook.update({
            where: {
                userId_bookId: { userId, bookId }
            },
            data,
            include: { book: true }
        });
    }
    /**
     * Delete user book
     */
    static async delete(userId, bookId) {
        return await database_1.default.userBook.delete({
            where: {
                userId_bookId: { userId, bookId }
            }
        });
    }
}
exports.UserBooksRepository = UserBooksRepository;
