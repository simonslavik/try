import prisma from '../config/database';

export class ReadingProgressRepository {
  /**
   * Find all progress records for a bookclub book
   */
  static async findByBookClubBook(bookClubBookId: string) {
    return await prisma.readingProgress.findMany({
      where: { bookClubBookId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Find user's progress for a bookclub book
   */
  static async findByUserAndBook(userId: string, bookClubBookId: string) {
    return await prisma.readingProgress.findMany({
      where: {
        userId,
        bookClubBookId,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Create progress record
   */
  static async create(data: any) {
    return await prisma.readingProgress.create({
      data,
    });
  }
}
