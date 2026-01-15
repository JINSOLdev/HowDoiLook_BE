import { Request, Response, NextFunction } from 'express';
import TagService from '../services/tag.service.js';

export default class TagController {
  static handleGetTagList(arg0: string, handleGetTagList: any) {
      throw new Error('Method not implemented.');
  }
  async handleGetTagList (_req: Request, res: Response, next: NextFunction) {
    try {
      const tagList = await TagService.getTagList();
      return res.status(200).json({ tags: tagList });
    } catch (error) {
      next(error);
    }
  };
}
