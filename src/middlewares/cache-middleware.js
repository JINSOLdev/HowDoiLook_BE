// 매우 단순한 메모리 캐시 (TTL 분 단위)
const store = new Map()

export const cache = (keyBuilder, ttlMinutes = 5) => {
  return (req, res, next) => {
    try {
      const key = keyBuilder(req)
      const hit = store.get(key)
      if (hit && (Date.now() - hit.time) < ttlMinutes * 60 * 1000) {
        return res.json(hit.value)
      }

      // res.json을 가로채서 캐시 저장
      const originalJson = res.json.bind(res);
      res.json = (payload) => {
        store.set(key, { time: Date.now(), value: payload });
        return originalJson(payload);
      }
      next()
    } catch (e) {
      next(e)
    }
  }
}