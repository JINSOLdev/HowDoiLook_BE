// 서버 실행

import dotenv from 'dotenv';
import Server from './src/server.js';
import { readSwaggerJson } from './src/middlewares/swagger-middleware.js';

const main = async () => {
  dotenv.config();

  await readSwaggerJson();

  const server = new Server();
  server.run();
};

main();
