import express from 'express';
import LogController from '../controllers/log-controller.ts';
import { validateRequest, getLogListSchema } from '../middlewares/dto-middleware.ts';

const logRouter = express.Router();

logRouter.get('/', validateRequest(getLogListSchema), LogController.handleGetLogList);

export default logRouter;
