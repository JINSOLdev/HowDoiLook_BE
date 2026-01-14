import express from 'express';
import LogController from '../controllers/log-controller.js';
import { validateRequest, getLogListSchema } from '../middlewares/dto-middleware.js';

const logRouter = express.Router();

logRouter.get('/', validateRequest(getLogListSchema), LogController.handleGetLogList);

export default logRouter;
