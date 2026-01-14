import express from "express"
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';

import curationRouter from './routes/curation-routes.js';
import commentRouter from './routes/comment-route.js';
import styleRouter from './routes/style-route.js';
import imageRouter from './routes/image-route.js';
import rankRouter from './routes/rank-route.js';
import rootRouter from './routes/root-route.js';
import tagRouter from './routes/tag-route.js';
import logRouter from './routes/log-route.js';
import docRouter from './routes/doc-route.js';

import uploadsDir from './config/uploads-path.js';

import errorHandler from './middlewares/error-middleware.js';

/**
 * Express 앱을 실제로 만들고, 설정하고, 실행하는 본체
 * Server 라는 클래스로 앱 실행 로직을 감싸놓음
 * 앱 실행 책임을 Server라는 객체 하나에 몰아넣은 구조임 -> 책임 분리 + 확장성 수월해짐
 */
export default class Server {
  #app;
  #port;

  /**
   * new Server() 할 때 실행되는 초기화 함수
   * 객체가 생성될 때 초기 세팅 담당
   * 서버 시작 전에 필요한 준비 작업
   */
  constructor() {
    /**
     * this는 현재 만들어진 Server 객체 자신을 가리킴
     * 객체 안에 있는 값을 가리킬 때 사용
     * #app, #port 는 private 필드로, 객체 외부에서 접근 불가
     */
    this.#app = express();  // 이 Server 객체 안에 express 앱을 생성해서 넣어둠
    this.#port = process.env.EXPRESS_PORT || 5000;

    this.#initializePreMiddlewares();
    this.#initializeRouters();
    this.#initializePostMiddlewares();
  }

  #initializePreMiddlewares() {
    // uploads 폴더 없으면 생성
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
      console.log(`uploads 폴더 생성`);
    }

    this.#app.use(cors());
    this.#app.use(morgan('dev'));
    this.#app.use(express.json());
    this.#app.use(express.urlencoded({ extended: true }));

    // 정적 파일 제공
    this.#app.use('/images/upload', express.static(uploadsDir));
  }

  // 라우터 등록
  // this.#app.use('/api/users', userRouter);
  #initializeRouters() {
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
  // this.#app.use(errorHandler);
  #initializePostMiddlewares() {
    this.#app.use(errorHandler);
  }

  run(port: number = this.#port) {
    this.#app.listen(port, () => {
      console.log(`server is running at http://localhost:${port}`);
    });
  }
}
