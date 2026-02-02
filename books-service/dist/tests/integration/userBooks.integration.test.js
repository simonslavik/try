"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const userBooksRoutes_1 = __importDefault(require("../../src/routes/userBooksRoutes"));
const database_1 = __importDefault(require("../../src/config/database"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const googlebookapi_1 = require("../../utils/googlebookapi");
// Mock Google Books API
jest.mock('../../utils/googlebookapi');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/v1/user-books', userBooksRoutes_1.default);
describe('User Books Integration Tests', () => {
    let authToken;
    let testUserId;
    let testBookId;
    beforeAll(async () => {
        // Create test user token
        testUserId = 'integration-test-user-' + Date.now();
        authToken = jsonwebtoken_1.default.sign({
            userId: testUserId,
            email: 'test@example.com'
        }, process.env.JWT_SECRET || 'test-secret');
        // Clean up any existing test data
        await database_1.default.userBook.deleteMany({
            where: { userId: testUserId }
        });
    });
    beforeEach(() => {
        // Mock Google Books API for all tests
        googlebookapi_1.GoogleBooksService.getBookById.mockImplementation((googleBooksId) => ({
            title: 'Test Book',
            author: 'Test Author',
            description: 'Test Description',
            coverUrl: 'http://example.com/cover.jpg',
            pageCount: 200,
            isbn: '1234567890',
            googleBooksId: googleBooksId // Use the provided ID
        }));
    });
    afterAll(async () => {
        // Cleanup
        await database_1.default.userBook.deleteMany({
            where: { userId: testUserId }
        });
        if (testBookId) {
            await database_1.default.book.deleteMany({
                where: { id: testBookId }
            });
        }
        await database_1.default.$disconnect();
    });
    describe('GET /v1/user-books', () => {
        it('should return 401 without auth token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/v1/user-books')
                .expect(401);
            expect(response.body).toHaveProperty('message');
        });
        it('should return empty array for new user', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });
        it('should filter books by status', async () => {
            // First add a book
            const addResponse = await (0, supertest_1.default)(app)
                .post('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                googleBooksId: 'test-book-123',
                status: 'reading',
                rating: 4
            });
            expect(addResponse.status).toBe(200);
            // Then filter by status
            const response = await (0, supertest_1.default)(app)
                .get('/v1/user-books?status=reading')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].status).toBe('reading');
        });
    });
    describe('POST /v1/user-books', () => {
        it('should add a book to user library', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                googleBooksId: 'test-google-book-456',
                status: 'want_to_read',
                rating: 3,
                review: 'Looking forward to reading this'
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.status).toBe('want_to_read');
            expect(response.body.data.rating).toBe(3);
            testBookId = response.body.data.bookId;
        });
        it('should return 400 for missing required fields', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                status: 'reading'
                // Missing googleBooksId
            })
                .expect(400);
            expect(response.body).toHaveProperty('error');
        });
        it('should return 400 for invalid status', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                googleBooksId: 'test-123',
                status: 'invalid_status'
            })
                .expect(400);
            expect(response.body.error).toContain('Status must be one of');
        });
        it('should return 400 for invalid rating', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                googleBooksId: 'test-123',
                status: 'reading',
                rating: 6 // Invalid
            })
                .expect(400);
            expect(response.body.error).toContain('Rating cannot exceed 5');
        });
        it('should update existing book instead of creating duplicate', async () => {
            const googleBooksId = 'test-duplicate-' + Date.now();
            // Add book first time
            const firstResponse = await (0, supertest_1.default)(app)
                .post('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                googleBooksId,
                status: 'reading',
                rating: 3
            })
                .expect(200);
            const firstBookId = firstResponse.body.data.id;
            // Add same book again with different data
            const secondResponse = await (0, supertest_1.default)(app)
                .post('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                googleBooksId,
                status: 'completed',
                rating: 5
            })
                .expect(200);
            // Should update, not create new
            expect(secondResponse.body.data.id).toBe(firstBookId);
            expect(secondResponse.body.data.status).toBe('completed');
            expect(secondResponse.body.data.rating).toBe(5);
        });
    });
    describe('PUT /v1/user-books/:bookId', () => {
        let bookIdToUpdate;
        beforeEach(async () => {
            // Add a book to update
            const response = await (0, supertest_1.default)(app)
                .post('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                googleBooksId: 'test-update-' + Date.now(),
                status: 'reading'
            });
            bookIdToUpdate = response.body.data.bookId;
        });
        it('should update book status', async () => {
            const response = await (0, supertest_1.default)(app)
                .patch(`/v1/user-books/${bookIdToUpdate}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                status: 'completed',
                rating: 5,
                review: 'Finished it!'
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('completed');
            expect(response.body.data.rating).toBe(5);
        });
        it('should return 404 for non-existent book', async () => {
            const response = await (0, supertest_1.default)(app)
                .patch('/v1/user-books/non-existent-book-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                status: 'completed'
            })
                .expect(404);
            expect(response.body.error).toContain('not found');
        });
        it('should allow partial updates', async () => {
            const response = await (0, supertest_1.default)(app)
                .patch(`/v1/user-books/${bookIdToUpdate}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                rating: 4 // Only update rating
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.rating).toBe(4);
        });
    });
    describe('DELETE /v1/user-books/:userBookId', () => {
        let userBookIdToDelete;
        beforeEach(async () => {
            // Add a book to delete
            const response = await (0, supertest_1.default)(app)
                .post('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                googleBooksId: 'test-delete-' + Date.now(),
                status: 'reading'
            });
            userBookIdToDelete = response.body.data.id;
        });
        it('should delete book from library', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/v1/user-books/${userBookIdToDelete}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('removed');
            // Verify book is deleted
            const getResponse = await (0, supertest_1.default)(app)
                .get('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`);
            const deletedBook = getResponse.body.data.find((book) => book.id === userBookIdToDelete);
            expect(deletedBook).toBeUndefined();
        });
        it('should return 404 for non-existent book', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/v1/user-books/non-existent-book')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            expect(response.body.error).toContain('not found');
        });
    });
    describe('Authentication', () => {
        it('should reject requests without token', async () => {
            await (0, supertest_1.default)(app)
                .get('/v1/user-books')
                .expect(401);
        });
        it('should reject requests with invalid token', async () => {
            await (0, supertest_1.default)(app)
                .get('/v1/user-books')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
        it('should accept valid token', async () => {
            await (0, supertest_1.default)(app)
                .get('/v1/user-books')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });
});
