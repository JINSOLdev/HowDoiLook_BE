import type { Comment } from '@prisma/client';
import db from '../config/db.js';
import { comparePassword } from '../utils/compare.password.js';
import { hashPassword } from '../utils/hash.password.js';

type HttpError = Error & { statusCode?: number };

const toNumber = (v: number | string): number => (typeof v === 'number' ? v : Number(v));

type CreateCommentInput = {
  password: string;
  content: string;
  curationId: number | string;
};

type UpdateCommentInput = {
  password: string;
  content: string;
  commentId: number | string;
};

type DeleteCommentInput = {
  password: string;
  commentId: number | string;
};

type CommentWithNickname = Comment & { nickname: string };

// 답글 등록
export const createCommentService = async ({
  password,
  content,
  curationId,
}: CreateCommentInput): Promise<CommentWithNickname> => {
  const id = toNumber(curationId);

  // style 비밀번호를 참조하기 위해 style 포함
  const curation = await db.curation.findUnique({
    where: { curationId: id },
    include: { style: true },
  });

  if (!curation) {
    const error: HttpError = new Error('큐레이팅을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await comparePassword(password, curation.style.password);
  if (!isMatch) {
    const error: HttpError = new Error('비밀번호가 일치하지 않습니다.');
    error.statusCode = 403;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const comment = await db.comment.create({
    data: {
      content,
      password: hashedPassword,
      curation: { connect: { curationId: id } },
    },
  });

  return {
    ...comment,
    nickname: curation.style.nickname,
  };
};

// 답글 수정
export const updateCommentService = async ({
  password,
  content,
  commentId,
}: UpdateCommentInput): Promise<CommentWithNickname> => {
  const id = toNumber(commentId);

  const comment = await db.comment.findUnique({
    where: { commentId: id },
    include: { curation: { include: { style: true } } },
  });

  if (!comment) {
    const error: HttpError = new Error('답글을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await comparePassword(password, comment.password);
  if (!isMatch) {
    const error: HttpError = new Error('비밀번호가 일치하지 않습니다.');
    error.statusCode = 403;
    throw error;
  }

  const updated = await db.comment.update({
    where: { commentId: id },
    data: { content },
  });

  return {
    ...updated,
    nickname: comment.curation.style.nickname,
  };
};

// 답글 삭제
export const deleteCommentService = async ({
  password,
  commentId,
}: DeleteCommentInput): Promise<{ message: string }> => {
  const id = toNumber(commentId);

  const comment = await db.comment.findUnique({
    where: { commentId: id },
  });

  if (!comment) {
    const error: HttpError = new Error('답글을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await comparePassword(password, comment.password);
  if (!isMatch) {
    const error: HttpError = new Error('비밀번호가 일치하지 않습니다.');
    error.statusCode = 403;
    throw error;
  }

  await db.comment.delete({
    where: { commentId: id },
  });

  return { message: '답글 삭제 성공' };
};
