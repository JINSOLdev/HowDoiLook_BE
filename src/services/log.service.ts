import type { Prisma, Log } from '@prisma/client';
import db from '../config/db.js';

// 내부 상수
const PRISMA_ORDER_BY = { ASCEND: 'asc', DESCEND: 'desc' } as const;
const PRISMA_WHERE_MODE = { INSENSITIVE: 'insensitive', SENSITIVE: undefined } as const;
const SORT_BY = { LATEST: 'latest', OLDEST: 'oldest' } as const;
const SEARCHABLE_KEYS = ['url', 'method', 'statusCode', 'message'] as const;

type LogSortBy = (typeof SORT_BY)[keyof typeof SORT_BY];
type LogSearchBy = 'ip' | (typeof SEARCHABLE_KEYS)[number];

type GetLogListQuery = {
  page?: number | string;
  pageSize?: number | string;
  sortBy?: LogSortBy | string;
  searchBy?: LogSearchBy | string;
  keyword?: string;
};

type LogListItem = Omit<Log, 'logId'> & { id: Log['logId'] };

type GetLogListResult = {
  totalItemCount: number;
  data: LogListItem[];
};

const getWhere = (searchBy?: string, keyword?: string): Prisma.LogWhereInput => {
  const where: Prisma.LogWhereInput = {};

  if (!keyword) return where;

  const trimmed = keyword.trim();
  if (!trimmed) return where;

  // searchBy가 명시된 경우: 해당 필드만 contains 검색
  if (searchBy) {
    if (searchBy === 'ip') {
      where.ip = {
        contains: trimmed,
        mode: PRISMA_WHERE_MODE.SENSITIVE,
      };
    } else if ((SEARCHABLE_KEYS as readonly string[]).includes(searchBy)) {
      // Prisma는 문자열 키 접근이 가능하지만 TS에선 인덱싱 타입이 필요해서 캐스팅 처리
      (where as Record<string, unknown>)[searchBy] = {
        contains: trimmed,
        mode: PRISMA_WHERE_MODE.SENSITIVE,
      };
    }
    return where;
  }

  // searchBy가 없으면: OR로 전체 필드 검색
  where.OR = [
    {
      ip: {
        contains: trimmed,
        mode: PRISMA_WHERE_MODE.SENSITIVE,
      },
    },
    ...SEARCHABLE_KEYS.map((key) => ({
      [key]: {
        contains: trimmed,
        mode: PRISMA_WHERE_MODE.SENSITIVE,
      },
    })),
  ];

  return where;
};

export default class LogService {
  static getLogList = async (query: GetLogListQuery): Promise<GetLogListResult> => {
    const parsedPage = Number(query.page ?? 1);
    const parsedPageSize = Number(query.pageSize ?? 10);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const pageSize = Number.isFinite(parsedPageSize) && parsedPageSize >= 0 ? parsedPageSize : 10;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const sortBy = String(query.sortBy ?? '');
    const orderBy: Prisma.LogOrderByWithRelationInput =
      sortBy === SORT_BY.OLDEST ? { createdAt: PRISMA_ORDER_BY.ASCEND } : { createdAt: PRISMA_ORDER_BY.DESCEND };

    const where = getWhere(query.searchBy ? String(query.searchBy) : undefined, query.keyword);

    const [totalItemCount, logList] = await Promise.all([
      db.log.count({ where }),
      db.log.findMany({
        skip,
        take,
        orderBy,
        where,
      }),
    ]);

    const fixedLogList: LogListItem[] = logList.map(({ logId, ...other }) => ({
      id: logId,
      ...other,
    }));

    return {
      totalItemCount,
      data: fixedLogList,
    };
  };
}
