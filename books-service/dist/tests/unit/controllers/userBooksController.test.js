"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userBooksController_1 = require("../../../src/controllers/userBooksController");
const database_1 = __importDefault(require("../../../src/config/database"));
const googlebookapi_1 = require("../../../utils/googlebookapi");
// Mock dependencies
jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    default: {
        userBook: {
            findMany: jest.fn(),
            upsert: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        book: {
            upsert: jest.fn()
        }
    }
}));
jest.mock('../../../utils/googlebookapi');
describe('UserBooksController', () => {
    let mockReq;
    let mockRes;
    let jsonMock;
    let statusMock;
    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockReq = {
            user: {
                userId: 'test-user-123',
                email: 'test@example.com',
                role: 'user',
                name: 'Test User'
            },
            query: {},
            params: {},
            body: {}
        };
        mockRes = {
            json: jsonMock,
            status: statusMock
        };
        jest.clearAllMocks();
    });
    describe('getUserBooks', () => {
        it('should return all user books when no status filter', async () => {
            const mockBooks = [
                {
                    id: '1',
                    userId: 'test-user-123',
                    bookId: 'book-1',
                    status: 'reading',
                    book: { id: 'book-1', title: 'Test Book' }
                }
            ];
            database_1.default.userBook.findMany.mockResolvedValue(mockBooks);
            await (0, userBooksController_1.getUserBooks)(mockReq, mockRes);
            expect(database_1.default.userBook.findMany).toHaveBeenCalledWith({
                where: { userId: 'test-user-123' },
                include: { book: true },
                orderBy: { updatedAt: 'desc' }
            });
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                data: mockBooks
            });
        });
        it('should filter books by status', async () => {
            mockReq.query = { status: 'reading' };
            const mockBooks = [
                {
                    id: '1',
                    userId: 'test-user-123',
                    bookId: 'book-1',
                    status: 'reading',
                    book: { id: 'book-1', title: 'Test Book' }
                }
            ];
            database_1.default.userBook.findMany.mockResolvedValue(mockBooks);
            await (0, userBooksController_1.getUserBooks)(mockReq, mockRes);
            expect(database_1.default.userBook.findMany).toHaveBeenCalledWith({
                where: { userId: 'test-user-123', status: 'reading' },
                include: { book: true },
                orderBy: { updatedAt: 'desc' }
            });
        });
        it('should handle errors', async () => {
            database_1.default.userBook.findMany.mockRejectedValue(new Error('Database error'));
            await (0, userBooksController_1.getUserBooks)(mockReq, mockRes);
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Database error'
            });
        });
    });
    describe('addUserBook', () => {
        it('should add a book to user library', async () => {
            mockReq.body = {
                googleBooksId: 'abc123',
                status: 'reading',
                rating: 4,
                review: 'Great book'
            };
            const mockGoogleBook = {
                googleBooksId: 'abc123',
                title: 'Test Book',
                author: 'Test Author',
                description: 'Test description',
                coverUrl: 'http://example.com/cover.jpg',
                pageCount: 300,
                publishedDate: '2020-01-01',
                isbn: '1234567890'
            };
            const mockBook = {
                id: 'book-1',
                ...mockGoogleBook
            };
            const mockUserBook = {
                id: 'user-book-1',
                userId: 'test-user-123',
                bookId: 'book-1',
                status: 'reading',
                rating: 4,
                review: 'Great book',
                book: mockBook
            };
            googlebookapi_1.GoogleBooksService.getBookById.mockResolvedValue(mockGoogleBook);
            database_1.default.book.upsert.mockResolvedValue(mockBook);
            database_1.default.userBook.upsert.mockResolvedValue(mockUserBook);
            await (0, userBooksController_1.addUserBook)(mockReq, mockRes);
            expect(googlebookapi_1.GoogleBooksService.getBookById).toHaveBeenCalledWith('abc123');
            expect(database_1.default.book.upsert).toHaveBeenCalled();
            expect(database_1.default.userBook.upsert).toHaveBeenCalled();
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                data: mockUserBook
            });
        });
        it('should return 400 for invalid data', async () => {
            mockReq.body = {
                googleBooksId: 'abc123',
                status: 'invalid_status'
            };
            await (0, userBooksController_1.addUserBook)(mockReq, mockRes);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        });
        it('should handle Google Books API errors', async () => {
            mockReq.body = {
                googleBooksId: 'abc123',
                status: 'reading'
            };
            googlebookapi_1.GoogleBooksService.getBookById.mockRejectedValue(new Error('Book not found'));
            await (0, userBooksController_1.addUserBook)(mockReq, mockRes);
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Book not found'
            });
        });
    });
    describe('updateUserBook', () => {
        it('should update user book status', async () => {
            mockReq.params = { bookId: 'book-1' };
            mockReq.body = {
                status: 'completed',
                rating: 5
            };
            const existingBook = {
                id: 'user-book-1',
                userId: 'test-user-123',
                bookId: 'book-1',
                status: 'reading'
            };
            const updatedBook = {
                ...existingBook,
                status: 'completed',
                rating: 5
            };
            database_1.default.userBook.findUnique.mockResolvedValue(existingBook);
            database_1.default.userBook.update.mockResolvedValue(updatedBook);
            await (0, userBooksController_1.updateUserBook)(mockReq, mockRes);
            expect(database_1.default.userBook.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_bookId: {
                        userId: 'test-user-123',
                        bookId: 'book-1'
                    }
                }
            });
            expect(database_1.default.userBook.update).toHaveBeenCalled();
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                data: updatedBook
            });
        });
        it('should return 404 if book not found in user library', async () => {
            mockReq.params = { bookId: 'book-1' };
            mockReq.body = { status: 'completed' };
            database_1.default.userBook.findUnique.mockResolvedValue(null);
            await (0, userBooksController_1.updateUserBook)(mockReq, mockRes);
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Book not found in your library. Please add it first.'
            });
        });
        it('should validate update data', async () => {
            mockReq.params = { bookId: 'book-1' };
            mockReq.body = { rating: 10 }; // Invalid rating
            await (0, userBooksController_1.updateUserBook)(mockReq, mockRes);
            expect(statusMock).toHaveBeenCalledWith(400);
        });
    });
    describe('removeUserBook', () => {
        it('should remove book from user library', async () => {
            mockReq.params = { bookId: 'book-1' };
            const existingBook = {
                id: 'user-book-1',
                userId: 'test-user-123',
                bookId: 'book-1'
            };
            database_1.default.userBook.findUnique.mockResolvedValue(existingBook);
            database_1.default.userBook.delete.mockResolvedValue(existingBook);
            await (0, userBooksController_1.removeUserBook)(mockReq, mockRes);
            expect(database_1.default.userBook.delete).toHaveBeenCalledWith({
                where: {
                    userId_bookId: {
                        userId: 'test-user-123',
                        bookId: 'book-1'
                    }
                }
            });
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: 'Book removed from library'
            });
        });
        it('should return 404 if book not in library', async () => {
            mockReq.params = { bookId: 'book-1' };
            database_1.default.userBook.findUnique.mockResolvedValue(null);
            await (0, userBooksController_1.removeUserBook)(mockReq, mockRes);
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Book not found in your library'
            });
        });
    });
});
