"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleBooksService = void 0;
const axios_1 = __importDefault(require("axios"));
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY; // Optional, higher rate limits with key
class GoogleBooksService {
    static async searchBooks(query, maxResults = 20) {
        try {
            const params = {
                q: query,
                maxResults,
                printType: 'books'
            };
            if (API_KEY) {
                params.key = API_KEY;
            }
            const response = await axios_1.default.get(GOOGLE_BOOKS_API, { params });
            return response.data.items?.map((item) => ({
                googleBooksId: item.id,
                title: item.volumeInfo.title,
                author: item.volumeInfo.authors?.join(', ') || 'Unknown Author',
                coverUrl: item.volumeInfo.imageLinks?.thumbnail || null,
                description: item.volumeInfo.description || null,
                pageCount: item.volumeInfo.pageCount || null,
                isbn: item.volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier || null
            })) || [];
        }
        catch (error) {
            console.error('Google Books API error:', error);
            throw new Error('Failed to search books');
        }
    }
    static async getBookById(googleBooksId) {
        try {
            const params = {};
            if (API_KEY)
                params.key = API_KEY;
            const response = await axios_1.default.get(`${GOOGLE_BOOKS_API}/${googleBooksId}`, { params });
            const book = response.data;
            return {
                googleBooksId: book.id,
                title: book.volumeInfo.title,
                author: book.volumeInfo.authors?.join(', ') || 'Unknown Author',
                coverUrl: book.volumeInfo.imageLinks?.thumbnail || null,
                description: book.volumeInfo.description || null,
                pageCount: book.volumeInfo.pageCount || null,
                isbn: book.volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier || null
            };
        }
        catch (error) {
            console.error('Google Books API error:', error);
            throw new Error('Failed to fetch book details');
        }
    }
}
exports.GoogleBooksService = GoogleBooksService;
