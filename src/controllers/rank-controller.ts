import RankService from '../services/rank-service.js';

class RankController {
  constructor() {
    this.rankService = new RankService();
  }

  async getRankingList(req, res, next) {
    try {
      const { page = 1, pageSize = 10, rankBy = 'total' } = req.validated.query;

      const validRankBy = ['total', 'trendy', 'personality', 'practicality', 'costEffectiveness'];
      if (!validRankBy.includes(rankBy)) {
        return res.status(400).json({ message: `Invalid rankBy value: ${rankBy}` });
      }

      const offset = (page - 1) * pageSize;

      const allStyles = await this.rankService.getRankingList();

      const stylesWithRating = allStyles.map((style) => {
        let rating = 0;

        if (style.curations.length === 0) return { ...style, rating: null };

        const sumReducer = (acc, cur, key) => acc + cur[key];
        if (['personality', 'practicality', 'costEffectiveness', 'trendy'].includes(rankBy)) {
          const sum = style.curations.reduce((acc, cur) => sumReducer(acc, cur, rankBy), 0);
          rating = sum / style.curations.length;
        } else {
          // total
          const sum = style.curations.reduce(
            (acc, cur) => acc + cur.trendy + cur.personality + cur.practicality + cur.costEffectiveness,
            0
          );
          rating = sum / (style.curations.length * 4);
        }

        return { ...style, rating: Number(rating.toFixed(1)) };
      });

      const sorted = stylesWithRating.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      const paginated = sorted.slice(offset, offset + Number(pageSize));

      const data = paginated.map((style, index) => {
        const topCategory = style.categories.find((cat) => cat.type === 'TOP');
        return {
          id: style.styleId,
          thumbnail: style.styleImages[0]?.image.imageUrl || null,
          nickname: style.nickname,
          title: style.title,
          tags: style.styleTags.map((tag) => tag.tag.name),
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

      res.status(200).json({
        currentPage: Number(page),
        totalPages: Math.ceil(allStyles.length / pageSize),
        totalItemCount: allStyles.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default RankController;
