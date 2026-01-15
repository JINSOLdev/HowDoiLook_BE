import { Router } from 'express';
import TagController from '../controllers/tag.controller.js';

const tagRouter = Router();

// 태그 리스트 조회
tagRouter.get('/', TagController.handleGetTagList);

export default tagRouter;
