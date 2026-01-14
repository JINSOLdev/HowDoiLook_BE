import { Router } from 'express';
import RankController from '../controllers/rank-controller.js';
import { validateRequest, getRankingListSchema } from '../middlewares/dto-middleware.js';

const router = Router();

const rankController = new RankController();

router.get('/', validateRequest(getRankingListSchema), rankController.getRankingList.bind(rankController));

export default router;
