import db from '../config/db.js';
import { hashPassword } from '../utils/hash-password.js';

// 스타일 등록
export const createStyle = async ({ nickname, title, content, password, categories, tags, images }) => {
  const newStyle = await db.style.create({
    data: {
      nickname,
      title,
      content,
      password,
      categories: {
        create: categories || [],
      },
      styleTags: {
        create: tags?.map(({ tagId }) => ({ tagId })) || [],
      },
      images: {
        create: images?.map(({ url }) => ({ imageUrl: url })) || [],
      },
    },
    include: {
      categories: true,
      styleTags: { include: { tag: true } },
      images: true,
    },
  });
  return newStyle;
};

// 스타일 목록조회
export const getStyleList = async () => {
  const styleList = await db.style.findMany({
    include: {
      categories: true,
      styleTags: { include: { tag: true } },
      images: true,
    },
  });

  const totalCount = await db.style.count();

  return {
    totalCount,
    list: styleList,
  };
};

// 스타일 상세조회
export const getStyleDetail = async (styleId) => {
  // 조회수 증가
  await db.style.update({
    where: { styleId: +styleId },
    data: { viewCount: { increment: 1 } },
  });

  const style = await db.style.findUnique({
    where: { styleId: +styleId },
    include: {
      categories: true,
      styleTags: { include: { tag: true } },
      images: true,
      curations: true,
      comments: true,
    },
  });
  return style;
};

// 스타일 수정
export const updateStyle = async (styleId, { title, content, categories, tags, images }) => {
  const updatedStyle = await db.style.update({
    where: { styleId: +styleId },
    data: {
      title,
      content,
      categories: { deleteMany: {}, create: categories || [] },
      styleTags: { deleteMany: {}, create: (tags || []).map(({ tagId }) => ({ tagId })) },
      images: { deleteMany: {}, create: (images || []).map(({ url }) => ({ imageUrl: url })) },
      updatedAt: new Date(),
    },
    include: {
      categories: true,
      styleTags: { include: { tag: true } },
      images: true,
    },
  });
  return updatedStyle;
};

// 스타일 삭제
export const deleteStyle = async (styleId) => {
  await db.style.delete({ where: { styleId: +styleId } });
  return { message: '스타일이 삭제되었습니다.' };
};

// 스타일의 큐레이팅 생성
export const createCurationForStyle = async ({
  styleId,
  nickname,
  password,
  trendy,
  personality,
  practicality,
  costEffectiveness,
  content,
}) => {
  const style = await db.style.findUnique({
    where: { styleId: Number(styleId) },
  });

  if (!style) {
    const error = new Error('스타일을 찾을 수 없습니다.');
    error.statusCode = 404; 
    throw error;
  }

  // 비밀번호 해싱
  let hashedPassword = password;

  // 비밀번호가 해시된 상태인지 아닌지 판단(불필요한 재해싱 방지용)
  if (!password.startsWith('$2a$') && !password.startsWith('$2b$')) {
    hashedPassword = await hashPassword(password);
  } else {
    console.log('Password appears to be already hashed. Skipping re-hashing.');
  }

  const [curation] = await db.$transaction([
    db.curation.create({
      data: {
        styleId: Number(styleId),
        nickname,
        password: hashedPassword,
        trendy: Number(trendy),
        personality: Number(personality),
        practicality: Number(practicality),
        costEffectiveness: Number(costEffectiveness),
        content: content?.trim() ?? '',
      },
    }),

    db.style.update({
      where: { styleId: Number(styleId) },
      data: {
        curationCount: { increment: 1 },
      },
    }),
  ]);

  return curation;
};

// 스타일의 큐레이션 목록 조회
export const getCurationList = async ({ styleId, page, pageSize, searchBy, keyword }) => {
  const parsedPage = parseInt(page || 1);
  const parsedPageSize = parseInt(pageSize || 10);

  if (parsedPage < 1 || parsedPageSize < 1) {
    const error = new Error('페이지 및 페이지 크기는 1 이상의 유효한 숫자여야 합니다.');
    error.statusCode = 400;
    throw error;
  }

  const existingStyle = await db.style.findUnique({
    where: { styleId: +styleId },
  });
  if (!existingStyle) {
    const error = new Error('스타일을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  let where = { styleId: +styleId };
  if (searchBy && keyword) {
    if (searchBy === 'nickname') {
      where.nickname = { contains: keyword, mode: 'insensitive' };
    } else if (searchBy === 'content') {
      where.content = { contains: keyword, mode: 'insensitive' };
    } else {
      const error = new Error('유효하지 않은 검색 기준입니다.');
      error.statusCode = 400;
      throw error;
    }
  }

  const [totalItemCount, curations] = await Promise.all([
    db.curation.count({ where }),
    db.curation.findMany({
      where,
      skip: (parsedPage - 1) * parsedPageSize,
      take: parsedPageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        comments: true,
        style: {
          include: {
            categories: true,
            styleTags: { include: { tag: true } },
            styleImages: { include: { image: true } },
            _count: { select: { curations: true } },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalItemCount / parsedPageSize);
  const currentPage = parsedPage;

  return {
    currentPage,
    totalPages,
    totalItemCount,
    data: curations,
  };
};
