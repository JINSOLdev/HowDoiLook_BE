import TagService from '../services/tag-service.js';

export default class TagController {
  static handleGetTagList = async (_req, res, next) => {
    try {
      const tagList = await TagService.getTagList();

      res.status(200).json({ tags: tagList });
    } catch (error) {
      next(error);
    }
  };
}
