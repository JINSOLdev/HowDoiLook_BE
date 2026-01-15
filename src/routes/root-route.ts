import express from 'express';
import RootController from '../controllers/root-controller.ts';

const rootRouter = express.Router();

rootRouter.get('/', RootController.handleHealthCheck);

export default rootRouter;
