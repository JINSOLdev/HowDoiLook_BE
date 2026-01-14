import swaggerUi from 'swagger-ui-express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openapiPath = path.join(__dirname, '../../openapi.json');

let swaggerSpec = null;

export const readSwaggerJson = async () => {
  try {
    const raw = await fs.readFile(openapiPath, 'utf-8');
    swaggerSpec = JSON.parse(raw);
    console.log('swagger spec loaded');
  } catch (error) {
    console.error('failed to load swagger spec:', error);
  }
};

// 정적 파일 미들웨어
export const swaggerMiddlewareStatic = swaggerUi.serve;

// 렌더링 미들웨어
export const swaggerMiddlewareRender = (req, res, next) => {
  if (!swaggerSpec) {
    const error = new Error('swagger spec not loaded');
    error.statusCode = 500;
    return next(error);
  }
  return swaggerUi.setup(swaggerSpec)(req, res, next);
};
