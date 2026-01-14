import db from '../config/db.js';

// 내부 상수
const PRISMA_ORDER_BY = { ASCEND: 'asc', DESCEND: 'desc' };
const PRISMA_WHERE_MODE = { INSENSITIVE: 'insensitive', SENSITIVE: undefined };
const SORT_BY = { LATEST: 'latest', OLDEST: 'oldest' };
const SEARCHABLE_KEYS = ['url', 'method', 'statusCode', 'message'];

const getWhere = (searchBy, keyword) => {
  const where = {};

  if (keyword) {
    keyword = keyword.trim();

    if (searchBy) {
      if (searchBy === 'ip') {
        where.ip = {
          contains: keyword,
          mode: PRISMA_WHERE_MODE.SENSITIVE,
        };
      } else if (SEARCHABLE_KEYS.includes(searchBy)) {
        where[searchBy] = {
          contains: keyword,
          mode: PRISMA_WHERE_MODE.SENSITIVE,
        };
      }
    } else {
      // searchBy가 없으면 모든 검색 가능한 필드에서 OR 검색
      where.OR = [
        {
          ip: {
            contains: keyword,
            mode: PRISMA_WHERE_MODE.SENSITIVE,
          },
        },
        ...SEARCHABLE_KEYS.map((key) => ({
          [key]: {
            contains: keyword,
            mode: PRISMA_WHERE_MODE.SENSITIVE,
          },
        })),
      ];
    }
  }

  return where;
};

export default class LogService {
  static getLogList = async ({ page = 1, pageSize = 10, sortBy = '', searchBy, keyword }) => {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const orderBy =
      sortBy === SORT_BY.OLDEST ? { createdAt: PRISMA_ORDER_BY.ASCEND } : { createdAt: PRISMA_ORDER_BY.DESCEND };

    const where = getWhere(searchBy, keyword);

    const [totalItemCount, logList] = await Promise.all([
      db.log.count({ where }),
      db.log.findMany({
        skip,
        take,
        orderBy,
        where,
      }),
    ]);

    const fixedLogList = logList.map(({ logId, ...other }) => ({
      id: logId,
      ...other,
    }));

    return {
      totalItemCount,
      data: fixedLogList,
    };
  };
}
