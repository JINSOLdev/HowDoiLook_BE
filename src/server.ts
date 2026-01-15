import express, { type Application, type RequestHandler, type ErrorRequestHandler } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';

import curationRouter from './routes/curation.route.js';
import commentRouter from './routes/comment.route.js';
import styleRouter from './routes/style.route.js';
import imageRouter from './routes/image.route.js';
import rankRouter from './routes/rank.route.js';
import rootRouter from './routes/root.route.js';
import tagRouter from './routes/tag.route.js';
import logRouter from './routes/log.route.js';
import docRouter from './routes/doc.route.js';

import uploadsDir from './config/uploads.path.js';
import errorHandler from './middlewares/error.middleware.js';

function getPort(envValue: string | undefined, fallback: number): number {
  const number = Number(envValue);
  return Number.isFinite(number) ? number : fallback;
}

export default class Server {
  #app: Application;
  #port: number;

  constructor() {
    this.#app = express(); 
    this.#port = getPort(process.env.EXPRESS_PORT, 5000);

    this.#initializePreMiddlewares();
    this.#initializeRouters();
    this.#initializePostMiddlewares();
  }

  #initializePreMiddlewares(): void {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true});
      console.log(`uploads 폴더 생성`);
    }

    this.#app.use(cors());
    this.#app.use(morgan('dev'));
    this.#app.use(express.json());
    this.#app.use(express.urlencoded({ extended: true }));
    this.#app.use('/images/upload', express.static(uploadsDir));
  }

  // 라우터 등록
  #initializeRouters(): void {
    this.#app.use('/', rootRouter);
    this.#app.use('/images', imageRouter);
    this.#app.use('/ranking', rankRouter);
    this.#app.use('/tags', tagRouter);
    this.#app.use('/styles', styleRouter);
    this.#app.use('/curations', curationRouter);
    this.#app.use('/comments', commentRouter);
    this.#app.use('/logs', logRouter);
    this.#app.use('/docs', docRouter);
  }

  // 에러 핸들러 등록
  #initializePostMiddlewares(): void {
    // errorHandler가 Express 에러 미들웨어 시그니처를 만족한다고 가정
    this.#app.use(errorHandler as ErrorRequestHandler);
  }

  run(): void {
    this.#app.listen(this.#port, () => {
      console.log(`server is running at http://localhost:${this.#port}`);
    });
  }
}
