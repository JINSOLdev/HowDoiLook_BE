// src/routes/debug-route.js
import { Router } from 'express';
import { WEATHER_API } from '../config/weather-config.js';
const router = Router();

router.get('/debug/weather', (req, res) => {
  const { baseUrl, apiKey, units, lang } = WEATHER_API;
  const okHost = baseUrl?.startsWith('https://api.openweathermap.org/data/2.5');
  res.json({
    baseUrl,
    apiKey: apiKey ? `***${apiKey.slice(-6)}` : '(missing)',
    units,
    lang,
    hostValid: okHost,
  });
});


export default router;
