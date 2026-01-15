import type { RequestHandler } from 'express';
import {
  object,
  optional,
  string,
  size,
  coerce,
  number,
  enums,
  min,
  array,
  create,
  StructError,
  type Struct,
} from 'superstruct';

// CONSTANTS
const ID_MIN = 1;
const PAGE_MIN = 1;
const PAGE_SIZE_MIN = 1; 

// enums는 string literal 배열로
const SortByStyle = enums(['latest', 'mostViewed', 'mostCurated'] as const);
const SortByLog = enums(['latest', 'oldest'] as const);

const SearchByStyle = enums(['nickname', 'title', 'content', 'tag'] as const);
const SearchByCuration = enums(['nickname', 'content'] as const);
const SearchByLog = enums(['ip', 'message', 'method', 'url', 'statusCode', 'createdAt'] as const);

const RankBy = enums(['total', 'trendy', 'personality', 'practicality', 'costEffectiveness'] as const);

const KEYWORD_MIN = 0;
const KEYWORD_MAX = 32;
const NICKNAME_MIN = 1;
const NICKNAME_MAX = 32;
const TAG_MIN = 0;
const TAG_MAX = 16;
const TITLE_MIN = 1;
const TITLE_MAX = 64;
const CONTENT_MIN = 1;
const CONTENT_MAX = 256;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 16;
const NAME_MIN = 1;
const NAME_MAX = 64;
const BRAND_MIN = 1;
const BRAND_MAX = 64;
const PRICE_MIN = 0;
const IMAGE_URL_MIN = 1;
const IMAGE_URL_MAX = 2048;
const SCORE_MIN = 0;

// UTILS
function firstQueryValue(value: unknown): unknown {
  // express query는 string | string[] | undefined 형태가 될 수 있음
  return Array.isArray(value) ? value[0] : value;
}

function toInt(value: unknown): number {
  const v = firstQueryValue(value);

  // 숫자로 들어오는 경우도 처리(예: 테스트 코드/직접 주입)
  if (typeof v === 'number' && Number.isInteger(v)) return v;

  if (typeof v !== 'string') {
    throw new Error(`Expected string/number, got ${typeof v}`);
  }

  const n = Number(v);
  if (!Number.isInteger(n)) {
    throw new Error(`${v} is not an integer`);
  }
  return n;
}

// COERCE
// 주의: coerce의 "input struct"가 string()이라서 숫자로 들어오면 막힘.
const integer = coerce(number(), string(), toInt);
// 숫자도 허용하고 싶으면 superstruct union/unknown으로 확장하는 버전이 더 안전함.

// PRIMITIVES
const id = min(integer, ID_MIN);
const page = min(integer, PAGE_MIN);
const pageSize = min(integer, PAGE_SIZE_MIN);

const keyword = size(string(), KEYWORD_MIN, KEYWORD_MAX);
const tag = size(string(), TAG_MIN, TAG_MAX);
const tags = array(tag);

const nickname = size(string(), NICKNAME_MIN, NICKNAME_MAX);
const title = size(string(), TITLE_MIN, TITLE_MAX);
const content = size(string(), CONTENT_MIN, CONTENT_MAX);
const password = size(string(), PASSWORD_MIN, PASSWORD_MAX);

const name = size(string(), NAME_MIN, NAME_MAX);
const brand = size(string(), BRAND_MIN, BRAND_MAX);
const price = min(integer, PRICE_MIN);

const imageUrl = size(string(), IMAGE_URL_MIN, IMAGE_URL_MAX);
const imageUrls = array(imageUrl);

const score = min(integer, SCORE_MIN);

// NESTED
const category = object({ name, brand, price });

const categories = object({
  top: optional(category),
  bottom: optional(category),
  outer: optional(category),
  dress: optional(category),
  shoes: optional(category),
  bag: optional(category),
  accessory: optional(category),
});

// COMMON
const Empty = object({});

type RequestSchema = {
  body?: Struct<unknown>;
  query?: Struct<unknown>;
  params?: Struct<unknown>;
};

function createSchema(schema: RequestSchema): RequestSchema {
  return {
    body: schema.body ?? Empty,
    query: schema.query ?? Empty,
    params: schema.params ?? Empty,
  };
}

// SCHEMAS
export const createStyleSchema = createSchema({
  body: object({
    nickname,
    title,
    content,
    password,
    categories,
    tags: optional(tags),
    imageUrls: optional(imageUrls),
  }),
});

export const getStyleListSchema = createSchema({
  query: object({
    page: optional(page),
    pageSize: optional(pageSize),
    sortBy: optional(SortByStyle),
    searchBy: optional(SearchByStyle),
    keyword: optional(keyword),
    tag: optional(tag),
  }),
});

export const updateStyleSchema = createSchema({
  body: object({
    nickname,
    password,
    title: optional(title), 
    content: optional(content), 
    categories: optional(categories),
    tags: optional(tags),
    imageUrls: optional(imageUrls),
  }),
  params: object({ styleId: id }),
});

export const deleteStyleSchema = createSchema({
  body: object({ password }),
  params: object({ styleId: id }),
});

export const getStyleDetailSchema = createSchema({
  params: object({ styleId: id }),
});

export const getRankingListSchema = createSchema({
  query: object({
    page: optional(page),
    pageSize: optional(pageSize),
    rankBy: optional(RankBy),
  }),
});

export const createCurationSchema = createSchema({
  body: object({
    nickname,
    content,
    password,
    trendy: score,
    personality: score,
    practicality: score,
    costEffectiveness: score,
  }),
  params: object({ styleId: id }),
});

export const getCurationListSchema = createSchema({
  query: object({
    page: optional(page),
    pageSize: optional(pageSize),
    searchBy: optional(SearchByCuration),
    keyword: optional(keyword),
  }),
  params: object({ styleId: id }),
});

export const updateCurationSchema = createSchema({
  body: object({
    nickname: optional(nickname),
    content: optional(content),
    password,
    trendy: optional(score),
    personality: optional(score),
    practicality: optional(score),
    costEffectiveness: optional(score),
  }),
  params: object({ curationId: id }),
});

export const deleteCurationSchema = createSchema({
  body: object({ password }),
  params: object({ curationId: id }),
});

export const createCommentSchema = createSchema({
  body: object({ content, password }),
  params: object({ curationId: id }),
});

export const updateCommentSchema = createSchema({
  body: object({ content: optional(content), password }),
  params: object({ commentId: id }),
});

export const deleteCommentSchema = createSchema({
  body: object({ password }),
  params: object({ commentId: id }),
});

export const getLogListSchema = createSchema({
  query: object({
    page: optional(page),
    pageSize: optional(pageSize),
    sortBy: optional(SortByLog),
    searchBy: optional(SearchByLog),
    keyword: optional(keyword),
  }),
});

// VALIDATOR (Middleware Factory)
export const validateRequest = (schema: RequestSchema = {}): RequestHandler => {
  const finalSchema = createSchema(schema);

  return (req, _res, next) => {
    try {
      req.validated = {
        body: finalSchema.body ? create(req.body ?? {}, finalSchema.body) : undefined,
        query: finalSchema.query ? create(req.query ?? {}, finalSchema.query) : undefined,
        params: finalSchema.params ? create(req.params ?? {}, finalSchema.params) : undefined,
      };

      next();
    } catch (error) {
      if (error instanceof StructError) {
        (error as StructError & { statusCode?: number; message?: string }).statusCode = 400;
        (error as StructError & { message?: string }).message = '';
      }
      next(error);
    }
  };
};

export default {
  validateRequest,
  createStyleSchema,
  getStyleListSchema,
  updateStyleSchema,
  getStyleDetailSchema,
  deleteStyleSchema,
  getRankingListSchema,
  createCurationSchema,
  getCurationListSchema,
  updateCurationSchema,
  deleteCurationSchema,
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
  getLogListSchema,
};
