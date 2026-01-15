import type { RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

type SwaggerSpec = Record<string, unknown>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openapiPath = path.join(__dirname, '../../openapi.json');

let swaggerSpec: SwaggerSpec | null = null;

export const readSwaggerJson = async (): Promise<void> => {
  try {
    const raw = await fs.readFile(openapiPath, 'utf-8');
    swaggerSpec = JSON.parse(raw) as SwaggerSpec;
    console.log('swagger spec loaded');
  } catch (error) {
    console.error('failed to load swagger spec:', error);
  }
};

// 정적 파일 미들웨어
export const swaggerMiddlewareStatic = swaggerUi.serve;

// 렌더링 미들웨어
export const swaggerMiddlewareRender: RequestHandler = (req, res, next) => {
  if (!swaggerSpec) {
    const error = new Error('swagger spec not loaded') as Error & { statusCode?: number};
    error.statusCode = 500;
    return next(error);
  }
  return swaggerUi.setup(swaggerSpec)(req, res, next);
};
