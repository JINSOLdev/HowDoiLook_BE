/**
 * 프로그램의 시작점 (entry point)
 * Server 클래스를 생성하고 실행만 함
 **/
import dotenv from 'dotenv';
import Server from './src/server.ts';
import { readSwaggerJson } from './src/middlewares/swagger-middleware.ts';

async function main(): Promise<void> {
  try {
    dotenv.config();

    await readSwaggerJson();

    const server = new Server();
    server.run();
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
}

void main();
