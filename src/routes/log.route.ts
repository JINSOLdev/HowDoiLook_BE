import { Router } from 'express';
import LogController from '../controllers/log.controller.js';
import { validateRequest, getLogListSchema } from '../middlewares/dto.middleware.ts';

const logRouter = Router();

// 로그 리스트 조회
logRouter.get('/', validateRequest(getLogListSchema), LogController.handleGetLogList);

export default logRouter;
