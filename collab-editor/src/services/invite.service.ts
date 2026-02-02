import { InviteRepository } from '../repositories/invite.repository.js';
import { BookClubRepository } from '../repositories/bookClub.repository.js';
import { generateInviteCode } from '../utils/inviteCodeGenerator.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InviteService {
  /**
   * Get or create invite for a book club
   */
  static async getInvite(bookClubId: string, userId: string) {
    // Check if bookclub exists and user is creator or member
    const bookClub = await BookClubRepository.findById(bookClubId);

    if (!bookClub) {
      throw new Error('Book club not found');
    }

    if (bookClub.creatorId !== userId && !bookClub.members.includes(userId)) {
      throw new Error('Only book club members can view invite');
    }

    // Get existing invite or create one
    let invite = await prisma.bookClubInvite.findFirst({
      where: { bookClubId }
    });

    if (!invite) {
      // Generate unique invite code
      let code = generateInviteCode();
      let existing = await InviteRepository.findByCode(code);
      
      while (existing) {
        code = generateInviteCode();
        existing = await InviteRepository.findByCode(code);
      }

      invite = await InviteRepository.create({
        bookClubId,
        code,
        createdBy: userId,
        expiresAt: null,
        maxUses: null
      });

      console.log(`📨 Invite created: ${code} for bookclub ${bookClub.name}`);
    }

    return invite;
  }

  /**
   * Join a book club via invite code
   */
  static async joinViaInvite(code: string, userId: string) {
    // Find invite
    const invite = await prisma.bookClubInvite.findUnique({
      where: { code },
      include: { bookClub: true }
    });

    if (!invite) {
      throw new Error('Invalid invite code');
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new Error('This invite has expired');
    }

    // Check if max uses reached
    if (invite.maxUses && invite.currentUses >= invite.maxUses) {
      throw new Error('This invite has reached its maximum uses');
    }

    // Check if user is already a member
    const bookClub = await BookClubRepository.findById(invite.bookClubId);

    if (!bookClub) {
      throw new Error('Book club not found');
    }

    if (bookClub.members.includes(userId) || bookClub.creatorId === userId) {
      throw new Error('You are already a member of this book club');
    }

    // Add user to bookclub
    const updatedBookClub = await prisma.bookClub.update({
      where: { id: invite.bookClubId },
      data: {
        members: {
          push: userId
        }
      }
    });

    // Increment invite uses
    await InviteRepository.incrementUses(invite.id);

    console.log(`👥 User ${userId} joined book club ${bookClub.name} via invite ${code}`);

    return updatedBookClub;
  }

  /**
   * Create a new invite
   */
  static async create(bookClubId: string, userId: string, data: {
    expiresAt?: string | null;
    maxUses?: number | null;
  }) {
    const bookClub = await BookClubRepository.findById(bookClubId);

    if (!bookClub) {
      throw new Error('Book club not found');
    }

    if (bookClub.creatorId !== userId && !bookClub.members.includes(userId)) {
      throw new Error('Only book club members can create invites');
    }

    // Generate unique code
    let code = generateInviteCode();
    let existing = await InviteRepository.findByCode(code);
    
    while (existing) {
      code = generateInviteCode();
      existing = await InviteRepository.findByCode(code);
    }

    const invite = await InviteRepository.create({
      bookClubId,
      code,
      createdBy: userId,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      maxUses: data.maxUses || null
    });

    console.log(`📨 New invite created: ${code} for bookclub ${bookClub.name}`);

    return invite;
  }

  /**
   * Get all invites for a book club
   */
  static async getAllInvites(bookClubId: string, userId: string) {
    const bookClub = await BookClubRepository.findById(bookClubId);

    if (!bookClub) {
      throw new Error('Book club not found');
    }

    if (bookClub.creatorId !== userId) {
      throw new Error('Only the book club creator can view all invites');
    }

    return InviteRepository.findByBookClub(bookClubId);
  }

  /**
   * Delete an invite
   */
  static async delete(inviteId: string, userId: string) {
    const invite = await prisma.bookClubInvite.findUnique({
      where: { id: inviteId },
      include: { bookClub: true }
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.bookClub.creatorId !== userId && invite.createdBy !== userId) {
      throw new Error('Only the creator or invite owner can delete this invite');
    }

    await InviteRepository.delete(inviteId);

    console.log(`🗑️  Invite deleted: ${invite.code}`);
  }
}
