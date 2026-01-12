import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './config/database';
import { GoogleBooksService } from '../utils/googlebookapi';
import { authMiddleware } from './middleware/authMiddleware';

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
    const { googleBooksId, status, rating, review } = req.body;

    if (!googleBooksId || !status) {
      return res.status(400).json({ error: 'googleBooksId and status required' });
    }

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
    const { bookId } = req.params;
    const { status, rating, review } = req.body;

    const userBook = await prisma.userBook.update({
      where: {
        userId_bookId: {
          userId: req.user.userId,
          bookId
        }
      },
      data: { status, rating, review },
      include: { book: true }
    });

    res.json({ success: true, data: userBook });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove book from user's library
app.delete('/v1/user-books/:bookId', authMiddleware, async (req: any, res) => {
  try {
    const { bookId } = req.params;

    await prisma.userBook.delete({
      where: {
        userId_bookId: {
          userId: req.user.userId,
          bookId
        }
      }
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
    const { bookClubId } = req.params;
    const { googleBooksId, status = 'upcoming', startDate, endDate } = req.body;

    if (!googleBooksId) {
      return res.status(400).json({ error: 'googleBooksId required' });
    }

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
    const { bookClubId, bookId } = req.params;
    const { status, startDate, endDate } = req.body;

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

// ============= READING PROGRESS =============

// Get user's reading progress for a bookclub book
app.get('/v1/bookclub-books/:bookClubBookId/progress', authMiddleware, async (req: any, res) => {
  try {
    const { bookClubBookId } = req.params;

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

app.listen(PORT, () => {
  console.log(`📚 Books service running on http://localhost:${PORT}`);
});