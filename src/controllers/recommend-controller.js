import { WeatherService } from '../services/weather-service.js';
import { RecommendService } from '../services/recommend-service.js';

export const getWeatherRecommend = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: 'lat, lon 쿼리 파라미터가 필요합니다.' });
    }

    const weather = await WeatherService.getCurrentByCoords({
      lat: Number(lat),
      lon: Number(lon),
    });

    const result = await RecommendService.recommendByWeather(weather);
    return res.json({
      ok: true,
      city: weather.city,
      weather: {
        temp: weather.temp,
        feelsLike: weather.feelsLike,
        desc: weather.weatherDesc,
      },
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
