"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookSuggestionsRepository = void 0;
const database_1 = __importDefault(require("../config/database"));
class BookSuggestionsRepository {
    /**
     * Find suggestions for a bookclub
     */
    static async findByBookClubId(bookClubId) {
        return await database_1.default.bookSuggestion.findMany({
            where: { bookClubId },
            include: {
                book: true
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    /**
     * Create book suggestion
     */
    static async create(data) {
        return await database_1.default.bookSuggestion.create({
            data,
            include: {
                book: true
            }
        });
    }
    /**
     * Delete suggestion
     */
    static async delete(suggestionId) {
        return await database_1.default.bookSuggestion.delete({
            where: { id: suggestionId }
        });
    }
}
exports.BookSuggestionsRepository = BookSuggestionsRepository;
