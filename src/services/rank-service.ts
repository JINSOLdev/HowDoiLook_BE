import db from '../config/db.js';

class RankService {
  async getRankingList() {
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

export default RankService;
