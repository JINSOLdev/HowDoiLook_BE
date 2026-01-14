import db from '../config/db.js';
import { comparePassword } from '../utils/compare-password.js';
import { hashPassword } from '../utils/hash-password.js';

export const createCurationService = async ({
  styleId,
  nickname,
  password,
  trendy,
  personality,
  practicality,
  costEffectiveness,
  content,
}) => {
  // 1. 스타일 존재 여부 확인
  const existingStyle = await db.style.findUnique({
    where: { styleId: +styleId },
  });

  if (!existingStyle) {
    const error = new Error('해당 스타일을 찾을 수 없습니다.');
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

  // 2. 큐레이션 데이터 생성 (포맷팅 없이 Prisma 원본 객체 반환)
  const newCuration = await db.curation.create({
    data: {
      styleId: +styleId,
      nickname,
      password: hashedPassword,
      trendy: +trendy,
      personality: +personality,
      practicality: +practicality,
      costEffectiveness: +costEffectiveness,
      content,
    },
  });

  return newCuration;
};

export const getCurationListService = async ({ styleId, page, pageSize, searchBy, keyword }) => {
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
    const error = new Error('해당 스타일을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  // 2. 검색 조건
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

  // 3. 총 아이템 개수 및 큐레이션 목록 조회
  const [totalItemCount, curations] = await Promise.all([
    db.curation.count({ where }),
    db.curation.findMany({
      where,
      skip: (parsedPage - 1) * parsedPageSize,
      take: parsedPageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        comments: true,
      },
    }),
  ]);

  // 4. 총 페이지 수 계산
  const totalPages = Math.ceil(totalItemCount / parsedPageSize);

  // 5. 페이지네이션 정보와 함께 원본 데이터 반환
  return {
    currentPage: parsedPage,
    totalPages,
    totalItemCount,
    data: curations,
  };
};

export const updateCurationService = async (
  curationId,
  { password, trendy, personality, practicality, costEffectiveness, content, nickname }
) => {
  // 1. 큐레이팅 존재 여부 확인
  const existingCuration = await db.curation.findUnique({
    where: { curationId: +curationId },
  });

  if (!existingCuration) {
    const error = new Error('큐레이팅을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }
  // 2. 비밀번호 일치 확인 comparePassword
  if (!await comparePassword(password, existingCuration.password)) {
    const error = new Error('비밀번호가 일치하지 않습니다.');
    error.statusCode = 403;
    throw error;
  }

  // 3. 큐레이팅 데이터 업데이트
  const updatedCuration = await db.curation.update({
    where: { curationId: +curationId },
    data: {
      nickname: nickname !== undefined ? nickname : existingCuration.nickname,
      trendy: +trendy,
      personality: +personality,
      practicality: +practicality,
      costEffectiveness: +costEffectiveness,
      content,
      updatedAt: new Date(),
    },
  });

  return updatedCuration;
};

export const deleteCurationService = async (curationId, password) => {
  // 1. 큐레이팅 존재 여부 확인
  const existingCuration = await db.curation.findUnique({
    where: { curationId: +curationId },
  });

  if (!existingCuration) {
    const error = new Error('큐레이팅을 찾을 수 없습니다.');
    error.statusCode = 404;
    throw error;
  }

  // 2. 비밀번호 일치 확인 comparePassword
  if (!await comparePassword(password, existingCuration.password)) {
    const error = new Error('비밀번호가 일치하지 않습니다.');
    error.statusCode = 403;
    throw error;
  }

  // 3. 트랜잭션으로 삭제 + curationCount 감소
  await db.$transaction([
    db.curation.delete({
      where: { curationId: +curationId },
    }),
    db.style.update({
      where: { styleId: existingCuration.styleId },
      data: {
        curationCount: {
          decrement: 1,
        },
      },
    }),
  ]);

  // 4. 성공 응답
  return { message: '큐레이팅 삭제 성공' };
};
