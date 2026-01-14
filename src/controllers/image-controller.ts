import path from 'path';
import fs from 'fs';
import ImageUploadService from '../services/image-service.js';
import bucket from '../config/firebase-admin.js';

class ImageUploadController {
  constructor() {
    this.imageService = new ImageUploadService();
  }

  async uploadImage(req, res, next) {
    // console.log('FILES:', req.files);
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
      }

      const { originalname, path: tempPath, mimetype } = file;
      const ext = path.extname(originalname);
      const baseName = path.basename(originalname, ext);
      const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const timestamp = Date.now();
      const firebaseFileName = `${safeBaseName}_${timestamp}${ext}`;
      const destination = `images/${firebaseFileName}`;

      await bucket.upload(tempPath, {
        destination,
        metadata: { contentType: mimetype },
      });

      fs.unlinkSync(tempPath);

      const fileRef = bucket.file(destination);
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      const uploaded = await this.imageService.createImage({ imageUrl: url });

      // ✅ 프론트 명세에 맞게 string으로 단일 응답
      return res.status(200).json({ imageUrl: uploaded.imageUrl });
    } catch (error) {
      next(error);
    }
  }
}

export default ImageUploadController;
