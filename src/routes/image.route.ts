import { Router } from 'express';
import upload from '../middlewares/multer.middleware.ts';
import {ImageUploadController} from '../controllers/image.controller.js';

const router = Router();

const imageUploadController = new ImageUploadController();
const imageUpload = imageUploadController.uploadImage.bind(imageUploadController);

// 이미지 업로드
router.post('/', upload.single('image'), imageUpload); 

export default router;
