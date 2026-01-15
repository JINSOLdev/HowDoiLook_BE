import { Request, Response, NextFunction } from 'express';
import { getValidated } from '../types/validated.js';
import LogService from '../services/log.service.js';

type GetLogListQuery = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  searchBy?: string;
  keyword?: string;
};

export default class LogController {
  async handleGetLogList(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = getValidated<unknown, unknown, GetLogListQuery>(req);
      
      const params = {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: query.sortBy,
        searchBy: query.searchBy ?? null,
        keyword: query.keyword ?? null
      }

      const logList = await LogService.getLogList(params)

      return res.status(200).json(logList);
    } catch (error) {
      next(error);
    }
  }
}
