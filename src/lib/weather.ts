import type { WeatherCache } from "./types";

export interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export async function fetchWeather(
  lat: number,
  lng: number,
  city?: string,
): Promise<WeatherCache> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
    `&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather_fetch_failed");
  const j = (await res.json()) as OpenMeteoResponse;
  const nowIdx = Math.max(
    0,
    j.hourly.time.findIndex((t) => new Date(t).getTime() >= Date.now()),
  );
  const hourly = j.hourly.time.slice(nowIdx, nowIdx + 12).map((time, i) => ({
    time,
    temp: j.hourly.temperature_2m[nowIdx + i],
    code: j.hourly.weather_code[nowIdx + i],
  }));
  const daily = j.daily.time.map((date, i) => ({
    date,
    min: j.daily.temperature_2m_min[i],
    max: j.daily.temperature_2m_max[i],
    code: j.daily.weather_code[i],
  }));
  return {
    current: {
      temperature: j.current.temperature_2m,
      apparent: j.current.apparent_temperature,
      humidity: j.current.relative_humidity_2m,
      windSpeed: j.current.wind_speed_10m,
      code: j.current.weather_code,
      isDay: j.current.is_day === 1,
    },
    daily,
    hourly,
    fetchedAt: Date.now(),
    city,
  };
}

/** WMO weather code → { label (ar), emoji } */
export function describeWeatherCode(code: number, isDay = true): { label: string; emoji: string } {
  const map: Record<number, { label: string; emoji: string; night?: string }> = {
    0: { label: "صافٍ", emoji: isDay ? "☀️" : "🌙", night: "🌙" },
    1: { label: "صافٍ غالبًا", emoji: isDay ? "🌤️" : "🌙" },
    2: { label: "غائم جزئيًا", emoji: "⛅" },
    3: { label: "غائم", emoji: "☁️" },
    45: { label: "ضباب", emoji: "🌫️" },
    48: { label: "ضباب متجمد", emoji: "🌫️" },
    51: { label: "رذاذ خفيف", emoji: "🌦️" },
    53: { label: "رذاذ", emoji: "🌦️" },
    55: { label: "رذاذ كثيف", emoji: "🌧️" },
    61: { label: "مطر خفيف", emoji: "🌧️" },
    63: { label: "مطر", emoji: "🌧️" },
    65: { label: "مطر غزير", emoji: "⛈️" },
    71: { label: "ثلوج خفيفة", emoji: "🌨️" },
    73: { label: "ثلوج", emoji: "❄️" },
    75: { label: "ثلوج كثيفة", emoji: "❄️" },
    77: { label: "حبيبات ثلجية", emoji: "🌨️" },
    80: { label: "زخات مطر", emoji: "🌦️" },
    81: { label: "زخات قوية", emoji: "🌧️" },
    82: { label: "زخات عنيفة", emoji: "⛈️" },
    85: { label: "زخات ثلج", emoji: "🌨️" },
    86: { label: "زخات ثلج كثيفة", emoji: "❄️" },
    95: { label: "عاصفة رعدية", emoji: "⛈️" },
    96: { label: "عاصفة مع بَرَد", emoji: "⛈️" },
    99: { label: "عاصفة شديدة", emoji: "🌩️" },
  };
  return map[code] ?? { label: "—", emoji: "🌡️" };
}