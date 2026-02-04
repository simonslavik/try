"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooksRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
class BooksRepository {
    /**
     * Find book by Google Books ID
     */
    static async findByGoogleBooksId(googleBooksId) {
        return await database_1.default.book.findUnique({
            where: { googleBooksId },
        });
    }
    /**
     * Create or update book
     */
    static async upsert(googleBooksId, bookData) {
        return await database_1.default.book.upsert({
            where: { googleBooksId },
            update: {},
            create: bookData,
        });
    }
    /**
     * Find book by ID
     */
    static async findById(bookId) {
        return await database_1.default.book.findUnique({
            where: { id: bookId },
        });
    }
}
exports.BooksRepository = BooksRepository;
