import Router from 'express';
import { CommentController } from '../controllers/comment-controller.ts';
import { validateRequest, updateCommentSchema, deleteCommentSchema } from '../middlewares/dto-middleware.ts';

const router = Router();

router.put('/:commentId', validateRequest(updateCommentSchema), CommentController.updateComment); // 답글 수정
router.delete('/:commentId', validateRequest(deleteCommentSchema), CommentController.deleteComment); // 답글 삭제

export default router;
