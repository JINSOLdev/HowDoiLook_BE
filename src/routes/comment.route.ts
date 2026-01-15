import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller.js';
import { validateRequest, updateCommentSchema, deleteCommentSchema } from '../middlewares/dto.middleware.js';

const router = Router();

// 답글 수정
router.put('/:commentId', validateRequest(updateCommentSchema), CommentController.updateComment);
// 답글 삭제
router.delete('/:commentId', validateRequest(deleteCommentSchema), CommentController.deleteComment);

export default router;
