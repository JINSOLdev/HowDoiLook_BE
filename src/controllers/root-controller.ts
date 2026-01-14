export default class RootController {
  static handleHealthCheck = async (_req, res, next) => {
    try {
      const status = 'OK';
      const uptime = process.uptime();
      const timestamp = new Date().toISOString();
      res.status(200).json({
        status,
        uptime,
        timestamp,
      });
    } catch (error) {
      error.statusCode = 500;
      next(error);
    }
  };
}
