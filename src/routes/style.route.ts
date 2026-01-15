import { Router } from 'express';
import { StyleController } from '../controllers/style.controller.js';
import { hashPasswordMiddleware } from '../middlewares/bcrypt.middleware.js';
import {
  validateRequest,
  createStyleSchema,
  getStyleListSchema,
  getStyleDetailSchema,
  updateStyleSchema,
  deleteStyleSchema,
  createCurationSchema,
  getCurationListSchema,
} from '../middlewares/dto.middleware.ts';

const router = Router();

// 스타일 등록
router.post('/', validateRequest(createStyleSchema), hashPasswordMiddleware, StyleController.createStyle);
// 스타일 조회
router.get('/', validateRequest(getStyleListSchema), StyleController.getStyleList);
// 스타일 상세조회
router.get('/:styleId', validateRequest(getStyleDetailSchema), StyleController.getStyleDetail);
// 스타일 수정
router.put('/:styleId', validateRequest(updateStyleSchema), StyleController.updateStyle);
// 스타일 삭제
router.delete('/:styleId', validateRequest(deleteStyleSchema), StyleController.deleteStyle);

// 큐레이션 등록
router.post(
  '/:styleId/curations',
  validateRequest(createCurationSchema),
  hashPasswordMiddleware,
  StyleController.createCuration
);

// 스타일별 큐레이션 리스트 조회
router.get('/:styleId/curations', validateRequest(getCurationListSchema), StyleController.getCurationList);

export default router;
