import type { Request } from 'express';

export type Validated<B, P = unknown, Q = unknown> = {
  body: B;
  params: P;
  query: Q;
};

//dto-middleware가 req.validated를 항상 세팅한다고 가정하고, 컨트롤러에서 타입만 좁혀 쓰기 위한 헬퍼
export function getValidated<B, P = unknown, Q = unknown>(req: Request): Validated<B, P, Q> {
  if (!req.validated) {
    // dto-middleware가 누락된 라우트에서 빠르게 발견하도록 런타임 방어
    const err = new Error('validated payload is missing. Did you forget dto-middleware?');
    err.statusCode = 500;
    throw err;
  }

  return {
    body: req.validated.body as B,
    params: req.validated.params as P,
    query: req.validated.query as Q,
  };
}
