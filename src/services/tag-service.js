import db from '../config/db.js';

export default class TagService {
  static getTagList = async () => {
    const tagList = await db.tag.findMany();

    const nameArray = tagList.map((tag) => tag.name);

    return nameArray;
  };

  // 이름 배열로 tagId 배열 찾기
  static findIdsByNames = async (names = []) => {
    if (!names.length) return [];

    const tags = await db.tag.findMany({
      where: { name: { in: names } },
      select: { tagId: true, name: true },
    });

    return tags.map((t) => t.tagId);
  };
}
