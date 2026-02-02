import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { RoomService } from '../services/room.service.js';

// Create a new room
export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId } = req.params;
    const { name } = req.body;
    const userId = req.user!.userId;
    
    const room = await RoomService.create(bookClubId, userId, { name });
    
    res.json({ room, message: 'Room created successfully' });
  } catch (error: any) {
    console.error('Error creating room:', error);
    let statusCode = 500;
    if (error.message === 'Room name is required') statusCode = 400;
    if (error.message === 'Book club not found') statusCode = 404;
    if (error.message === 'You must be a member to create rooms') statusCode = 403;
    res.status(statusCode).json({ error: error.message || 'Failed to create room' });
  }
};

// Get all rooms in a bookclub
export const getRooms = async (req: Request, res: Response) => {
  try {
    const { bookClubId } = req.params;
    
    const rooms = await RoomService.getRooms(bookClubId);
    
    res.json({ rooms });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

// Get messages in a specific room
export const getRoomMessages = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    
    const messages = await RoomService.getRoomMessages(roomId);
    
    res.json({ messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Delete a room
export const deleteRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { bookClubId, roomId } = req.params;
    const userId = req.user!.userId;
    
    await RoomService.delete(bookClubId, roomId, userId);
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting room:', error);
    let statusCode = 500;
    if (error.message === 'Book club not found' || error.message === 'Room not found') statusCode = 404;
    if (error.message === 'Only the book club creator can delete rooms') statusCode = 403;
    if (error.message === 'Cannot delete the last room' || error.message === 'Cannot delete the general room') statusCode = 400;
    res.status(statusCode).json({ error: error.message || 'Failed to delete room' });
  }
};
