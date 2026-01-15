import { Request, Response, NextFunction } from 'express';
import { getValidated } from '../types/validated.js';
import { createCommentService, updateCommentService, deleteCommentService } from '../services/comment.service.js';

type CreateCommentBody = { password: string; content: string };
type CreateCommentParams = { curationId: number | string };

type UpdateCommentBody = { password: string; content?: string };
type UpdateCommentParams = { commentId: number | string };

type DeleteCommentBody = { password: string };
type DeleteCommentParams = { commentId: number | string };

export class CommentController {

  // 댓글 등록
  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { body, params } = getValidated<CreateCommentBody, CreateCommentParams>(req);
      const { password, content } = body;
      const { curationId } = params;

      const comment = await createCommentService({ password, content, curationId });

      return res.status(200).json({
        id: comment.commentId,
        nickname: comment.nickname,
        content: comment.content,
        createdAt: comment.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }

  // 댓글 수정
  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { body, params } = getValidated<UpdateCommentBody, UpdateCommentParams>(req);
      const { content, password } = body;
      const { commentId } = params;

      const updated = await updateCommentService({ content, password, commentId });

      return res.status(200).json({
        id: updated.commentId,
        nickname: updated.nickname,
        content: updated.content,
        createdAt: updated.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }

  // 댓글 삭제
  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { body, params } = getValidated<DeleteCommentBody, DeleteCommentParams>(req);
      const { password } = body;
      const { commentId } = params;

      const deleted = await deleteCommentService({ password, commentId });

      return res.status(200).json(deleted);
    } catch (error) {
      next(error);
    }
  }
}
