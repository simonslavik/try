"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadingProgressRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
class ReadingProgressRepository {
    /**
     * Find all progress records for a bookclub book
     */
    static async findByBookClubBook(bookClubBookId) {
        return await database_1.default.readingProgress.findMany({
            where: { bookClubBookId },
            orderBy: { updatedAt: 'desc' }
        });
    }
    /**
     * Find user's progress for a bookclub book
     */
    static async findByUserAndBook(userId, bookClubBookId) {
        return await database_1.default.readingProgress.findMany({
            where: {
                userId,
                bookClubBookId
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    /**
     * Create progress record
     */
    static async create(data) {
        return await database_1.default.readingProgress.create({
            data
        });
    }
}
exports.ReadingProgressRepository = ReadingProgressRepository;
