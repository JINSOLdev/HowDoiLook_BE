import type { Request, Response, NextFunction } from 'express';
import { getValidated } from '../types/validated.js';
import RankService from '../services/rank.service.js';

type RankBy = 'total' | 'trendy' | 'personality' | 'practicality' | 'costEffectiveness';

type RankingQuery = {
  page?: number;
  pageSize?: number;
  rankBy?: RankBy | string;
};

export class RankController {
  private readonly rankService: RankService;

  constructor() {
    this.rankService = new RankService();
  }

  // 랭킹 조회
  async getRankingList(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = getValidated<unknown, unknown, RankingQuery>(req)
      const { page = 1, pageSize = 10, rankBy = 'total' } = query;

      const validRankBy: RankBy[] = ['total', 'trendy', 'personality', 'practicality', 'costEffectiveness'];
      if (!validRankBy.includes(rankBy as RankBy)) {
        return res.status(400).json({ message: `Invalid rankBy value: ${rankBy}` });
      }

      const offset = (Number(page) - 1) * Number(pageSize);

      const allStyles = await this.rankService.getRankingList();

      const stylesWithRating = allStyles.map((style: any) => {
        let rating = 0;

        if (style.curations.length === 0) return { ...style, rating: null as number | null };

        if (['personality', 'practicality', 'costEffectiveness', 'trendy'].includes(rankBy)) {
          const key = rankBy as Exclude<RankBy, 'total'>;
          const sum = style.curations.reduce((acc: number, cur: any) => acc + Number(cur[key]), 0);
          rating = sum / style.curations.length;
        } else {
          const sum = style.curations.reduce(
            (acc: number, cur: any) =>
              acc +
              Number(cur.trendy) +
              Number(cur.personality) +
              Number(cur.practicality) +
              Number(cur.costEffectiveness),
            0
          );
          rating = sum / (style.curations.length * 4);
        }

        return { ...style, rating: Number(rating.toFixed(1)) };
      });

      const sorted = stylesWithRating.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      const paginated = sorted.slice(offset, offset + Number(pageSize));

      const data = paginated.map((style: any, index: number) => {
        const topCategory = style.categories.find((cat: any) => cat.type === 'TOP');
        return {
          id: style.styleId,
          thumbnail: style.styleImages[0]?.image.imageUrl || null,
          nickname: style.nickname,
          title: style.title,
          tags: style.styleTags.map((tag: any) => tag.tag.name),
          categories: topCategory
            ? {
                top: {
                  name: topCategory.name,
                  brand: topCategory.brand,
                  price: Number(topCategory.price),
                },
              }
            : {},
          viewCount: style.viewCount,
          curationCount: style.curationCount,
          createdAt: style.createdAt,
          ranking: offset + index + 1,
          rating: style.rating,
        };
      });

      return res.status(200).json({
        currentPage: Number(page),
        totalPages: Math.ceil(allStyles.length / Number(pageSize)),
        totalItemCount: allStyles.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
