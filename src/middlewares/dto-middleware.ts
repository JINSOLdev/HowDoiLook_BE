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
  define,
  StructError,
} from 'superstruct';

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------
const ID_MIN = 1;
const PAGE_MIN = 1;
const PAGE_SIZE_MIN = 0;
const SORT_BY_STYLE_ENUMS = {
  LATEST: 'latest',
  MOST_VIEWED: 'mostViewed',
  MOST_CURATED: 'mostCurated',
};
const SORT_BY_LOG_ENUMS = {
  LATEST: 'latest',
  OLDEST: 'oldest',
};
const SEARCH_BY_STYLE_ENUMS = {
  NICKNAME: 'nickname',
  TITLE: 'title',
  CONTENT: 'content',
  TAG: 'tag',
};
const SEARCH_BY_CURATION_ENUMS = {
  NICKNAME: 'nickname',
  CONTENT: 'content',
};
const SEARCH_BY_LOG_ENUMS = {
  IP: 'ip',
  MESSAGE: 'message',
  METHOD: 'method',
  URL: 'url',
  STATUS_CODE: 'statusCode',
  CREATED_AT: 'createdAt',
};
const RANK_BY_ENUMS = {
  TOTAL: 'total',
  TRENDY: 'trendy',
  PERSONALITY: 'personality',
  PRACTICALITY: 'practicality',
  COST_EFFECTIVENESS: 'costEffectiveness',
};
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
const TRENDY_MIN = 0;
const PERSONALITY_MIN = 0;
const PRACTICALITY_MIN = 0;
const COST_EFFECTIVENESS_MIN = 0;

// ----------------------------------------------------------
// UTILS
// ----------------------------------------------------------
// STRING 을 INTEGER 로 변환(FLOAT 방지)
const stringToInteger = (value) => {
  const integer = Number(value);
  if (!Number.isInteger(integer)) {
    throw new Error(`${value} is not an integer`);
  }
  return integer;
};

// ----------------------------------------------------------
// COERCE 자료형
// ----------------------------------------------------------
const integer = coerce(number(), string(), stringToInteger);

// ----------------------------------------------------------
// 파라미터 정의
// ----------------------------------------------------------
const id = min(integer, ID_MIN);
const page = min(integer, PAGE_MIN);
const pageSize = min(integer, PAGE_SIZE_MIN);
const sortByStyle = enums(Object.values(SORT_BY_STYLE_ENUMS));
const sortByLog = enums(Object.values(SORT_BY_LOG_ENUMS));
const searchByStyle = enums(Object.values(SEARCH_BY_STYLE_ENUMS));
const searchByCuration = enums(Object.values(SEARCH_BY_CURATION_ENUMS));
const searchByLog = enums(Object.values(SEARCH_BY_LOG_ENUMS));
const rankBy = enums(Object.values(RANK_BY_ENUMS));
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
const trendy = min(integer, TRENDY_MIN);
const personality = min(integer, PERSONALITY_MIN);
const practicality = min(integer, PRACTICALITY_MIN);
const costEffectiveness = min(integer, COST_EFFECTIVENESS_MIN);

// NESTED PARAMETER
const category = object({
  name: name,
  brand: brand,
  price: price,
});
const categories = object({
  top: optional(category),
  bottom: optional(category),
  outer: optional(category),
  dress: optional(category),
  shoes: optional(category),
  bag: optional(category),
  accessory: optional(category),
});

// ----------------------------------------------------------
// 스키마 객체 정의
// ----------------------------------------------------------
// POST:STYLE
export const createStyleSchema = {
  body: object({
    nickname: nickname,
    title: title,
    content: content,
    password: password,
    categories: categories,
    tags: optional(tags),
    imageUrls: optional(imageUrls),
  }),
  query: object({}),
  params: object({}),
};
// GET:STYLE_LIST
export const getStyleListSchema = {
  body: object({}),
  query: object({
    page: optional(page),
    pageSize: optional(pageSize),
    sortBy: optional(sortByStyle),
    searchBy: optional(searchByStyle),
    keyword: optional(keyword),
    tag: optional(tag),
  }),
  params: object({}),
};
// PUT:STYLE
export const updateStyleSchema = {
  body: object({
    nickname: nickname,
    password: password,
    title: title,
    content: content,
    categories: categories,
    tags: tags,
    imageUrls: imageUrls,
  }),
  query: object({}),
  params: object({
    styleId: id,
  }),
};
// DELETE:STYLE
export const deleteStyleSchema = {
  body: object({
    password: password,
  }),
  query: object({}),
  params: object({
    styleId: id,
  }),
};
// GET:STYLE
export const getStyleDetailSchema = {
  body: object({}),
  query: object({}),
  params: object({
    styleId: id,
  }),
};
// GET:RANKING
export const getRankingListSchema = {
  body: object({}),
  query: object({
    page: optional(page),
    pageSize: optional(pageSize),
    rankBy: optional(rankBy),
  }),
  params: object({}),
};
// POST:CURATION
export const createCurationSchema = {
  body: object({
    nickname: nickname,
    content: content,
    password: password,
    trendy: trendy,
    personality: personality,
    practicality: practicality,
    costEffectiveness: costEffectiveness,
  }),
  query: object({}),
  params: object({
    styleId: id,
  }),
};
// GET:CURATION_LIST
export const getCurationListSchema = {
  body: object({}),
  query: object({
    page: optional(page),
    pageSize: optional(pageSize),
    searchBy: optional(searchByCuration),
    keyword: optional(keyword),
  }),
  params: object({
    styleId: id,
  }),
};
// PUT:CURATION
export const updateCurationSchema = {
  body: object({
    nickname: nickname,
    content: content,
    password: password,
    trendy: trendy,
    personality: personality,
    practicality: practicality,
    costEffectiveness: costEffectiveness,
  }),
  query: object({}),
  params: object({
    curationId: id,
  }),
};
// DELETE:CURATION
export const deleteCurationSchema = {
  body: object({
    password: password,
  }),
  query: object({}),
  params: object({
    curationId: id,
  }),
};
// POST:COMMENT
export const createCommentSchema = {
  body: object({
    content: content,
    password: password,
  }),
  query: object({}),
  params: object({
    curationId: id,
  }),
};
// PUT:COMMENT
export const updateCommentSchema = {
  body: object({
    content: content,
    password: password,
  }),
  query: object({}),
  params: object({
    commentId: id,
  }),
};
// DELETE:COMMENT
export const deleteCommentSchema = {
  body: object({
    password: password,
  }),
  query: object({}),
  params: object({
    commentId: id,
  }),
};
// GET:LOG_LIST
export const getLogListSchema = {
  body: object({}),
  query: object({
    page: optional(page),
    pageSize: optional(pageSize),
    sortBy: optional(sortByLog),
    searchBy: optional(searchByLog),
    keyword: optional(keyword),
  }),
  params: object({}),
};

// ----------------------------------------------------------
// 검증 미들웨어
// ----------------------------------------------------------
// CURRYING | MIDDLEWARE FACTORY 패턴
export const validateRequest = (schema = {}) => {
  return async (req = {}, _res = {}, next) => {
    try {
      req.validated = {
        body: schema.body ? create(req.body ?? {}, schema.body) : undefined,
        query: schema.query ? create(req.query ?? {}, schema.query) : undefined,
        params: schema.params ? create(req.params ?? {}, schema.params) : undefined,
      };

      // NEXT TO CONTROLLER
      next();
    } catch (error) {
      console.log('validateRequest error:', error);
      if (error instanceof StructError) {
        error.statusCode = 400;
        error.message = undefined;
      }
      // NEXT TO ERROR
      next(error);
    }
  };
};

// 필요 시 객체로도 가져가서 사용할 수 있습니다.
export default {
  validateRequest,
  // STYLE
  createStyleSchema,
  getStyleListSchema,
  updateStyleSchema,
  getStyleDetailSchema,
  deleteStyleSchema,
  // RANKING
  getRankingListSchema,
  // CURATION
  createCurationSchema,
  getCurationListSchema,
  updateCurationSchema,
  deleteCurationSchema,
  // COMMENT
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
  // LOG
  getLogListSchema,
};
