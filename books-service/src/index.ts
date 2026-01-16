import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './config/database';
import { GoogleBooksService } from '../utils/googlebookapi';
import { authMiddleware } from './middleware/authMiddleware';
import { 
  addBookSchema, 
  updateBookSchema,
  addBookForBookClubSchema,
  updateBookClubBookSchema,
  postsBookProgressSchema,
  bookClubIdParamSchema,
  bookIdParamSchema,
  bookClubBookIdParamSchema,
  bookClubBookReviewSchema
} from '../utils/validation';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());



// ============= BOOK SEARCH & DETAILS =============

// Search books via Google Books API
app.get('/v1/books/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const books = await GoogleBooksService.searchBooks(q as string, Number(limit));
    res.json({ success: true, data: books });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get book details from Google Books
app.get('/v1/books/google/:googleBooksId', async (req, res) => {
  try {
    const { googleBooksId } = req.params;
    const book = await GoogleBooksService.getBookById(googleBooksId);
    res.json({ success: true, data: book });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= USER BOOKS (Personal Library) =============

// Get user's books (favorites, reading, etc.)
app.get('/v1/user-books', authMiddleware, async (req: any, res) => {
  try {
    const { status } = req.query; // 'favorite', 'reading', 'want_to_read', 'completed'
    
    const where: any = { userId: req.user.userId };
    if (status) where.status = status;

    const userBooks = await prisma.userBook.findMany({
      where,
      include: { book: true },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: userBooks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add book to user's library
app.post('/v1/user-books', authMiddleware, async (req: any, res) => {
  try {
    // Validate request body
    const { error, value } = addBookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { googleBooksId, status, rating, review } = value;

    // Fetch book from Google Books API
    const bookData = await GoogleBooksService.getBookById(googleBooksId);

    // Create or find book in our database
    const book = await prisma.book.upsert({
      where: { googleBooksId },
      update: {},
      create: bookData
    });

    // Add to user's library
    const userBook = await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId: req.user.userId,
          bookId: book.id
        }
      },
      update: { status, rating, review },
      create: {
        userId: req.user.userId,
        bookId: book.id,
        status,
        rating,
        review
      },
      include: { book: true }
    });

    res.json({ success: true, data: userBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user book status/rating
app.patch('/v1/user-books/:bookId', authMiddleware, async (req: any, res) => {
  try {
    // Validate request body
    const { error, value } = updateBookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { bookId } = req.params;
    const { status, rating, review } = value;

    // Check if book exists in user's library
    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId: req.user.userId,
          bookId
        }
      }
    });

    if (!existingUserBook) {
      return res.status(404).json({ 
        error: 'Book not found in your library. Please add it first.' 
      });
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (rating !== undefined) updateData.rating = rating;
    if (review !== undefined) updateData.review = review;

    const userBook = await prisma.userBook.update({
      where: {
        userId_bookId: {
          userId: req.user.userId,
          bookId
        }
      },
      data: updateData,
      include: { book: true }
    });

    res.json({ success: true, data: userBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove book from user's library
app.delete('/v1/user-books/:userBookId', authMiddleware, async (req: any, res) => {
  try {
    const { userBookId } = req.params;

    // Check if book exists in user's library
    const existingUserBook = await prisma.userBook.findUnique({
      where: { id: userBookId }
    });

    if (!existingUserBook) {
      return res.status(404).json({ 
        error: 'Book not found in your library' 
      });
    }

    // Verify the book belongs to the requesting user
    if (existingUserBook.userId !== req.user.userId) {
      return res.status(403).json({ 
        error: 'You can only delete books from your own library' 
      });
    }

    await prisma.userBook.delete({
      where: { id: userBookId }
    });

    res.json({ success: true, message: 'Book removed from library' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= BOOKCLUB BOOKS =============

// Get books for a bookclub
app.get('/v1/bookclub/:bookClubId/books', async (req, res) => {
  try {
    const { bookClubId } = req.params;
    const { status } = req.query; // 'current', 'upcoming', 'completed'

    const where: any = { bookClubId };
    if (status) where.status = status;

    

    const books = await prisma.bookClubBook.findMany({
      where,
      include: { 
        book: true,
        readingProgress: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: books });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add book to bookclub
app.post('/v1/bookclub/:bookClubId/books', authMiddleware, async (req: any, res) => {
  try {
    // Validate params
    const paramValidation = bookClubIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      return res.status(400).json({ error: paramValidation.error.details[0].message });
    }

    // Validate body
    const bodyValidation = addBookForBookClubSchema.validate(req.body);
    if (bodyValidation.error) {
      return res.status(400).json({ error: bodyValidation.error.details[0].message });
    }

    const { bookClubId } = req.params;
    const { googleBooksId, status = 'upcoming', startDate, endDate } = req.body;

    // Fetch and create book
    const bookData = await GoogleBooksService.getBookById(googleBooksId);
    const book = await prisma.book.upsert({
      where: { googleBooksId },
      update: {},
      create: bookData
    });

    // Add to bookclub
    const bookClubBook = await prisma.bookClubBook.create({
      data: {
        bookClubId,
        bookId: book.id,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        addedById: req.user.userId
      },
      include: { book: true }
    });

    res.json({ success: true, data: bookClubBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update bookclub book status
app.patch('/v1/bookclub/:bookClubId/books/:bookId', authMiddleware, async (req: any, res) => {
  try {
    // Validate params
    const paramValidation = bookClubIdParamSchema.validate({ bookClubId: req.params.bookClubId });
    if (paramValidation.error) {
      return res.status(400).json({ error: paramValidation.error.details[0].message });
    }
    const bookIdValidation = bookIdParamSchema.validate({ bookId: req.params.bookId });
    if (bookIdValidation.error) {
      return res.status(400).json({ error: bookIdValidation.error.details[0].message });
    }

    // Validate body
    const bodyValidation = updateBookClubBookSchema.validate(req.body);
    if (bodyValidation.error) {
      return res.status(400).json({ error: bodyValidation.error.details[0].message });
    }

    const { bookClubId, bookId } = req.params;
    const { status, startDate, endDate } = req.body;

    // Check if book exists in bookclub
    const existingBookClubBook = await prisma.bookClubBook.findUnique({
      where: {
        bookClubId_bookId: { bookClubId, bookId }
      }
    });

    if (!existingBookClubBook) {
      return res.status(404).json({ 
        error: 'Book not found in this bookclub. Please add it first.' 
      });
    }

    const bookClubBook = await prisma.bookClubBook.update({
      where: {
        bookClubId_bookId: { bookClubId, bookId }
      },
      data: { 
        status, 
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      },
      include: { book: true }
    });

    res.json({ success: true, data: bookClubBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



app.delete('/v1/bookclub/:bookClubId/books/:bookId', authMiddleware, async (req: any, res) => {
  try {
    // Validate params
    const paramValidation = bookClubIdParamSchema.validate({ bookClubId: req.params.bookClubId });
    if (paramValidation.error) {
      return res.status(400).json({ error: paramValidation.error.details[0].message });
    }
    const bookIdValidation = bookIdParamSchema.validate({ bookId: req.params.bookId });
    if (bookIdValidation.error) {
      return res.status(400).json({ error: bookIdValidation.error.details[0].message });
    }

    const { bookClubId, bookId } = req.params;

    // Check if book exists in bookclub
    const existingBookClubBook = await prisma.bookClubBook.findUnique({
      where: {
        bookClubId_bookId: { bookClubId, bookId }
      }
    });

    if (!existingBookClubBook) {
      return res.status(404).json({ 
        error: 'Book not found in this bookclub' 
      });
    }

    await prisma.bookClubBook.delete({
      where: {
        bookClubId_bookId: { bookClubId, bookId }
      }
    });

    res.json({ success: true, message: 'Book removed from bookclub' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= READING PROGRESS =============

// Get user's reading progress for a bookclub book
app.get('/v1/bookclub-books/:bookClubBookId/progress', authMiddleware, async (req: any, res) => {
  try {
    // Validate params
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      return res.status(400).json({ error: paramValidation.error.details[0].message });
    }

    const { bookClubBookId } = req.params;

    // Check if book exists in bookclub
    const existingBookClubBook = await prisma.bookClubBook.findUnique({
      where: {
        id: bookClubBookId
      }
    });

    if (!existingBookClubBook) {
      return res.status(404).json({ 
        error: 'Book not found in bookclub' 
      });
    }

    const progress = await prisma.readingProgress.findUnique({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId: req.user.userId
        }
      },
      include: {
        bookClubBook: {
          include: { book: true }
        }
      }
    });

    res.json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update reading progress
app.post('/v1/bookclub-books/:bookClubBookId/progress', authMiddleware, async (req: any, res) => {
  try {
    // Validate params
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      return res.status(400).json({ error: paramValidation.error.details[0].message });
    }

    // Validate body
    const bodyValidation = postsBookProgressSchema.validate(req.body);
    if (bodyValidation.error) {
      return res.status(400).json({ error: bodyValidation.error.details[0].message });
    }

    const { bookClubBookId } = req.params;
    const { pagesRead, notes } = req.body;

    // Get book to calculate percentage
    const bookClubBook = await prisma.bookClubBook.findUnique({
      where: { id: bookClubBookId },
      include: { book: true }
    });

    if (!bookClubBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const totalPages = bookClubBook.book.pageCount || 100;
    const percentage = Math.min(Math.round((pagesRead / totalPages) * 100), 100);

    const progress = await prisma.readingProgress.upsert({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId: req.user.userId
        }
      },
      update: {
        pagesRead,
        percentage,
        notes,
        lastReadDate: new Date()
      },
      create: {
        bookClubBookId,
        userId: req.user.userId,
        pagesRead,
        percentage,
        notes
      }
    });

    res.json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Add or update review for a bookclub book
app.post('/v1/bookclub-books/:bookClubBookId/review', authMiddleware, async (req: any, res) => {
  try {
    // Validate params
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      return res.status(400).json({ error: paramValidation.error.details[0].message });
    }

    // Validate body
    const bodyValidation = bookClubBookReviewSchema.validate(req.body);
    if (bodyValidation.error) {
      return res.status(400).json({ error: bodyValidation.error.details[0].message });
    }

    const { bookClubBookId } = req.params;
    const { rating, reviewText } = req.body;

    // Check if book exists in bookclub
    const bookClubBook = await prisma.bookClubBook.findUnique({
      where: { id: bookClubBookId }
    });

    if (!bookClubBook) {
      return res.status(404).json({ error: 'Book not found in bookclub' });
    }

    const review = await prisma.bookClubBookReview.upsert({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId: req.user.userId
        }
      },
      update: {
        rating,
        reviewText: reviewText || null
      },
      create: {
        bookClubBookId,
        userId: req.user.userId,
        rating,
        reviewText: reviewText || null
      }
    });

    res.json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get all reviews for a bookclub book
app.get('/v1/bookclub-books/:bookClubBookId/reviews', async (req: any, res) => {
  try {
    // Validate params
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      return res.status(400).json({ error: paramValidation.error.details[0].message });
    }

    const { bookClubBookId } = req.params;

    const reviews = await prisma.bookClubBookReview.findMany({
      where: { bookClubBookId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ 
      success: true, 
      data: {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete user's review
app.delete('/v1/bookclub-books/:bookClubBookId/review', authMiddleware, async (req: any, res) => {
  try {
    // Validate params
    const paramValidation = bookClubBookIdParamSchema.validate(req.params);
    if (paramValidation.error) {
      return res.status(400).json({ error: paramValidation.error.details[0].message });
    }

    const { bookClubBookId } = req.params;

    await prisma.bookClubBookReview.delete({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId: req.user.userId
        }
      }
    });

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`📚 Books service running on http://localhost:${PORT}`);
});