import { Router } from 'express';
import RankController from '../controllers/rank-controller.ts';
import { validateRequest, getRankingListSchema } from '../middlewares/dto-middleware.ts';

const router = Router();

const rankController = new RankController();

router.get('/', validateRequest(getRankingListSchema), rankController.getRankingList.bind(rankController));

export default router;
