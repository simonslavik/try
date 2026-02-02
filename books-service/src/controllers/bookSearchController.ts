import { Request, Response } from 'express';
import { BookSearchService } from '../services/bookSearch.service';

/**
 * Search books via Google Books API
 */
export const searchBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      res.status(400).json({ error: 'Query parameter required' });
      return;
    }

    const books = await BookSearchService.searchBooks(q as string, Number(limit));
    res.json({ success: true, data: books });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get book details from Google Books
 */
export const getBookDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { googleBooksId } = req.params;
    const book = await BookSearchService.getBookDetails(googleBooksId as string);
    res.json({ success: true, data: book });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
