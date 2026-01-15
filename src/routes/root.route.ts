import { Router } from 'express';
import RootController from '../controllers/root.controller.js';

const rootRouter = Router();

// 헬스체크
rootRouter.get('/', RootController.handleHealthCheck);

export default rootRouter;
