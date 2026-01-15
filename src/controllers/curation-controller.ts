import { updateCurationService, deleteCurationService } from '../services/curation-service.ts';


export class CurationController {
  // 큐레이팅 수정 (PUT /curations/:curationId)
  static async updateCuration(req, res, next) {
    try {
      const { curationId } = req.validated.params;
      const { password, trendy, personality, practicality, costEffectiveness, content, nickname } = req.validated.body;

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

      res.status(200).json(response);
      // console.log(`🚨response:`, response);
    } catch (err) {
      if (err.message === '큐레이팅을 찾을 수 없습니다.') {
        return res.status(404).json({ message: err.message });
      }
      if (err.message === '비밀번호가 일치하지 않습니다.') {
        return res.status(403).json({ message: err.message });
      }
      next(err);
    }
  }

  // 큐레이팅 삭제 (DELETE /curations/:curationId)
  static async deleteCuration(req, res, next) {
    try {
      const { curationId } = req.validated.params;
      const { password } = req.validated.body;

      const result = await deleteCurationService(curationId, password);

      res.status(200).json(result);
    } catch (err) {
      if (err.message === '큐레이팅을 찾을 수 없습니다.') {
        return res.status(404).json({ message: err.message });
      }
      if (err.message === '비밀번호가 일치하지 않습니다.') {
        return res.status(403).json({ message: err.message });
      }
      next(err);
    }
  }
}
