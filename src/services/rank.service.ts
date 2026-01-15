import type { Prisma } from '@prisma/client';
import db from '../config/db.js';

type RankingStyle = Prisma.StyleGetPayload<{
  include: {
    styleImages: { take: 1; include: { image: true } };
    styleTags: { include: { tag: true } };
    categories: true;
    curations: true;
  };
}>;

export class RankService {
  async getRankingList(): Promise<RankingStyle[]> {
    return await db.style.findMany({
      include: {
        styleImages: {
          take: 1,
          include: { image: true },
        },
        styleTags: {
          include: { tag: true },
        },
        categories: true,
        curations: true,
      },
    });
  }
}

