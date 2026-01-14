import db from '../config/db.js';

class ImageUploadService {
  async createImage({ imageUrl }) {
    return db.image.create({
      data: {
        imageUrl,
      },
    });
  }
}

export default ImageUploadService;
