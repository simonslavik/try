import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { BookClubService } from '../services/bookClub.service.js';

// Helper type for active bookclubs
interface ActiveClient {
  id: string;
  userId: string;
  username: string;
}

interface ActiveBookClub {
  clients: Map<string, any>;
}

export const setActiveBookClubs = (clubs: Map<string, ActiveBookClub>) => {
  BookClubService.setActiveBookClubs(clubs);
};

// Create new bookclub
export const createBookClub = async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, isPublic } = req.body;
    const userId = req.user!.userId;
    
    const bookClub = await BookClubService.create(userId, { name, category, isPublic });
    
    res.json({ bookClubId: bookClub.id, message: 'Book club created successfully', bookClub });
  } catch (error: any) {
    console.error('Error creating book club:', error);
    const statusCode = error.message === 'Book club name is required' ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to create book club' });
  }
};

// Get bookclub info
export const getBookClub = async (req: Request, res: Response) => {
  try {
    const bookClub = await BookClubService.getById(req.params.bookClubId);
    res.json(bookClub);
  } catch (error: any) {
    console.error('Error fetching book club:', error);
    const statusCode = error.message === 'Book club not found' ? 404 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to fetch book club' });
  }
};

// Update bookclub
export const updateBookClub = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const { name, isPublic } = req.body;
    const userId = req.user!.userId;
    
    const updatedBookClub = await BookClubService.update(bookClubId, userId, { name, isPublic });
    
    res.json({ message: 'Book club updated successfully', bookClub: updatedBookClub });
  } catch (error: any) {
    console.error('Error updating book club:', error);
    let statusCode = 500;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message.includes('Only the book club creator')) statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to update book club' });
  }
};

// Get all bookclubs
export const getAllBookClubs = async (req: Request, res: Response) => {
  try {
    const { mine } = req.query;
    const authReq = req as AuthRequest;
    
    const userId = authReq.user?.userId;
    const onlyMine = mine === 'true';
    
    const bookClubs = await BookClubService.getAll(userId, onlyMine);
    
    res.json({ bookClubs });
  } catch (error: any) {
    console.error('Error fetching book clubs:', error);
    res.status(500).json({ error: 'Failed to fetch book clubs' });
  }
};

// Get my bookclubs
export const getMyBookClubs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const bookClubs = await BookClubService.getMyBookClubs(userId);
    
    res.json({ bookClubs });
  } catch (error: any) {
    console.error('Error fetching user bookclubs:', error);
    res.status(500).json({ error: 'Failed to fetch user bookclubs' });
  }
};

// Upload bookclub image
export const uploadBookClubImage = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imageUrl = await BookClubService.uploadImage(bookClubId, userId, req.file);
    
    res.json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    let statusCode = 500;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message.includes('Only the book club creator')) statusCode = 403;
    if (error.message === 'No image file provided') statusCode = 400;
    res.status(statusCode).json({ error: error.message || 'Failed to upload image' });
  }
};

// Delete bookclub image
export const deleteBookClubImage = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const userId = req.user!.userId;
    
    await BookClubService.deleteImage(bookClubId, userId);
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    let statusCode = 500;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message.includes('Only the book club creator')) statusCode = 403;
    if (error.message === 'Book club has no image to delete') statusCode = 400;
    res.status(statusCode).json({ error: error.message || 'Failed to delete image' });
  }
};
