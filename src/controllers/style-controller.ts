import db from '../config/db.js';
import { createCurationForStyle } from '../services/style-service.js';
import { getCurationList } from '../services/style-service.js';
import { comparePassword } from '../utils/compare-password.js';

// 유틸 함수
async function getOrCreateTagIds(tagNames = []) {
  const tagObjs = [];
  for (let name of tagNames) {
    const cleanName = name.trim();
    let tag = await db.tag.findUnique({ where: { name: cleanName } });
    if (!tag) {
      tag = await db.tag.create({ data: { name: cleanName } });
    }
    tagObjs.push({ tagId: tag.tagId });
  }
  return tagObjs;
}
// 이미지 생성 및 ID 반환 함수
async function createImagesAndReturnIds(imageUrls = []) {
  const imageObjs = [];
  for (let img of imageUrls || []) {
    const newImage = await db.image.create({ data: { imageUrl: img } });
    imageObjs.push({
      imageId: newImage.imageId,
      imageUrl: newImage.imageUrl,
    });
  }
  return imageObjs;
}
// JSON 직렬화 시 BigInt를 문자열로 변환하는 함수
function jsonBigIntReplacer(key, value) {
  return typeof value === 'bigint' ? value.toString() : value;
}
// 카테고리 배열을 객체로 변환하는 함수
function categoriesArrayToObject(categoriesArr) {
  const obj = {};
  for (const cat of categoriesArr) {
    obj[cat.type.toLowerCase()] = {
      name: cat.name,
      brand: cat.brand,
      price: Number(cat.price),
    };
  }
  return obj;
}
// 스타일 생성
export class StyleController {
  static async createStyle(req, res, next) {
    try {
      const { nickname, title, content, password, categories, tags = [], imageUrls = [] } = req.validated.body;

      let categoriesArr = [];
      if (Array.isArray(categories)) {
        categoriesArr = categories.map((cat) => ({
          ...cat,
          price: BigInt(cat.price),
        }));
      } else if (typeof categories === 'object') {
        categoriesArr = Object.entries(categories).map(([key, value]) => ({
          type: key.toUpperCase(),
          ...value,
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
            create: tagObjs.map((obj) => ({
              tag: { connect: { tagId: obj.tagId } },
            })),
          },
          styleImages: {
            create: imageObjs.map((obj) => ({
              image: { connect: { imageId: obj.imageId } },
            })),
          },
        },
        include: {
          categories: true,
          styleTags: { include: { tag: true } },
          styleImages: { include: { image: true } },
        },
      });

      // 응답 시 tags 순서 보장
      const sortedTags = tags.filter((name) => newStyle.styleTags.some((st) => st.tag?.name === name));
      // 응답 시 imageUrls 순서 보장
      const sortedImageUrls = imageUrls.filter((url) => newStyle.styleImages.some((si) => si.image?.imageUrl === url));
      // API 명세서에 맞게 응답 형식 변경
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
  static async getStyleList(req, res, next) {
    try {
      const { page = 1, pageSize = 10, sort = 'latest', search } = req.validated.query;

      const where = search
        ? {
            OR: [
              { nickname: { contains: search } },
              { title: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {};

      let orderBy;
      if (sort === 'views') orderBy = { viewCount: 'desc' };
      else if (sort === 'curation') orderBy = { curationCount: 'desc' };
      else orderBy = { createdAt: 'desc' };

      const [totalItemCount, styles] = await Promise.all([
        db.style.count({ where }),
        db.style.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: +pageSize,
          orderBy,
          include: {
            categories: true,
            styleTags: { include: { tag: true } },
            styleImages: { include: { image: true } },
            _count: { select: { curations: true } },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalItemCount / pageSize);
      const currentPage = Number(page);

      const data = styles.map((style) => ({
        id: style.styleId,
        thumbnail: style.styleImages?.[0]?.image?.imageUrl ?? null,
        nickname: style.nickname,
        title: style.title,
        tags: style.styleTags?.map((st) => st.tag?.name).filter(Boolean) || [],
        categories: categoriesArrayToObject(style.categories),
        content: style.content,
        viewCount: style.viewCount,
        curationCount: style.curationCount,
        createdAt: style.createdAt,
      }));

      res.set('Content-Type', 'application/json').send(
        JSON.stringify(
          {
            currentPage,
            totalPages,
            totalItemCount,
            data,
          },
          jsonBigIntReplacer
        )
      );
    } catch (err) {
      next(err);
    }
  }
  // 스타일 상세 조회
  static async getStyleDetail(req, res, next) {
    try {
      const { styleId } = req.validated.params;

      await db.style.update({
        where: { styleId: +styleId },
        data: { viewCount: { increment: 1 } },
      });

      const style = await db.style.findUnique({
        where: { styleId: +styleId },
        include: {
          categories: true,
          styleTags: { include: { tag: true } },
          styleImages: { include: { image: true } },
          curations: true,
        },
      });

      if (!style) return res.status(404).json({ message: '스타일을 찾을 수 없습니다.' });
      // API 명세서에 맞게 응답 형식 변경
      const response = {
        id: style.styleId,
        nickname: style.nickname,
        title: style.title,
        content: style.content,
        viewCount: style.viewCount,
        curationCount: style.curationCount,
        createdAt: style.createdAt,
        categories: categoriesArrayToObject(style.categories),
        tags: style.styleTags.map((st) => st.tag?.name ?? '').filter(Boolean),
        imageUrls: style.styleImages.map((si) => si.image?.imageUrl ?? '').filter(Boolean),
      };

      res.set('Content-Type', 'application/json').send(JSON.stringify(response, jsonBigIntReplacer));
    } catch (err) {
      next(err);
    }
  }

  // 스타일 수정
  static async updateStyle(req, res, next) {
    try {
      const { styleId } = req.validated.params;
      const { nickname, password, title, content, categories, tags = [], imageUrls = [] } = req.validated.body;

      const style = await db.style.findUnique({ where: { styleId: +styleId } });
      if (!style) {
        return res.status(404).json({ message: '스타일을 찾을 수 없습니다.' });
      }

      const isMatch = await comparePassword(password, style.password);

      if (!isMatch) {
        const error = new Error('비밀번호가 일치하지 않습니다.');
        error.statusCode = 403;
        throw error;
      }

      // categories 변환
      let categoriesArr = [];
      if (Array.isArray(categories)) {
        categoriesArr = categories.map((cat) => ({
          ...cat,
          price: BigInt(cat.price),
        }));
      } else if (typeof categories === 'object') {
        categoriesArr = Object.entries(categories).map(([key, value]) => ({
          type: key.toUpperCase(),
          ...value,
          price: BigInt(value.price),
        }));
      }

      // tag, image 등록
      const tagObjs = await getOrCreateTagIds(tags);
      const imageObjs = await createImagesAndReturnIds(imageUrls);

      // 스타일 업데이트
      const updatedStyle = await db.style.update({
        where: { styleId: +styleId },
        data: {
          nickname,
          title,
          content,
          categories: {
            deleteMany: {},
            create: categoriesArr,
          },
          styleTags: {
            deleteMany: {},
            create: tagObjs.map((obj) => ({
              tag: { connect: { tagId: obj.tagId } },
            })),
          },
          styleImages: {
            deleteMany: {},
            create: imageObjs.map((obj) => ({
              image: { connect: { imageId: obj.imageId } },
            })),
          },
          updatedAt: new Date(),
        },
        include: {
          categories: true,
          styleTags: { include: { tag: true } },
          styleImages: { include: { image: true } },
        },
      });

      // 응답 생성 (명세서 기준)
      const response = {
        id: updatedStyle.styleId,
        nickname: updatedStyle.nickname,
        title: updatedStyle.title,
        content: updatedStyle.content,
        viewCount: updatedStyle.viewCount,
        curationCount: updatedStyle.curationCount,
        createdAt: updatedStyle.createdAt,
        categories: categoriesArrayToObject(updatedStyle.categories),
        tags: updatedStyle.styleTags.map((st) => st.tag?.name ?? '').filter(Boolean),
        imageUrls: updatedStyle.styleImages.map((si) => si.image?.imageUrl ?? '').filter(Boolean),
      };

      res.set('Content-Type', 'application/json').send(JSON.stringify(response, jsonBigIntReplacer));
    } catch (err) {
      next(err);
    }
  }

  // 스타일 삭제
  static async deleteStyle(req, res, next) {
    try {
      const { styleId } = req.validated.params;
      const { password } = req.validated.body;

      const style = await db.style.findUnique({ where: { styleId: +styleId } });

      if (!style) {
        return res.status(404).json({ message: '스타일을 찾을 수 없습니다.' });
      }

      const isMatch = await comparePassword(password, style.password);

      if (!isMatch) {
        const error = new Error('비밀번호가 일치하지 않습니다.');
        error.statusCode = 403;
        throw error;
      }

      // 관련된 카테고리, 태그, 이미지 삭제
      await db.category.deleteMany({ where: { styleId: +styleId } });
      await db.styleTag.deleteMany({ where: { styleId: +styleId } });
      await db.styleImage.deleteMany({ where: { styleId: +styleId } });

      await db.style.delete({ where: { styleId: +styleId } });

      return res.status(200).json({ message: '스타일이 삭제되었습니다.' });
    } catch (err) {
      next(err);
    }
  }

  // 스타일에 대한 큐레이션 생성 (POST /styles/:styleId/curations)
  static async createCuration(req, res, next) {
    try {
      const { styleId } = req.validated.params;
      const { nickname, password, trendy, personality, practicality, costEffectiveness, content } = req.validated.body;

      // 서비스 함수 호출
      const newCuration = await createCurationForStyle({
        styleId: +styleId,
        nickname,
        password,
        trendy,
        personality,
        practicality,
        costEffectiveness,
        content,
      });
      // console.log(`🚨newCuration:`, newCuration);

      // 명세서에 맞게 필요한 값만 뽑아서 응답
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

      res.status(200).json(response);
      // console.log(`🚨response:`, response);
    } catch (err) {
      if (err.message === '스타일을 찾을 수 없습니다.') {
        return res.status(404).json({ message: err.message });
      }
      next(err);
    }
  }

  // 스타일에 대한 큐레이션 목록 조회 (GET /styles/:styleId/curations)
  static async getCurationList(req, res, next) {
    try {
      const { styleId } = req.validated.params;
      const { page, pageSize, searchBy, keyword } = req.validated.query;

      const curationsData = await getCurationList({
        styleId: +styleId,
        page,
        pageSize,
        searchBy,
        keyword,
      });

      // 각 큐레이션 객체에 최신 댓글 1개(comment)를 붙임
      const mappedData = curationsData.data.map((curation) => {
        let comment = {};
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
          comment, // 최신 댓글 1개 또는 빈 객체
        };
      });

      const response = {
        currentPage: curationsData.currentPage,
        totalPages: curationsData.totalPages,
        totalItemCount: curationsData.totalItemCount,
        data: mappedData,
      };

      console.log('🔍 mappedData 확인:', JSON.stringify(mappedData, null, 2));
      console.log('📦 raw curationsData.data:', JSON.stringify(curationsData.data, jsonBigIntReplacer, 2));

      res.status(200).json(response);
    } catch (err) {
      if (
        err.message === '페이지 및 페이지 크기는 1 이상의 유효한 숫자여야 합니다.' ||
        err.message === '유효하지 않은 검색 기준입니다.'
      ) {
        return res.status(400).json({ message: err.message });
      }
      if (err.message === '스타일을 찾을 수 없습니다.') {
        return res.status(404).json({ message: err.message });
      }
      next(err);
    }
  }
}
