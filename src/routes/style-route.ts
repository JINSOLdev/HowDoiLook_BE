import { Router } from 'express';
import { StyleController } from '../controllers/style-controller.js';
import {
  validateRequest,
  createStyleSchema,
  getStyleListSchema,
  getStyleDetailSchema,
  updateStyleSchema,
  deleteStyleSchema,
  createCurationSchema, 
  getCurationListSchema
} from '../middlewares/dto-middleware.js';
import { hashPasswordMiddleware } from '../middlewares/bcrypt-middleware.js';

const router = Router();

router.post('/', validateRequest(createStyleSchema), hashPasswordMiddleware, StyleController.createStyle);                 // 등록
router.get('/', validateRequest(getStyleListSchema), StyleController.getStyleList);                  // 목록
router.get('/:styleId', validateRequest(getStyleDetailSchema), StyleController.getStyleDetail);   // 상세
router.put('/:styleId', validateRequest(updateStyleSchema), StyleController.updateStyle);          // 수정
router.delete('/:styleId', validateRequest(deleteStyleSchema), StyleController.deleteStyle);       // 삭제

router.post('/:styleId/curations', validateRequest(createCurationSchema), hashPasswordMiddleware, StyleController.createCuration);
router.get('/:styleId/curations', validateRequest(getCurationListSchema), StyleController.getCurationList);

export default router;

