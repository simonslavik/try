import prisma from '../config/database';

export class BookClubReviewsRepository {
  /**
   * Find review by user and bookclub book
   */
  static async findByUserAndBook(userId: string, bookClubBookId: string) {
    return await prisma.bookClubBookReview.findUnique({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId
        }
      }
    });
  }

  /**
   * Find all reviews for a bookclub book
   */
  static async findByBookClubBook(bookClubBookId: string) {
    return await prisma.bookClubBookReview.findMany({
      where: { bookClubBookId },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Create or update review
   */
  static async upsert(userId: string, bookClubBookId: string, data: any) {
    return await prisma.bookClubBookReview.upsert({
      where: {
        bookClubBookId_userId: {
          bookClubBookId,
          userId
        }
      },
      update: data,
      create: {
        userId,
        bookClubBookId,
        ...data
      }
    });
  }
}
