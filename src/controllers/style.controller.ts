import type { Request, Response, NextFunction } from 'express';
import type { CategoryType, Prisma } from '@prisma/client';
import { getValidated } from '../types/validated.js';
import db from '../config/db.ts';
import { createCurationForStyle, createStyle, getCurationList } from '../services/style.service.js';
import { comparePassword } from '../utils/compare.password.js';

type HttpError = Error & { statusCode?: number };

type CategoryInput = { type?: string; name: string; brand: string; price: number | string };
type CategoriesInput = CategoryInput[] | Record<string, Omit<CategoryInput, 'type'>>;

type CreateStyleBody = {
  nickname: string;
  title: string;
  content: string;
  password: string;
  categories: CategoriesInput;
  tags?: string[];
  imageUrls?: string[];
};

type StyleIdParams = { styleId: number | string };

type ListQuery = {
  page?: number;
  pageSize?: number;
  sort?: 'latest' | 'views' | 'curation';
  search?: string;
};

type UpdateStyleBody = {
  nickname: string;
  title: string;
  content: string;
  password: string;
  categories: CategoriesInput;
  tags?: string[];
  imageUrls?: string[];
};

type StyleWithRelations = Prisma.StyleGetPayload<{
  include: {
    categories: true;
    styleTags: { include: { tag: true } };
    styleImages: { include: { image: true } };
  };
}>;

type DeleteStyleBody = { password: string };

type CreateCurationBody = {
  nickname: string;
  password: string;
  trendy: number;
  personality: number;
  practicality: number;
  costEffectiveness: number;
  content: string;
};

type GetCurationListQuery = {
  page?: number;
  pageSize?: number;
  searchBy?: string;
  keyword?: string;
};

// 유틸 함수
async function getOrCreateTagIds(tagNames: string[] = []) {
  const tagObjs: Array<{ tagId: number }> = [];

  for (const name of tagNames) {
    const cleanName = name.trim();
    let tag = await db.tag.findUnique({ where: { name: cleanName } });
    if (!tag) {
      tag = await db.tag.create({ data: { name: cleanName } });
    }
    tagObjs.push({ tagId: tag.tagId });
  }

  return tagObjs;
}

const toCategoryType = (value: string): CategoryType => {
  const upper = value.toUpperCase();

  const allowed = ['TOP', 'BOTTOM', 'OUTER', 'SHOES', 'ACC'] as const;
  if (!allowed.includes(upper as any)) {
    const err = new Error(`Invalid category type: ${value}`);
    err.statusCode = 400;
    throw err;
  }

  return upper as CategoryType;
};


async function createImagesAndReturnIds(imageUrls: string[] = []) {
  const imageObjs: Array<{ imageId: number; imageUrl: string }> = [];

  for (const img of imageUrls) {
    const newImage = await db.image.create({ data: { imageUrl: img } });
    imageObjs.push({ imageId: newImage.imageId, imageUrl: newImage.imageUrl });
  }

  return imageObjs;
}

function jsonBigIntReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value;
}

function categoriesArrayToObject(
  categoriesArr: Array<{ type: string; name: string; brand: string; price: bigint | number }>
) {
  const obj: Record<string, { name: string; brand: string; price: number }> = {};
  for (const cat of categoriesArr) {
    obj[cat.type.toLowerCase()] = {
      name: cat.name,
      brand: cat.brand,
      price: Number(cat.price),
    };
  }
  return obj;
}

export class StyleController {
  // 스타일 생성
  async createStyle(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = getValidated<CreateStyleBody>(req);
      const { nickname, title, content, password, categories, tags = [], imageUrls = [] } = body;

      let categoriesArr: Prisma.CategoryCreateWithoutStyleInput[] = [];

      const toCategoryType = (value: string): CategoryType => {
        const upper = value.toUpperCase();
        const allowed = ['TOP', 'BOTTOM', 'OUTER', 'SHOES', 'ACC'] as const;

        if (!allowed.includes(upper as any)) {
          const err = new Error(`Invalid category type: ${value}`);
          err.statusCode = 400;
          throw err;
        }
        return upper as CategoryType;
      };

      if (Array.isArray(categories)) {
        categoriesArr = categories.map((cat) => ({
          type: toCategoryType(String(cat.type ?? '')),
          name: cat.name,
          brand: cat.brand,
          price: BigInt(cat.price),
        }));
      } else {
        categoriesArr = Object.entries(categories).map(([key, value]) => ({
          type: toCategoryType(key),
          name: value.name,
          brand: value.brand,
          price: BigInt(value.price),
        }));
      }

      const tagObjs = await getOrCreateTagIds(tags);
      const imageObjs = await createImagesAndReturnIds(imageUrls);

      const newStyle = await db.style.create({
        data: {
          nickname,
          title,
          content,
          password,
          categories: { create: categoriesArr },
          styleTags: {
            create: tagObjs.map((obj) => ({ tag: { connect: { tagId: obj.tagId } } })),
          },
          styleImages: {
            create: imageObjs.map((obj) => ({ image: { connect: { imageId: obj.imageId } } })),
          },
        },
        include: {
          categories: true,
          styleTags: { include: { tag: true } },
          styleImages: { include: { image: true } },
        },
      });

      const sortedTags = tags.filter((name) => newStyle.styleTags.some((st) => st.tag?.name === name));
      const sortedImageUrls = imageUrls.filter((url) => newStyle.styleImages.some((si) => si.image?.imageUrl === url));

      const response = {
        id: newStyle.styleId,
        nickname: newStyle.nickname,
        title: newStyle.title,
        content: newStyle.content,
        viewCount: newStyle.viewCount,
        curationCount: newStyle.curationCount,
        createdAt: newStyle.createdAt,
        categories: categoriesArrayToObject(newStyle.categories),
        tags: sortedTags,
        imageUrls: sortedImageUrls,
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  // 스타일 목록 조회
  async getStyleList(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = getValidated<unknown, unknown, ListQuery>(req);
      const { page = 1, pageSize = 10, sort = 'latest', search } = query;

      const where = search
        ? {
            OR: [
              { nickname: { contains: search } },
              { title: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {};

      let orderBy: any;
      if (sort === 'views') orderBy = { viewCount: 'desc' };
      else if (sort === 'curation') orderBy = { curationCount: 'desc' };
      else orderBy = { createdAt: 'desc' };

      const [totalItemCount, styles] = await Promise.all([
        db.style.count({ where }),
        db.style.findMany({
          where,
          skip: (Number(page) - 1) * Number(pageSize),
          take: Number(pageSize),
          orderBy,
          include: {
            categories: true,
            styleTags: { include: { tag: true } },
            styleImages: { include: { image: true } },
            _count: { select: { curations: true } },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalItemCount / Number(pageSize));
      const currentPage = Number(page);

      const data = styles.map((style) => ({
        id: style.styleId,
        thumbnail: style.styleImages?.[0]?.image?.imageUrl ?? null,
        nickname: style.nickname,
        title: style.title,
        tags: style.styleTags?.map((st) => st.tag?.name).filter(Boolean) ?? [],
        categories: categoriesArrayToObject(style.categories as any),
        content: style.content,
        viewCount: style.viewCount,
        curationCount: style.curationCount,
        createdAt: style.createdAt,
      }));

      res
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ currentPage, totalPages, totalItemCount, data }, jsonBigIntReplacer));
    } catch (err) {
      next(err);
    }
  }

  // 스타일 상세 조회
  async getStyleDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { params } = getValidated<unknown, StyleIdParams>(req);
      const { styleId } = params;

      await db.style.update({
        where: { styleId: Number(styleId) },
        data: { viewCount: { increment: 1 } },
      });

      const style = await db.style.findUnique({
        where: { styleId: Number(styleId) },
        include: {
          categories: true,
          styleTags: { include: { tag: true } },
          styleImages: { include: { image: true } },
          curations: true,
        },
      });

      if (!style) return res.status(404).json({ message: '스타일을 찾을 수 없습니다.' });

      const response = {
        id: style.styleId,
        nickname: style.nickname,
        title: style.title,
        content: style.content,
        viewCount: style.viewCount,
        curationCount: style.curationCount,
        createdAt: style.createdAt,
        categories: categoriesArrayToObject(style.categories as any),
        tags: style.styleTags.map((st) => st.tag?.name ?? '').filter(Boolean),
        imageUrls: style.styleImages.map((si) => si.image?.imageUrl ?? '').filter(Boolean),
      };

      res.set('Content-Type', 'application/json').send(JSON.stringify(response, jsonBigIntReplacer));
    } catch (err) {
      next(err);
    }
  }

  // 스타일 수정
  async updateStyle(req: Request, res: Response, next: NextFunction) {
    try {
      const { body, params } = getValidated<UpdateStyleBody, StyleIdParams>(req);
      const { nickname, password, title, content, categories, tags = [], imageUrls = [] } = body;
      const { styleId } = params;

      const style = await db.style.findUnique({ where: { styleId: Number(styleId) } });
      if (!style) return res.status(404).json({ message: '스타일을 찾을 수 없습니다.' });

      const isMatch = await comparePassword(password, style.password);
      if (!isMatch) {
        const error: HttpError = new Error('비밀번호가 일치하지 않습니다.');
        error.statusCode = 403;
        throw error;
      }

      let categoriesArr: Prisma.CategoryCreateWithoutStyleInput[] = [];

      if (Array.isArray(categories)) {
        categoriesArr = categories.map((cat) => ({
          type: toCategoryType(String(cat.type ?? '')),
          name: cat.name,
          brand: cat.brand,
          price: BigInt(cat.price),
        }));
      } else {
        categoriesArr = Object.entries(categories).map(([key, value]) => ({
          type: toCategoryType(key),
          name: value.name,
          brand: value.brand,
          price: BigInt(value.price),
        }));
      }

      const tagObjs = await getOrCreateTagIds(tags);
      const imageObjs = await createImagesAndReturnIds(imageUrls);

      const updatedStyle: StyleWithRelations = await db.style.update({
        where: { styleId: Number(styleId) },
        data: {
          nickname,
          title,
          content,
          categories: { deleteMany: {}, create: categoriesArr },
          styleTags: {
            deleteMany: {},
            create: tagObjs.map((obj) => ({ tag: { connect: { tagId: obj.tagId } } })),
          },
          styleImages: {
            deleteMany: {},
            create: imageObjs.map((obj) => ({ image: { connect: { imageId: obj.imageId } } })),
          },
          updatedAt: new Date(),
        },
        include: {
          categories: true,
          styleTags: { include: { tag: true } },
          styleImages: { include: { image: true } },
        },
      });

      const response = {
        id: updatedStyle.styleId,
        nickname: updatedStyle.nickname,
        title: updatedStyle.title,
        content: updatedStyle.content,
        viewCount: updatedStyle.viewCount,
        curationCount: updatedStyle.curationCount,
        createdAt: updatedStyle.createdAt,
        categories: categoriesArrayToObject(updatedStyle.categories as any),
        tags: updatedStyle.styleTags.map((st) => st.tag?.name ?? '').filter(Boolean),
        imageUrls: updatedStyle.styleImages.map((si) => si.image?.imageUrl ?? '').filter(Boolean),
      };

      return res.set('Content-Type', 'application/json').send(JSON.stringify(response, jsonBigIntReplacer));
    } catch (err) {
      next(err);
    }
  }

  // 스타일 삭제
  async deleteStyle(req: Request, res: Response, next: NextFunction) {
    try {
      const { body, params } = getValidated<DeleteStyleBody, StyleIdParams>(req);
      const { password } = body;
      const { styleId } = params;

      const style = await db.style.findUnique({ where: { styleId: Number(styleId) } });
      if (!style) return res.status(404).json({ message: '스타일을 찾을 수 없습니다.' });

      const isMatch = await comparePassword(password, style.password);
      if (!isMatch) {
        const error: HttpError = new Error('비밀번호가 일치하지 않습니다.');
        error.statusCode = 403;
        throw error;
      }

      await db.category.deleteMany({ where: { styleId: Number(styleId) } });
      await db.styleTag.deleteMany({ where: { styleId: Number(styleId) } });
      await db.styleImage.deleteMany({ where: { styleId: Number(styleId) } });
      await db.style.delete({ where: { styleId: Number(styleId) } });

      return res.status(200).json({ message: '스타일이 삭제되었습니다.' });
    } catch (err) {
      next(err);
    }
  }

  // 스타일에 대한 큐레이션 생성
  async createCuration(req: Request, res: Response, next: NextFunction) {
    try {
      const { body, params } = getValidated<CreateCurationBody, StyleIdParams>(req);
      const { styleId } = params;
      const { nickname, password, trendy, personality, practicality, costEffectiveness, content } = body;

      const newCuration = await createCurationForStyle({
        styleId: Number(styleId),
        nickname,
        password,
        trendy,
        personality,
        practicality,
        costEffectiveness,
        content,
      });

      const response = {
        id: newCuration.curationId,
        nickname: newCuration.nickname,
        content: newCuration.content,
        trendy: newCuration.trendy,
        personality: newCuration.personality,
        practicality: newCuration.practicality,
        costEffectiveness: newCuration.costEffectiveness,
        createdAt: newCuration.createdAt,
      };

      return res.status(200).json(response);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === '스타일을 찾을 수 없습니다.') {
        return res.status(404).json({ message: err.message });
      }
      next(err);
    }
  }

  // 스타일에 대한 큐레이션 목록 조회
  static async getCurationList(req: Request, res: Response, next: NextFunction) {
    try {
      const { params, query } = getValidated<unknown, StyleIdParams, GetCurationListQuery>(req);
      const { styleId } = params;
      const { page, pageSize, searchBy, keyword } = query;

      const curationsData = await getCurationList({
        styleId: Number(styleId),
        page,
        pageSize,
        searchBy,
        keyword,
      });

      const mappedData = curationsData.data.map((curation: any) => {
        let comment: Record<string, unknown> = {};
        const latestComment = curation.comments;

        if (curation.comments) {
          comment = {
            id: latestComment.commentId,
            nickname: curation.style.nickname,
            content: latestComment.content,
            createdAt: latestComment.createdAt,
          };
        }

        return {
          id: curation.curationId,
          nickname: curation.nickname,
          content: curation.content,
          trendy: curation.trendy,
          personality: curation.personality,
          practicality: curation.practicality,
          costEffectiveness: curation.costEffectiveness,
          createdAt: curation.createdAt,
          comment,
        };
      });

      res.status(200).json({
        currentPage: curationsData.currentPage,
        totalPages: curationsData.totalPages,
        totalItemCount: curationsData.totalItemCount,
        data: mappedData,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (
          err.message === '페이지 및 페이지 크기는 1 이상의 유효한 숫자여야 합니다.' ||
          err.message === '유효하지 않은 검색 기준입니다.'
        ) {
          return res.status(400).json({ message: err.message });
        }
        if (err.message === '스타일을 찾을 수 없습니다.') {
          return res.status(404).json({ message: err.message });
        }
      }
      next(err);
    }
  }
}
