import type { Request, Response, NextFunction } from 'express';

type HttpError = Error & { statusCode?: number };

export default class RootController {
  async handleHealthCheck (_req: Request, res: Response, next: NextFunction) {
    try {
      const status = 'OK';
      const uptime = process.uptime();
      const timestamp = new Date().toISOString();

      return res.status(200).json({ status, uptime, timestamp });
    } catch (error: unknown) {
      const err = error as HttpError;
      err.statusCode = 500;
      next(err);
    }
  };
}
