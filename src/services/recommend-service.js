import { findStylesByTagIds } from './style-service.js';
import TagService from './tag-service.js';

const tempBand = (t) => {
  if (t >= 28) return 'HOT';
  if (t >= 23) return 'WARM';
  if (t >= 17) return 'MILD';
  if (t >= 12) return 'COOL';
  if (t >= 5) return 'CHILLY';
  return 'COLD';
};

// 규칙 매핑: 상황별 태그
function buildTags({ temp, feelsLike, weather, rain1h, wind }) {
  const band = tempBand(feelsLike ?? temp);
  const tags = new Set();

  // 기본: 온도대별 베이스 태그
  const TEMPERATURE_TAGS = {
    HOT: ['linen', 'short-sleeve', 'light-fabric', 'open-toe'],
    WARM: ['t-shirt', 'cotton', 'wide-pants', 'sneakers'],
    MILD: ['light-cardigan', 'shirt', 'denim', 'loafers'],
    COOL: ['knit', 'field-jacket', 'chinos', 'sneakers'],
    CHILLY: ['sweater', 'trench', 'inner-layer', 'boots'],
    COLD: ['padding', 'wool-coat', 'thermal', 'scarf', 'boots'],
  };
  TEMPERATURE_TAGS[band].forEach((t) => tags.add(t));

  // 강수
  if (weather === 'Rain' || rain1h > 0) {
    ['waterproof', 'hood', 'goretex', 'umbrella'].forEach((t) => tags.add(t));
  }
  // 강풍
  if (wind >= 8) {
    ['windproof', 'cap', 'shorter-outer'].forEach((t) => tags.add(t));
  }
  // 맑음
  if (weather === 'Clear') {
    ['sunglasses', 'light-tone'].forEach((t) => tags.add(t));
  }

  // 공통: 계절감 (월 기준, 서버의 Asia/Seoul로 가정)
  const month = new Date().getMonth() + 1;
  if ([3, 4, 5].includes(month)) tags.add('spring');
  if ([6, 7, 8].includes(month)) tags.add('summer');
  if ([9, 10, 11].includes(month)) tags.add('autumn');
  if ([12, 1, 2].includes(month)) tags.add('winter');

  return Array.from(tags);
}

// 간단 가중치: 비/눈/바람 태그 포함 시 상위 가중
function scoreByContext(style, contextTags) {
  const tags = style.tags || []; // style.tags: ['knit','trench',...]
  const has = (t) => tags.includes(t);

  let score = 0;
  contextTags.forEach((t) => {
    if (has(t)) score += 2;
  });
  // 소프트 규칙 가점
  if (has('waterproof') || has('windproof')) score += 1;
  if (has('light-fabric') || has('thermal')) score += 1;
  return score;
}

export class RecommendService {
  static async recommendByWeather(context) {
    const contextTags = buildTags(context);

    // 태그 ID 조회 → 스타일 검색 (서비스 구현에 맞게 바꿔도 됨)
    const tagIds = await TagService.findIdsByNames(contextTags); // [1,5,9...]
    const candidates = await findStylesByTagIds(tagIds, 60);

    // 스코어링
    const ranked = candidates
      .map((s) => ({ ...s, _score: scoreByContext(s, contextTags) }))
      .sort((a, b) => b._score - a._score);

    // 상위 N개만
    const top = ranked.slice(0, 20);

    // 응답 형태(큐레이션 카드 느낌)
    return {
      context: {
        ...context,
        band: tempBand(context.feelsLike ?? context.temp),
        tags: contextTags,
      },
      items: top.map((s) => ({
        id: s.styleId,
        title: s.title,
        imageUrl:
          s.styleImages?.[0]?.image?.imageUrl ?? // ← styleImages 연결구조
          s.images?.[0]?.imageUrl ?? // ← 혹시 images를 쓰는 경우 대비
          null,
        tags: (s.styleTags || []).map((st) => st?.tag?.name).filter(Boolean),
        score: s._score,
      })),
    };
  }
}
