import { Router } from 'express';
import { CurationController } from '../controllers/curation-controller.js';
import { CommentController } from '../controllers/comment-controller.js';
import {
  validateRequest,
  createCommentSchema,
  deleteCurationSchema,
  updateCurationSchema,
} from '../middlewares/dto-middleware.js';

const router = Router();

router.put('/:curationId', validateRequest(updateCurationSchema), CurationController.updateCuration); //큐레이션 수정
router.delete('/:curationId', validateRequest(deleteCurationSchema), CurationController.deleteCuration); //큐레이션 삭제

router.post('/:curationId/comments', validateRequest(createCommentSchema), CommentController.createComment); // 답글 등록

export default router;
