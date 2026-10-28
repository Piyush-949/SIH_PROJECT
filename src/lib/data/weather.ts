/**
 * KRISHI SETU — OpenWeatherMap Integration
 * Free tier: 1,000 calls/day | 60 calls/min
 * API: https://openweathermap.org/api/one-call-3
 *
 * Used for:
 * - Weather advisory on farmer booking page
 * - Factor 6 in AI centre recommendation engine (penalize congested+rain)
 * - District weather banners on admin dashboard
 */

export interface WeatherData {
  lat: number;
  lon: number;
  city: string;
  district: string;
  temperature: number;       // °C
  feelsLike: number;
  humidity: number;          // %
  windSpeed: number;         // km/h
  description: string;       // e.g. "light rain"
  icon: string;              // OWM icon code e.g. "10d"
  condition: "Clear" | "Clouds" | "Rain" | "Drizzle" | "Thunderstorm" | "Snow" | "Fog" | "Haze" | "Mist" | "Smoke" | "Dust" | "Sand";
  isRaining: boolean;
  isFog: boolean;
  isExtreme: boolean;
  advisoryLevel: "none" | "caution" | "warning" | "severe";
  advisoryText: string;
  advisoryTextHindi: string;
  source: "live" | "cached" | "fallback";
  timestamp: string;
}

// ─── Cache ───────────────────────────────────────────────────────────────────
const weatherCache: Map<string, { data: WeatherData; expiry: number }> = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function buildCacheKey(lat: number, lon: number): string {
  // Round to 2 decimal places (~1km precision)
  return `${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

/**
 * Fetch weather from OpenWeatherMap for a given lat/lng.
 */
async function fetchWeatherFromOWM(
  lat: number,
  lon: number,
  cityName: string,
  district: string
): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) throw new Error("OPENWEATHERMAP_API_KEY not set");

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=en`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`OWM returned ${res.status}`);

  const data = await res.json();

  const condition = (data.weather?.[0]?.main || "Clear") as WeatherData["condition"];
  const description = data.weather?.[0]?.description || "clear sky";
  const icon = data.weather?.[0]?.icon || "01d";
  const temp = Math.round(data.main?.temp ?? 25);
  const feelsLike = Math.round(data.main?.feels_like ?? 25);
  const humidity = data.main?.humidity ?? 60;
  const windSpeed = Math.round((data.wind?.speed ?? 0) * 3.6); // m/s → km/h

  const isRaining = ["Rain", "Drizzle", "Thunderstorm"].includes(condition);
  const isFog = ["Fog", "Haze", "Mist", "Smoke", "Dust", "Sand"].includes(condition);
  const isExtreme = condition === "Thunderstorm" || windSpeed > 60 || temp > 45;

  const { level, text, textHindi } = buildAdvisory(condition, temp, humidity, windSpeed);

  return {
    lat, lon, city: cityName, district,
    temperature: temp, feelsLike, humidity, windSpeed,
    description, icon, condition,
    isRaining, isFog, isExtreme,
    advisoryLevel: level,
    advisoryText: text,
    advisoryTextHindi: textHindi,
    source: "live",
    timestamp: new Date().toISOString(),
  };
}

function buildAdvisory(
  condition: string,
  temp: number,
  humidity: number,
  windSpeed: number
): { level: WeatherData["advisoryLevel"]; text: string; textHindi: string } {
  if (condition === "Thunderstorm") {
    return {
      level: "severe",
      text: "⚠️ Thunderstorm alert. Avoid travel to mandi. Reschedule booking.",
      textHindi: "⚠️ आंधी-तूफान की चेतावनी। यात्रा न करें। बुकिंग पुनर्निर्धारित करें।",
    };
  }
  if (condition === "Rain" || condition === "Drizzle") {
    return {
      level: "warning",
      text: "🌧️ Rain expected. Ensure produce is covered. Road delays possible.",
      textHindi: "🌧️ वर्षा की संभावना। फसल को ढकें। रास्ते में देरी हो सकती है।",
    };
  }
  if (isFoggy(condition) || (humidity > 85 && temp < 15)) {
    return {
      level: "caution",
      text: "🌫️ Dense fog/mist. Drive carefully. Arrive 30 min early.",
      textHindi: "🌫️ घना कोहरा। सावधानी से गाड़ी चलाएं। 30 मिनट पहले निकलें।",
    };
  }
  if (temp > 42) {
    return {
      level: "caution",
      text: "☀️ Extreme heat advisory. Carry water. Inspect produce for heat damage.",
      textHindi: "☀️ अत्यधिक गर्मी। पानी साथ रखें। फसल की जांच करें।",
    };
  }
  if (windSpeed > 40) {
    return {
      level: "caution",
      text: "💨 Strong winds. Secure load before transport.",
      textHindi: "💨 तेज़ हवा। परिवहन से पहले माल सुरक्षित करें।",
    };
  }
  return {
    level: "none",
    text: `Clear conditions. Good day for mandi visit. Temp: ${temp}°C.`,
    textHindi: `मौसम साफ है। आज मंडी जाने के लिए उचित दिन है। तापमान: ${temp}°C।`,
  };
}

function isFoggy(condition: string): boolean {
  return ["Fog", "Haze", "Mist", "Smoke", "Dust", "Sand"].includes(condition);
}

/**
 * District-level fallback weather data for major Indian procurement regions.
 */
function getFallbackWeather(lat: number, lon: number, city: string, district: string): WeatherData {
  const month = new Date().getMonth(); // 0-11
  const isWinter = month <= 1 || month === 11;
  const isSummer = month >= 3 && month <= 5;
  const isMonsoon = month >= 6 && month <= 9;

  const temp = isWinter ? 18 : isSummer ? 38 : 28;
  const condition: WeatherData["condition"] = isMonsoon ? "Clouds" : isWinter ? "Haze" : "Clear";
  const isRaining = isMonsoon && Math.random() > 0.6;

  const { level, text, textHindi } = buildAdvisory(
    isRaining ? "Rain" : condition,
    temp, 65, 12
  );

  return {
    lat, lon, city, district,
    temperature: temp,
    feelsLike: temp + (isSummer ? 4 : -2),
    humidity: isWinter ? 75 : isMonsoon ? 80 : 50,
    windSpeed: 12,
    description: isRaining ? "light rain" : isMonsoon ? "overcast clouds" : "clear sky",
    icon: isRaining ? "10d" : isMonsoon ? "04d" : "01d",
    condition: isRaining ? "Rain" : condition,
    isRaining,
    isFog: isWinter,
    isExtreme: false,
    advisoryLevel: level,
    advisoryText: text,
    advisoryTextHindi: textHindi,
    source: "fallback",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Main export: get weather for a location.
 */
export async function getWeather(
  lat: number,
  lon: number,
  cityName = "Unknown",
  district = "Unknown"
): Promise<WeatherData> {
  const key = buildCacheKey(lat, lon);
  const cached = weatherCache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return { ...cached.data, source: "cached" };
  }

  try {
    const data = await fetchWeatherFromOWM(lat, lon, cityName, district);
    weatherCache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
    return data;
  } catch (err: any) {
    console.warn(`[Weather] Fetch failed for ${cityName}: ${err.message}`);
    return getFallbackWeather(lat, lon, cityName, district);
  }
}

/**
 * Get weather penalty score for AI recommendation engine.
 * Returns 0 (no penalty) to 15 (severe weather penalty).
 */
export function getWeatherPenalty(weather: WeatherData): number {
  switch (weather.advisoryLevel) {
    case "severe": return 15;
    case "warning": return 8;
    case "caution": return 4;
    default: return 0;
  }
}

/**
 * OWM icon URL helper.
 */
export function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
