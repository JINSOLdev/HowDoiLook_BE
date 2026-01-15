import type { ErrorRequestHandler } from 'express';
import db from '../config/db.js';

const statusMessages: Record<number, string> = {
  100: '계속 진행해도 좋습니다',
  101: '프로토콜을 전환합니다',
  102: '처리 중입니다',
  103: '미리 헤더를 제공합니다',

  300: '여러 선택지가 있습니다',
  301: '영구적으로 이동되었습니다',
  302: '임시로 이동되었습니다',
  303: '다른 위치에서 확인이 필요합니다',
  304: '변경된 내용이 없습니다',
  305: '프록시를 사용해야 합니다',
  306: '사용되지 않는 상태 코드입니다',
  307: '임시로 리다이렉트됩니다',
  308: '영구적으로 리다이렉트됩니다',

  400: '잘못된 요청입니다',
  401: '로그인이 필요합니다',
  402: '결제가 필요합니다',
  403: '비밀번호가 틀렸습니다',
  404: '존재하지 않습니다',
  405: '허용되지 않는 요청 방식입니다',
  406: '허용되지 않는 형식입니다',
  407: '프록시 인증이 필요합니다',
  408: '요청 시간이 초과되었습니다',
  409: '충돌이 발생했습니다',
  410: '삭제된 리소스입니다',
  411: '길이 정보가 필요합니다',
  412: '조건이 맞지 않습니다',
  413: '요청 크기가 너무 큽니다',
  414: 'URI 주소가 너무 깁니다',
  415: '지원하지 않는 형식입니다',
  416: '범위를 처리할 수 없습니다',
  417: '요청 조건을 만족하지 못했습니다',
  418: '저는 찻주전자입니다',
  421: '잘못된 서버에 요청했습니다',
  422: '요청을 처리할 수 없습니다',
  426: '업그레이드가 필요합니다',
  428: '조건이 필요한 요청입니다',
  429: '요청이 너무 많습니다',
  431: '요청 헤더가 너무 큽니다',
  451: '법적인 이유로 접근할 수 없습니다',

  500: '서버 오류가 발생했습니다',
  501: '기능이 구현되지 않았습니다',
  502: '게이트웨이 오류입니다',
  503: '서비스를 사용할 수 없습니다',
  504: '응답 시간이 초과되었습니다',
  505: '지원하지 않는 HTTP 버전입니다',
  506: '협상 중 오류가 발생했습니다',
  507: '저장 공간이 부족합니다',
  508: '무한 루프가 감지되었습니다',
  510: '추가 확장이 필요합니다',
  511: '네트워크 인증이 필요합니다',
};

type AppError = Error & { statusCode?: number };

const responseErrorDev = (error: AppError, req: any, statusCode: number, message: string): void => {
  const response = {
    statusCode,
    message,
    time: new Date().toISOString(),
    name: error.name,
    stack: error.stack,
    ip: req.ip,
    url: req.originalUrl,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers,
  };

  console.error(response);
};

const responseErrorService = (res: any, statusCode: number, message: string): void => {
  res.status(statusCode).json({ message });
};

const saveLogToDatabase = async (req: any, statusCode: number, message: string): Promise<void> => {
  const url = req.originalUrl || req.url || 'unknown';
  const method = req.method;
  const ip = req.ip || req.headers['x-forwarded-for'];

  await db.log.create({
    data: { ip, url, method, statusCode: String(statusCode), message },
  });
};

const errorHandler: ErrorRequestHandler = async (error, req, res, _next) => {
  const e = error as AppError;

  let statusCode = e.statusCode ?? 500;

  if (statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  const message = statusMessages[statusCode] || '서버 오류가 발생했습니다';

  await saveLogToDatabase(req, statusCode, message);

  responseErrorDev(e, req, statusCode, message);

  responseErrorService(res, statusCode, message);
};

export default errorHandler;
