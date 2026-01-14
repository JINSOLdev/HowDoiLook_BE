import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

// 상태 코드에 따른 메시지 정의 객체
// API 명세서에 정의된 상태 코드(400, 403, 404)
// 나머지는 MDN 을 바탕으로 정의합니다.
const statusMessages = {
  // 1xx: 정보 응답
  100: '계속 진행해도 좋습니다', // 요청의 일부를 받았으며 나머지를 계속 요청하라는 의미
  101: '프로토콜을 전환합니다', // 프로토콜 전환을 허용함
  102: '처리 중입니다', // 서버가 요청을 수신했으며 처리 중 (WebDAV)
  103: '미리 헤더를 제공합니다', // 본 응답 전에 미리 헤더 힌트를 제공

  // 3xx: 리다이렉션
  300: '여러 선택지가 있습니다', // 요청에 여러 응답이 가능함
  301: '영구적으로 이동되었습니다', // 요청한 리소스가 영구적으로 이동됨
  302: '임시로 이동되었습니다', // 요청한 리소스가 일시적으로 다른 URI에 존재함
  303: '다른 위치에서 확인이 필요합니다', // 다른 URI를 통해 리소스를 요청하라는 의미
  304: '변경된 내용이 없습니다', // 캐시된 리소스가 변경되지 않음
  305: '프록시를 사용해야 합니다', // 요청은 프록시를 통해 접근해야 함 (현재는 거의 사용 안 함)
  306: '사용되지 않는 상태 코드입니다', // 예약 상태 코드 (현재 사용되지 않음)
  307: '임시로 리다이렉트됩니다', // 임시로 리다이렉트됨. 메서드는 변경되지 않음
  308: '영구적으로 리다이렉트됩니다', // 영구적으로 리다이렉트됨. 메서드도 유지됨

  // 4xx: 클라이언트 오류
  400: '잘못된 요청입니다', // 잘못된 요청
  401: '로그인이 필요합니다', // 인증 필요
  402: '결제가 필요합니다', // 결제 필요 (실제로 거의 사용되지 않음)
  403: '비밀번호가 틀렸습니다', // 서버가 요청을 이해했지만 거부함
  404: '존재하지 않습니다', // 요청한 리소스를 찾을 수 없음
  405: '허용되지 않는 요청 방식입니다', // 지원하지 않는 HTTP 메서드 사용
  406: '허용되지 않는 형식입니다', // 요청한 리소스가 허용된 형식이 아님
  407: '프록시 인증이 필요합니다', // 프록시 인증 필요
  408: '요청 시간이 초과되었습니다', // 요청 시간 초과
  409: '충돌이 발생했습니다', // 요청 충돌 (예: 중복 데이터)
  410: '삭제된 리소스입니다', // 리소스가 영구적으로 삭제됨
  411: '길이 정보가 필요합니다', // Content-Length 헤더가 필요함
  412: '조건이 맞지 않습니다', // 사전 조건 실패
  413: '요청 크기가 너무 큽니다', // 요청 본문이 너무 큼
  414: 'URI 주소가 너무 깁니다', // URI가 너무 김
  415: '지원하지 않는 형식입니다', // 지원하지 않는 미디어 타입
  416: '범위를 처리할 수 없습니다', // 요청한 범위를 처리할 수 없음
  417: '요청 조건을 만족하지 못했습니다', // Expect 헤더 요구사항 실패
  418: '저는 찻주전자입니다', // 나는 찻주전자입니다 (개그용, RFC 2324)
  421: '잘못된 서버에 요청했습니다', // 잘못된 서버로 라우팅된 요청
  422: '요청을 처리할 수 없습니다', // 구문은 맞지만 처리 불가 (예: 유효성 실패)
  426: '업그레이드가 필요합니다', // 클라이언트가 프로토콜 업그레이드 필요
  428: '조건이 필요한 요청입니다', // 조건부 요청이 필요함
  429: '요청이 너무 많습니다', // 너무 많은 요청을 보냄 (Rate limiting)
  431: '요청 헤더가 너무 큽니다', // 헤더 필드가 너무 큼
  451: '법적인 이유로 접근할 수 없습니다', // 법적 이유로 접근 불가

  // 5xx: 서버 오류
  500: '서버 오류가 발생했습니다', // 내부 서버 오류
  501: '기능이 구현되지 않았습니다', // 서버가 해당 기능을 지원하지 않음
  502: '게이트웨이 오류입니다', // 게이트웨이/프록시 서버 오류
  503: '서비스를 사용할 수 없습니다', // 서버가 일시적으로 사용 불가
  504: '응답 시간이 초과되었습니다', // 게이트웨이 응답 지연
  505: '지원하지 않는 HTTP 버전입니다', // 지원되지 않는 HTTP 버전 사용
  506: '협상 중 오류가 발생했습니다', // 콘텐츠 협상 오류
  507: '저장 공간이 부족합니다', // 저장소 부족 (WebDAV)
  508: '무한 루프가 감지되었습니다', // 무한 루프 감지됨 (WebDAV)
  510: '추가 확장이 필요합니다', // 추가 확장이 필요함
  511: '네트워크 인증이 필요합니다', // 네트워크 인증 필요 (예: Wi-Fi 로그인)
};

// DEV 용 에러 반환 메서드
const responseErrorDev = (error = {}, req = {}, statusCode = 500, message = '') => {
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

// SERVICE 용 에러 반환 메서드
const responseErrorService = (res = {}, statusCode = 500, message = '') => {
  const response = {
    message: message,
  };

  res.status(statusCode).json(response);
};

const saveLogToDatabse = async (req = {}, statusCode = '', message = '') => {
  const url = req.originalUrl || req.url || 'unknown';
  const method = req.method;
  const ip = req.ip || req.headers['x-forwarded-for'];


  await db.log.create({
    data: { ip, url, method, statusCode: String(statusCode), message },
  });
};

// 글로벌 에러 핸들러
const errorHandler = async (error, req, res, _next) => {
  let statusCode = error.statusCode || 500;

  // 비정상적인 statusCode 처리
  if (statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  // API 명세서 [심화 요구 사항]
  // 일관된 에러처리 구현을 따라서 message 를 글로벌 에러 핸들러가 제어합니다.
  // 기존 message 가 있는 경우에도 덮어씌웁니다.
  // 예외사항은 없어야 하지만 혹시 모르기 때문에 기본값을 지정합니다.
  const message = statusMessages[statusCode] || '서버 오류가 발생했습니다';

  // LOG 저장
  await saveLogToDatabse(req, statusCode, message);

  // DEV 로그
  responseErrorDev(error, req, statusCode, message);

  // 사용자 응답
  responseErrorService(res, statusCode, message);
};

export default errorHandler;
