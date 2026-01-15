import LogService from '../services/log-service.ts';

export default class LogController {
  static handleGetLogList = async (req, res, next) => {
    try {
      const logList = await LogService.getLogList(req.validated.query);

      res.status(200).json(logList);
    } catch (error) {
      next(error);
    }
  };
}
