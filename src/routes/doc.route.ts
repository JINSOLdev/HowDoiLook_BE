import { Router } from 'express'; 
import { swaggerMiddlewareStatic, swaggerMiddlewareRender } from '../middlewares/swagger.middleware.ts';

const docRouter = Router();

// Swagger UI 라우트
docRouter.use('/', swaggerMiddlewareStatic, swaggerMiddlewareRender);

export default docRouter;
