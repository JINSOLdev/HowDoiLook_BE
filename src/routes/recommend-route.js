import { Router } from 'express';
import { getWeatherRecommend } from '../controllers/recommend-controller.js';
import { cache } from '../middlewares/cache-middleware.js';

const router = Router();

router.get(
  '/weather',
  cache((req) => `weather:${req.query.lat}:${req.query.lon}`, 5), // 5분 캐시
  getWeatherRecommend
);

export default router;