"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSuggestion = exports.acceptSuggestion = exports.voteSuggestion = exports.createSuggestion = exports.getSuggestions = void 0;
const database_1 = __importDefault(require("../config/database"));
const googlebookapi_1 = require("../../utils/googlebookapi");
/**
 * Get all suggestions for a bookclub
 */
const getSuggestions = async (req, res) => {
    try {
        const { bookClubId } = req.params;
        const suggestions = await database_1.default.bookSuggestion.findMany({
            where: {
                bookClubId: bookClubId,
                status: 'pending'
            },
            include: {
                book: true,
                votes: true
            },
            orderBy: [
                { upvotes: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        const suggestionsWithUserVote = suggestions.map((s) => {
            const userVote = s.votes.find((v) => v.userId === req.user.userId);
            return {
                ...s,
                userVote: userVote?.voteType || null,
                suggestedBy: {
                    id: s.suggestedById,
                    name: 'User'
                }
            };
        });
        res.json({ success: true, data: suggestionsWithUserVote });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getSuggestions = getSuggestions;
/**
 * Suggest a book
 */
const createSuggestion = async (req, res) => {
    try {
        const { bookClubId } = req.params;
        const { googleBooksId, reason } = req.body;
        if (!googleBooksId) {
            res.status(400).json({ error: 'googleBooksId is required' });
            return;
        }
        const bookData = await googlebookapi_1.GoogleBooksService.getBookById(googleBooksId);
        const book = await database_1.default.book.upsert({
            where: { googleBooksId },
            update: {},
            create: bookData
        });
        const existing = await database_1.default.bookSuggestion.findFirst({
            where: {
                bookClubId: bookClubId,
                bookId: book.id,
                status: 'pending'
            }
        });
        if (existing) {
            res.status(400).json({ error: 'This book has already been suggested' });
            return;
        }
        const suggestion = await database_1.default.bookSuggestion.create({
            data: {
                bookClubId: bookClubId,
                bookId: book.id,
                suggestedById: req.user.userId,
                reason,
                status: 'pending',
                upvotes: 0,
                downvotes: 0
            },
            include: {
                book: true
            }
        });
        res.json({
            success: true,
            data: {
                ...suggestion,
                suggestedBy: {
                    id: req.user.userId,
                    name: req.user.name || 'User'
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createSuggestion = createSuggestion;
/**
 * Vote on a suggestion
 */
const voteSuggestion = async (req, res) => {
    try {
        const { suggestionId } = req.params;
        const { voteType } = req.body;
        if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
            res.status(400).json({ error: 'voteType must be either "upvote" or "downvote"' });
            return;
        }
        const vote = await database_1.default.bookSuggestionVote.upsert({
            where: {
                suggestionId_userId: {
                    suggestionId: suggestionId,
                    userId: req.user.userId
                }
            },
            update: { voteType },
            create: {
                suggestionId: suggestionId,
                userId: req.user.userId,
                voteType
            }
        });
        const voteCounts = await database_1.default.bookSuggestionVote.groupBy({
            by: ['voteType'],
            where: { suggestionId: suggestionId },
            _count: true
        });
        const upvotes = voteCounts.find((v) => v.voteType === 'upvote')?._count || 0;
        const downvotes = voteCounts.find((v) => v.voteType === 'downvote')?._count || 0;
        await database_1.default.bookSuggestion.update({
            where: { id: suggestionId },
            data: { upvotes, downvotes }
        });
        res.json({ success: true, data: vote });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.voteSuggestion = voteSuggestion;
/**
 * Accept suggestion and make it current book
 */
const acceptSuggestion = async (req, res) => {
    try {
        const { bookClubId, suggestionId } = req.params;
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            res.status(400).json({ error: 'startDate and endDate are required' });
            return;
        }
        const suggestion = await database_1.default.bookSuggestion.findUnique({
            where: { id: suggestionId },
            include: { book: true }
        });
        if (!suggestion) {
            res.status(404).json({ error: 'Suggestion not found' });
            return;
        }
        await database_1.default.bookClubBook.updateMany({
            where: { bookClubId: bookClubId, status: 'current' },
            data: { status: 'completed' }
        });
        const bookClubBook = await database_1.default.bookClubBook.create({
            data: {
                bookClubId: bookClubId,
                bookId: suggestion.bookId,
                status: 'current',
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                addedById: req.user.userId
            },
            include: { book: true }
        });
        await database_1.default.bookSuggestion.update({
            where: { id: suggestionId },
            data: { status: 'accepted' }
        });
        res.json({ success: true, data: bookClubBook });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.acceptSuggestion = acceptSuggestion;
/**
 * Delete a suggestion
 */
const deleteSuggestion = async (req, res) => {
    try {
        const { suggestionId } = req.params;
        const suggestion = await database_1.default.bookSuggestion.findUnique({
            where: { id: suggestionId }
        });
        if (!suggestion) {
            res.status(404).json({ error: 'Suggestion not found' });
            return;
        }
        if (suggestion.suggestedById !== req.user.userId) {
            res.status(403).json({ error: 'You can only delete your own suggestions' });
            return;
        }
        await database_1.default.bookSuggestion.delete({
            where: { id: suggestionId }
        });
        res.json({ success: true, message: 'Suggestion deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteSuggestion = deleteSuggestion;
