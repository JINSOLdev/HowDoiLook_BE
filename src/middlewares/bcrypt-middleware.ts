import { hashPassword } from '../utils/hash-password.js';

export const hashPasswordMiddleware = async (req, _res, next) => {
  try {
    const body = req.validated?.body;
    
    if (body.password) {
      body.password = await hashPassword(body.password);
    }

    next();
  } catch (error) {
    next(error);
  }
};