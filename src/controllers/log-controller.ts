import LogService from '../services/log-service.js';

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
