import { z } from 'zod';

/**
 * Validation schemas for BookClub endpoints
 */

export const createBookClubSchema = z.object({
  name: z.string().min(1, 'Book club name is required').max(100, 'Name too long'),
  imageUrl: z.string().url().optional(),
  category: z.string().min(1).max(50).optional(),
  isPublic: z.boolean().optional(),
});

export const updateBookClubSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().min(1).max(50).optional(),
  isPublic: z.boolean().optional(),
});

export const bookClubIdSchema = z.object({
  id: z.string().uuid('Invalid book club ID'),
});

/**
 * Validation schemas for Room endpoints
 */

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Name too long'),
  bookClubId: z.string().uuid('Invalid book club ID'),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).max(100),
});

export const roomIdSchema = z.object({
  id: z.string().uuid('Invalid room ID'),
});

/**
 * Validation schemas for Invite endpoints
 */

export const createInviteSchema = z.object({
  bookClubId: z.string().uuid('Invalid book club ID'),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().positive().optional(),
});

export const inviteCodeSchema = z.object({
  code: z.string().length(8, 'Invalid invite code format'),
});

/**
 * Validation schemas for Event endpoints
 */

export const createEventSchema = z.object({
  bookClubId: z.string().uuid('Invalid book club ID'),
  title: z.string().min(1, 'Event title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time').optional(),
  location: z.string().max(200, 'Location too long').optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
});

export const eventIdSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});

/**
 * Validation schemas for File Upload
 */

export const fileUploadSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
});
