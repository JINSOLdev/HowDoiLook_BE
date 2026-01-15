declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }

    interface Error {
      statusCode?: number;
    }
  }
}

export {};
