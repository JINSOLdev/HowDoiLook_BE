import { Request, Response, NextFunction } from 'express';
import { getValidated } from '../types/validated.ts';
import { updateCurationService, deleteCurationService } from '../services/curation.service.js';

type CurationParams = { curationId: number | string };

type UpdateCurationBody = {
  password: string;
  trendy: number;
  personality: number;
  practicality: number;
  costEffectiveness: number;
  content: string;
  nickname: string;
};

type DeleteCurationBody = { password: string };

export class CurationController {
  // 큐레이팅 수정
  static async updateCuration(req: Request, res: Response, next: NextFunction) {
    try {
      const { body, params } = getValidated<UpdateCurationBody, CurationParams>(req);
      const { password, trendy, personality, practicality, costEffectiveness, content, nickname } = body;
      const { curationId } = params;

      const updatedCurationData = await updateCurationService(curationId, {
        password,
        trendy,
        personality,
        practicality,
        costEffectiveness,
        content,
        nickname,
      });

      const response = {
        id: updatedCurationData.curationId,
        nickname: updatedCurationData.nickname,
        content: updatedCurationData.content,
        trendy: updatedCurationData.trendy,
        personality: updatedCurationData.personality,
        practicality: updatedCurationData.practicality,
        costEffectiveness: updatedCurationData.costEffectiveness,
        createdAt: updatedCurationData.createdAt,
      };

      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // 큐레이팅 삭제
  async deleteCuration(req: Request, res: Response, next: NextFunction) {
    try {
      const { body, params } = getValidated<DeleteCurationBody, CurationParams>(req);
      const { password } = body;
      const { curationId } = params;

      const result = await deleteCurationService(curationId, password);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
