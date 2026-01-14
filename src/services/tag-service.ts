import db from '../config/db.js';

export default class TagService {
  static getTagList = async () => {
    const tagList = await db.tag.findMany();

    const nameArray = tagList.map((tag) => tag.name);

    return nameArray;
  };
}
