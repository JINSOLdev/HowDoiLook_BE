import express from 'express';
import { swaggerMiddlewareStatic, swaggerMiddlewareRender } from '../middlewares/swagger-middleware.js';

const docRouter = express.Router();

docRouter.use('/', swaggerMiddlewareStatic, swaggerMiddlewareRender);

export default docRouter;
