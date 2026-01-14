import { createCommentService, updateCommentService, deleteCommentService } from '../services/comment-service.js';

export class CommentController {
  // 댓글 등록
  static async createComment(req, res, next) {
    try {
      const { password, content } = req.validated.body;
      const { curationId } = req.validated.params;

      const comment = await createCommentService({ password, content, curationId });

      res.status(200).json({
        id: comment.commentId,
        nickname: comment.nickname,
        content: comment.content,
        createdAt: comment.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }

  // 댓글 수정
  static async updateComment(req, res, next) {
    try {
      const { content, password } = req.validated.body;
      const { commentId } = req.validated.params;

      const updated = await updateCommentService({ content, password, commentId });

      res.status(200).json({
        id: updated.commentId,
        nickname: updated.nickname,
        content: updated.content,
        createdAt: updated.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }

  // 댓글 삭제
  static async deleteComment(req, res, next) {
    try {
      const { password } = req.validated.body;
      const { commentId } = req.validated.params;

      const deleted = await deleteCommentService({ password, commentId });

      res.status(200).json(deleted);
    } catch (err) {
      next(err);
    }
  }
}
