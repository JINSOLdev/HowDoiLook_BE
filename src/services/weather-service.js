// src/services/weather-service.js
import fetch from 'node-fetch';
import { WEATHER_API } from '../config/weather-config.js';

export class WeatherService {
  static async getCurrentByCoords({ lat, lon }) {
    const rawKey = WEATHER_API.apiKey;
    const apiKey = (rawKey || '').trim();

    if (!apiKey) throw new Error('OPENWEATHER_API_KEY is missing');
    if (apiKey.startsWith('http')) throw new Error('OPENWEATHER_API_KEY should be the key string, not a URL');

    const url =
      `${WEATHER_API.baseUrl}/weather` +
      `?lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lon)}` +
      `&units=${WEATHER_API.units}` +
      `&lang=${WEATHER_API.lang}` +
      `&appid=${apiKey}`;

    // 디버그: 실제로 무엇을 호출하는지(키는 마스킹)
    console.log('[OW] GET', url.replace(apiKey, `***${apiKey.slice(-6)}`));

    const res = await fetch(url);
    const ctype = res.headers.get('content-type') || '';

    if (!res.ok) {
      let body = '';
      try {
        body = ctype.includes('json') ? JSON.stringify(await res.json()) : await res.text();
      } catch (_) {}
      throw new Error(`OpenWeather error: ${res.status}. body=${String(body).slice(0, 140)}`);
    }
    if (!ctype.includes('application/json')) {
      const txt = await res.text().catch(() => '');
      throw new Error(`OpenWeather returned non-JSON: ${txt.slice(0, 120)}...`);
    }

    const data = await res.json();
    return {
      temp: data.main?.temp,
      feelsLike: data.main?.feels_like,
      humidity: data.main?.humidity,
      wind: data.wind?.speed,
      weather: data.weather?.[0]?.main,
      weatherDesc: data.weather?.[0]?.description,
      rain1h: data.rain?.['1h'] || 0,
      snow1h: data.snow?.['1h'] || 0,
      city: data.name,
      ts: Date.now(),
    };
  }
}
