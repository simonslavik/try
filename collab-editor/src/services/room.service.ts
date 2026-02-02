import { RoomRepository } from '../repositories/room.repository.js';
import { BookClubRepository } from '../repositories/bookClub.repository.js';

interface CreateRoomDto {
  name: string;
}

export class RoomService {
  /**
   * Create a new room in a book club
   */
  static async create(bookClubId: string, userId: string, data: CreateRoomDto) {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Room name is required');
    }

    // Check if user is a member of the bookclub
    const bookClub = await BookClubRepository.findById(bookClubId);
    
    if (!bookClub) {
      throw new Error('Book club not found');
    }
    
    if (!bookClub.members.includes(userId)) {
      throw new Error('You must be a member to create rooms');
    }

    const room = await RoomRepository.create({
      name: data.name.trim(),
      bookClubId
    });
    
    console.log(`📁 Room created in book club ${bookClubId}: ${room.name}`);
    
    return room;
  }

  /**
   * Get all rooms for a book club
   */
  static async getRooms(bookClubId: string) {
    return RoomRepository.findByBookClub(bookClubId);
  }

  /**
   * Get messages in a room
   */
  static async getRoomMessages(roomId: string, limit = 100) {
    return RoomRepository.getMessages(roomId, limit);
  }

  /**
   * Delete a room
   */
  static async delete(bookClubId: string, roomId: string, userId: string) {
    const bookClub = await BookClubRepository.findById(bookClubId);
    
    if (!bookClub) {
      throw new Error('Book club not found');
    }
    
    // Only creator can delete rooms
    if (bookClub.creatorId !== userId) {
      throw new Error('Only the book club creator can delete rooms');
    }

    const room = await RoomRepository.findById(roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Don't allow deletion of the last or 'general' room
    if (room.name === 'general') {
      throw new Error('Cannot delete the general room');
    }

    const rooms = await RoomRepository.findByBookClub(bookClubId);
    if (rooms.length <= 1) {
      throw new Error('Cannot delete the last room');
    }

    await RoomRepository.delete(roomId);
    
    console.log(`🗑️  Room deleted from book club ${bookClubId}: ${room.name}`);
  }
}
