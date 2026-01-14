import express from 'express';
import RootController from '../controllers/root-controller.js';

const rootRouter = express.Router();

rootRouter.get('/', RootController.handleHealthCheck);

export default rootRouter;
