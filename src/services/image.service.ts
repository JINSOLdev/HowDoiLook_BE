import type { Image } from '@prisma/client';
import db from '../config/db.js';

type CreateImageInput = {
  imageUrl: string
}

export class ImageUploadService {
  async createImage({ imageUrl }: CreateImageInput): Promise<Image> {
    return db.image.create({
      data: {
        imageUrl,
      },
    });
  }
}

