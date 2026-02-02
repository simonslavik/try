import prisma from '../config/database';

export class BookClubBooksRepository {
  /**
   * Find bookclub books with optional status filter
   */
  static async findByBookClubId(bookClubId: string, status?: string) {
    const where: any = { bookClubId };
    if (status) where.status = status;

    return await prisma.bookClubBook.findMany({
      where,
      include: {
        book: true,
        readingProgress: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find specific bookclub book
   */
  static async findOne(bookClubId: string, bookId: string) {
    return await prisma.bookClubBook.findUnique({
      where: {
        bookClubId_bookId: { bookClubId, bookId }
      },
      include: { book: true }
    });
  }

  /**
   * Create bookclub book
   */
  static async create(data: any) {
    return await prisma.bookClubBook.create({
      data,
      include: { book: true }
    });
  }

  /**
   * Update bookclub book
   */
  static async update(bookClubId: string, bookId: string, data: any) {
    return await prisma.bookClubBook.update({
      where: {
        bookClubId_bookId: { bookClubId, bookId }
      },
      data,
      include: { book: true }
    });
  }

  /**
   * Delete bookclub book
   */
  static async delete(bookClubId: string, bookId: string) {
    return await prisma.bookClubBook.delete({
      where: {
        bookClubId_bookId: { bookClubId, bookId }
      }
    });
  }
}
