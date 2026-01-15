import express from 'express';
import TagController from '../controllers/tag-controller.ts';

const tagRouter = express.Router();

tagRouter.get('/', TagController.handleGetTagList);

export default tagRouter;
