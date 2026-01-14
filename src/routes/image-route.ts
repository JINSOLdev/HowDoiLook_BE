import { Router } from 'express';
import upload from '../middlewares/multer-middleware.js';
import ImageUploadController from '../controllers/image-controller.js';

const router = Router();

// ImageUploadController 클래스의 인스턴스 생성
const imageUploadController = new ImageUploadController();

// 함수 반환하기 위해 bind 메서드 사용
const imageUpload = imageUploadController.uploadImage.bind(imageUploadController);

router.post('/', upload.single('image'), imageUpload);  // 필드명 수정
export default router;
