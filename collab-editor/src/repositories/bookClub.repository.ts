import { PrismaClient, BookClub, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class BookClubRepository {
  /**
   * Create a new book club with invite and default room
   */
  static async create(data: {
    name: string;
    category: string;
    isPublic: boolean;
    creatorId: string;
    inviteCode: string;
  }) {
    return prisma.bookClub.create({
      data: {
        name: data.name,
        category: data.category,
        isPublic: data.isPublic,
        members: [data.creatorId],
        creatorId: data.creatorId,
        rooms: {
          create: {
            name: 'general'
          }
        },
        invites: {
          create: {
            code: data.inviteCode,
            createdBy: data.creatorId,
            expiresAt: null,
            maxUses: null
          }
        }
      },
      include: { rooms: true, invites: true }
    });
  }

  /**
   * Find book club by ID
   */
  static async findById(id: string, includeRooms = false) {
    return prisma.bookClub.findUnique({
      where: { id },
      include: includeRooms ? {
        rooms: {
          orderBy: { createdAt: 'asc' }
        }
      } : undefined
    });
  }

  /**
   * Update book club
   */
  static async update(id: string, data: { name?: string; isPublic?: boolean; imageUrl?: string | null }) {
    return prisma.bookClub.update({
      where: { id },
      data
    });
  }

  /**
   * Find all book clubs with filters
   */
  static async findMany(where: Prisma.BookClubWhereInput, take = 50) {
    return prisma.bookClub.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take
    });
  }

  /**
   * Find book clubs by creator
   */
  static async findByCreator(creatorId: string) {
    return prisma.bookClub.findMany({
      where: { creatorId },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Find public book clubs
   */
  static async findPublic(take = 50) {
    return this.findMany({ isPublic: true }, take);
  }

  /**
   * Find user's book clubs (where user is a member)
   */
  static async findByMember(userId: string, take = 50) {
    return this.findMany({ members: { has: userId } }, take);
  }

  /**
   * Delete book club
   */
  static async delete(id: string) {
    return prisma.bookClub.delete({
      where: { id }
    });
  }
}
