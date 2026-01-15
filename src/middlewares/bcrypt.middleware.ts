import type { RequestHandler } from 'express';
import { hashPassword } from '../utils/hash.password.ts';

export const hashPasswordMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const body = req.validated?.body as { password?: string } | undefined;

    if (body?.password) {
      body.password = await hashPassword(body.password);
    }

    next();
  } catch (error) {
    next(error);
  }
};
