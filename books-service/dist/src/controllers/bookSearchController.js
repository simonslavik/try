"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookDetails = exports.searchBooks = void 0;
const googlebookapi_1 = require("../../utils/googlebookapi");
/**
 * Search books via Google Books API
 */
const searchBooks = async (req, res) => {
    try {
        const { q, limit = 20 } = req.query;
        if (!q) {
            res.status(400).json({ error: 'Query parameter required' });
            return;
        }
        const books = await googlebookapi_1.GoogleBooksService.searchBooks(q, Number(limit));
        res.json({ success: true, data: books });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.searchBooks = searchBooks;
/**
 * Get book details from Google Books
 */
const getBookDetails = async (req, res) => {
    try {
        const { googleBooksId } = req.params;
        const book = await googlebookapi_1.GoogleBooksService.getBookById(googleBooksId);
        res.json({ success: true, data: book });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getBookDetails = getBookDetails;
