import type { Curation } from '@prisma/client';
import db from '../config/db.js';
import { comparePassword } from '../utils/compare.password.js';
import { hashPassword } from '../utils/hash.password.js';

type HttpError = Error & { statusCode?: number };

const toNumber = (v: number | string): number => (typeof v === 'number' ? v : Number(v));

type CreateCurationInput = {
  styleId: number | string;
  nickname: string;
  password: string;
  trendy: number | string;
  personality: number | string;
  practicality: number | string;
  costEffectiveness: number | string;
  content: string;
};

type UpdateCurationInput = {
  password: string;
  nickname?: string;
  trendy?: number | string;
  personality?: number | string;
  practicality?: number | string;
  costEffectiveness?: number | string;
  content?: string;
};

type CurationListQuery = {
  page?: number | string;
  pageSize?: number | string;
  styleId?: number | string;
  nickname?: string;
  content?: string;
};

export const createCurationService = async (input: CreateCurationInput): Promise<Curation> => {
  const styleId = toNumber(input.styleId);

  // 1. 스타일 존재 여부 확인
  const existingStyle = await db.style.findUnique({
    where: { styleId },
  });

  if (!existingStyle) {
    const error: HttpError = new Error('스타일을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  // 2. 비밀번호 해싱
  const hashedPassword = await hashPassword(input.password);

  // 3. 큐레이팅 생성
  return db.curation.create({
    data: {
      styleId,
      nickname: input.nickname,
      password: hashedPassword,
      trendy: toNumber(input.trendy),
      personality: toNumber(input.personality),
      practicality: toNumber(input.practicality),
      costEffectiveness: toNumber(input.costEffectiveness),
      content: input.content,
    },
  });
};

export const getCurationListService = async (query: CurationListQuery) => {
  const parsedPage = Number(query.page ?? 1);
  const parsedPageSize = Number(query.pageSize ?? 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = Number.isFinite(parsedPageSize) && parsedPageSize >= 0 ? parsedPageSize : 10;

  const where: Record<string, unknown> = {};

  if (query.styleId !== undefined) where.styleId = toNumber(query.styleId);
  if (query.nickname) where.nickname = { contains: query.nickname, mode: 'insensitive' };
  if (query.content) where.content = { contains: query.content, mode: 'insensitive' };

  const [totalItemCount, list] = await Promise.all([
    db.curation.count({ where }),
    db.curation.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { totalItemCount, data: list };
};

export const updateCurationService = async (
  curationId: number | string,
  input: UpdateCurationInput
): Promise<Curation> => {
  const id = toNumber(curationId);

  // 1. 기존 큐레이팅 확인
  const existingCuration = await db.curation.findUnique({
    where: { curationId: id },
  });

  if (!existingCuration) {
    const error: HttpError = new Error('큐레이팅을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  // 2. 비밀번호 검증
  const ok = await comparePassword(input.password, existingCuration.password);
  if (!ok) {
    const error: HttpError = new Error('비밀번호가 일치하지 않습니다.');
    error.statusCode = 403;
    throw error;
  }

  // 3. 업데이트
  return db.curation.update({
    where: { curationId: id },
    data: {
      nickname: input.nickname !== undefined ? input.nickname : existingCuration.nickname,
      trendy: input.trendy !== undefined ? toNumber(input.trendy) : existingCuration.trendy,
      personality: input.personality !== undefined ? toNumber(input.personality) : existingCuration.personality,
      practicality: input.practicality !== undefined ? toNumber(input.practicality) : existingCuration.practicality,
      costEffectiveness:
        input.costEffectiveness !== undefined ? toNumber(input.costEffectiveness) : existingCuration.costEffectiveness,
      content: input.content !== undefined ? input.content : existingCuration.content,
    },
  });
};

export const deleteCurationService = async (curationId: number | string, password: string) => {
  const id = toNumber(curationId);

  const existingCuration = await db.curation.findUnique({
    where: { curationId: id },
  });

  if (!existingCuration) {
    const error: HttpError = new Error('큐레이팅을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  const ok = await comparePassword(password, existingCuration.password);
  if (!ok) {
    const error: HttpError = new Error('비밀번호가 일치하지 않습니다.');
    error.statusCode = 403;
    throw error;
  }

  await db.curation.delete({ where: { curationId: id } });

  return { message: '큐레이팅 삭제 성공' };
};
