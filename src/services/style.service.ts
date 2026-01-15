import type { Prisma } from '@prisma/client';
import db from '../config/db.js';
import { hashPassword } from '../utils/hash.password.js';

type HttpError = Error & { statusCode?: number };
const toNumber = (v: number | string): number => (typeof v === 'number' ? v : Number(v));

type CreateStyleInput = {
  nickname: string;
  title: string;
  content: string;
  password: string;
  categories?: Prisma.CategoryCreateWithoutStyleInput[];
  tagIds?: number[];
  imageIds?: number[];
};

type StyleDetail = Prisma.StyleGetPayload<{
  include: {
    categories: true;
    styleTags: { include: { tag: true } };
    styleImages: { include: { image: true } };
    curations: true;
  };
}>;

type StyleListItem = Prisma.StyleGetPayload<{
  include: {
    styleImages: { take: 1; include: { image: true } };
    styleTags: { include: { tag: true } };
    categories: true;
    curations: true;
  };
}>;

type GetStyleListQuery = {
  page?: number | string;
  pageSize?: number | string;
  sort?: 'latest' | 'views' | 'curation' | string;
  search?: string;
};

export const createStyle = async (input: CreateStyleInput): Promise<StyleDetail> => {
  const hashed = await hashPassword(input.password);

  const created = await db.style.create({
    data: {
      nickname: input.nickname,
      title: input.title,
      content: input.content,
      password: hashed,

      categories: {
        create: input.categories ?? [],
      },

      styleTags: {
        create: (input.tagIds ?? []).map((tagId) => ({
          tag: { connect: { tagId } },
        })),
      },

      styleImages: {
        create: (input.imageIds ?? []).map((imageId) => ({
          image: { connect: { imageId } },
        })),
      },
    },
    include: {
      categories: true,
      styleTags: { include: { tag: true } },
      styleImages: { include: { image: true } },
      curations: true,
    },
  });

  return created;
};

export const getStyleList = async (query: GetStyleListQuery) => {
  const parsedPage = Number(query.page ?? 1);
  const parsedPageSize = Number(query.pageSize ?? 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = Number.isFinite(parsedPageSize) && parsedPageSize >= 0 ? parsedPageSize : 10;

  const sort = String(query.sort ?? 'latest');

  const orderBy: Prisma.StyleOrderByWithRelationInput =
    sort === 'views'
      ? { viewCount: 'desc' }
      : sort === 'curation'
        ? { curations: { _count: 'desc' } }
        : { createdAt: 'desc' };

  const where: Prisma.StyleWhereInput = query.search
    ? {
        OR: [
          { nickname: { contains: query.search, mode: 'insensitive' } },
          { title: { contains: query.search, mode: 'insensitive' } },
          { content: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [totalCount, list] = await Promise.all([
    db.style.count({ where }),
    db.style.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        styleImages: { take: 1, include: { image: true } },
        styleTags: { include: { tag: true } },
        categories: true,
        curations: true,
      },
    }),
  ]);

  return { totalCount, list: list as StyleListItem[] };
};

// 스타일 상세조회 (조회수 +1 포함)
export const getStyleDetail = async (styleId: number | string): Promise<StyleDetail> => {
  const id = toNumber(styleId);

  // 조회수 증가
  await db.style.update({
    where: { styleId: id },
    data: { viewCount: { increment: 1 } },
  });

  const style = await db.style.findUnique({
    where: { styleId: id },
    include: {
      categories: true,
      styleTags: { include: { tag: true } },
      styleImages: { include: { image: true } },
      curations: true,
    },
  });

  if (!style) {
    const error: HttpError = new Error('스타일을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  return style;
};

export type UpdateStyleInput = {
  styleId: number | string;
  nickname?: string;
  title?: string;
  content?: string;
  password?: string; // 변경 시에만
};

export const updateStyle = async (input: UpdateStyleInput) => {
  const id = toNumber(input.styleId);

  const style = await db.style.findUnique({
    where: { styleId: id },
  });

  if (!style) {
    const error: HttpError = new Error('스타일을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  const hashedPassword = input.password ? await hashPassword(input.password) : undefined;

  return db.style.update({
    where: { styleId: id },
    data: {
      nickname: input.nickname ?? undefined,
      title: input.title ?? undefined,
      content: input.content ?? undefined,
      ...(hashedPassword ? { password: hashedPassword } : {}),
    },
  });
};

export const deleteStyle = async (styleId: number | string) => {
  const id = toNumber(styleId);
  return db.style.delete({ where: { styleId: id } });
};
