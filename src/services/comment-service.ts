import db from '../config/db.js';
import { comparePassword } from '../utils/compare-password.js';
import { hashPassword } from '../utils/hash-password.js';

// 답글 등록
export const createCommentService = async ({ password, content, curationId }) => {
  // style 비밀번호를 참조하기위해 stlye을 포함시킵니다.
  const curation = await db.curation.findUnique({
    where: { curationId },
    include: { style: true },
  });

  if (!curation) {
    const error = new Error();
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await comparePassword(password, curation.style.password);

  if (!isMatch) {
    const error = new Error();
    error.statusCode = 403;
    throw error;
  }

  const existing = await db.comment.findFirst({
    where: { curationId },
  });

  if (existing) {
    const error = new Error();
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const comment = await db.comment.create({
    data: {
      content,
      password: hashedPassword,
      curation: { connect: { curationId } },
    },
  });

  return {
    ...comment,
    nickname: curation.style.nickname,
  };
};

// 답글 수정
export const updateCommentService = async ({ content, password, commentId }) => {
  // 닉네임을 가져오기위해 style을 포함시킵니다.
  const comment = await db.comment.findFirst({
    where: { commentId },
    include: {
      curation: {
        include: { style: true },
      },
    },
  });

  if (!comment) {
    const error = new Error();
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await comparePassword(password, comment.password);

  if (!isMatch) {
    const error = new Error();
    error.statusCode = 403;
    throw error;
  }

  const updated = await db.comment.update({
    where: { commentId: comment.commentId },
    data: { content },
  });

  return {
    ...updated,
    nickname: comment.curation.style.nickname,
  };
};

// 답글 삭제
export const deleteCommentService = async ({ password, commentId }) => {
  const comment = await db.comment.findFirst({
    where: { commentId },
  });

  if (!comment) {
    const error = new Error();
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await comparePassword(password, comment.password);

  if (!isMatch) {
    const error = new Error();
    error.statusCode = 403;
    throw error;
  }


  await db.comment.delete({
    where: { commentId: comment.commentId },
  });

  return { message: '답글 삭제 성공' };
};
