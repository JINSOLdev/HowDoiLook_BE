export const WEATHER_API = {
  baseUrl: 'https://api.openweathermap.org/data/2.5',
  apiKey: process.env.OPENWEATHER_API_KEY,
  units: process.env.OPENWEATHER_UNITS || 'metric',
  lang: process.env.OPENWEATHER_LANG || 'kr',
};