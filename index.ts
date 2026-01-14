/**
 * 프로그램의 시작점 (entry point)
 * Server 클래스를 생성하고 실행만 함
**/
import dotenv from 'dotenv';
import Server from './src/server.ts';
import { readSwaggerJson } from './src/middlewares/swagger-middleware.js';

const main = async () => {
  dotenv.config();

  await readSwaggerJson();

  const server = new Server();  // 객체(인스턴스) 생성
  server.run();  // 객체 기능 실행
};

main();
