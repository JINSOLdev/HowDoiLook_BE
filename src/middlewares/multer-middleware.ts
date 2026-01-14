import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve('uploads'));
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}=${randomUUID()}${ext}`;
      cb(null, uniqueName);
    },
  }),
});

export default upload;
