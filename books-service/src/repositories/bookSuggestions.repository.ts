import prisma from '../config/database';

export class BookSuggestionsRepository {
  /**
   * Find suggestions for a bookclub
   */
  static async findByBookClubId(bookClubId: string) {
    return await prisma.bookSuggestion.findMany({
      where: { bookClubId },
      include: {
        book: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Create book suggestion
   */
  static async create(data: any) {
    return await prisma.bookSuggestion.create({
      data,
      include: {
        book: true,
      },
    });
  }

  /**
   * Delete suggestion
   */
  static async delete(suggestionId: string) {
    return await prisma.bookSuggestion.delete({
      where: { id: suggestionId },
    });
  }
}
