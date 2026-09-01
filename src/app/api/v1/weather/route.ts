import { NextResponse } from "next/server";
import { WeatherContext, WeatherCondition } from "@/types/weather";

// Deterministic base conditions for common cities when offline or OpenWeather API key is not configured
const CITY_DEFAULTS: Record<string, Partial<WeatherContext>> = {
  bengaluru: {
    location: "Bengaluru, India",
    temperature: 28,
    feelsLike: 30,
    condition: "Partly Cloudy",
    precipitation: "No rain expected",
    humidity: 55,
    windSpeed: 14,
  },
  bangalore: {
    location: "Bengaluru, India",
    temperature: 28,
    feelsLike: 30,
    condition: "Partly Cloudy",
    precipitation: "No rain expected",
    humidity: 55,
    windSpeed: 14,
  },
  mumbai: {
    location: "Mumbai, India",
    temperature: 31,
    feelsLike: 36,
    condition: "Sunny",
    precipitation: "No rain expected",
    humidity: 75,
    windSpeed: 18,
  },
  delhi: {
    location: "New Delhi, India",
    temperature: 34,
    feelsLike: 38,
    condition: "Sunny",
    precipitation: "No rain expected",
    humidity: 45,
    windSpeed: 12,
  },
  chennai: {
    location: "Chennai, India",
    temperature: 32,
    feelsLike: 37,
    condition: "Partly Cloudy",
    precipitation: "10% chance of showers",
    humidity: 78,
    windSpeed: 16,
  },
  "new york": {
    location: "New York, USA",
    temperature: 22,
    feelsLike: 22,
    condition: "Clear",
    precipitation: "No rain expected",
    humidity: 48,
    windSpeed: 15,
  },
  london: {
    location: "London, UK",
    temperature: 16,
    feelsLike: 15,
    condition: "Rainy",
    precipitation: "Light rain expected (75%)",
    humidity: 82,
    windSpeed: 20,
  },
  paris: {
    location: "Paris, France",
    temperature: 19,
    feelsLike: 19,
    condition: "Cloudy",
    precipitation: "20% chance of drizzle",
    humidity: 62,
    windSpeed: 11,
  },
  tokyo: {
    location: "Tokyo, Japan",
    temperature: 24,
    feelsLike: 25,
    condition: "Clear",
    precipitation: "No rain expected",
    humidity: 58,
    windSpeed: 10,
  },
  san_francisco: {
    location: "San Francisco, USA",
    temperature: 17,
    feelsLike: 16,
    condition: "Windy",
    precipitation: "No rain expected",
    humidity: 65,
    windSpeed: 24,
  },
};

function mapOpenWeatherCondition(id: number, main: string): WeatherCondition {
  if (id >= 200 && id < 300) return "Stormy";
  if (id >= 300 && id < 600) return "Rainy";
  if (id >= 600 && id < 700) return "Snowy";
  if (id >= 700 && id < 800) return "Windy";
  if (id === 800) return "Clear";
  if (id === 801 || id === 802) return "Partly Cloudy";
  return "Cloudy";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationParam = searchParams.get("location") || "Bengaluru, India";
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  const apiKey = process.env.OPENWEATHER_API_KEY;

  // 1. If OpenWeather API Key is provided, fetch live data securely from server side
  if (apiKey) {
    try {
      let url = "";
      if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      } else {
        const cityQuery = encodeURIComponent(locationParam.split(",")[0].trim());
        url = `https://api.openweathermap.org/data/2.5/weather?q=${cityQuery}&units=metric&appid=${apiKey}`;
      }

      const res = await fetch(url, { next: { revalidate: 600 } });
      if (res.ok) {
        const data = await res.json();
        const condition = mapOpenWeatherCondition(
          data.weather?.[0]?.id || 800,
          data.weather?.[0]?.main || "Clear"
        );
        const hasRain = Boolean(data.rain);
        const precipitation = hasRain
          ? `Rain likely (${Math.round((data.rain?.["1h"] || 1) * 20)}%)`
          : "No rain expected";

        const weather: WeatherContext = {
          location: `${data.name}, ${data.sys?.country || ""}`.replace(/,\s*$/, ""),
          temperature: Math.round(data.main.temp),
          feelsLike: Math.round(data.main.feels_like),
          condition,
          precipitation,
          humidity: data.main.humidity,
          windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
          timestamp: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, weather });
      }
    } catch (e) {
      console.warn("OpenWeather server fetch fallback:", e);
    }
  }

  // 2. Deterministic normalization fallback (when no API key or offline)
  const normalizedKey = locationParam.toLowerCase().split(",")[0].trim();
  const matched =
    CITY_DEFAULTS[normalizedKey] ||
    Object.entries(CITY_DEFAULTS).find(([k]) => normalizedKey.includes(k))?.[1] || {
      location: locationParam,
      temperature: 26,
      feelsLike: 27,
      condition: "Partly Cloudy",
      precipitation: "No rain expected",
      humidity: 60,
      windSpeed: 12,
    };

  const weather: WeatherContext = {
    location: matched.location || locationParam,
    temperature: matched.temperature ?? 26,
    feelsLike: matched.feelsLike ?? 27,
    condition: (matched.condition as WeatherCondition) ?? "Partly Cloudy",
    precipitation: matched.precipitation || "No rain expected",
    humidity: matched.humidity ?? 60,
    windSpeed: matched.windSpeed ?? 12,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({
    success: true,
    weather,
  });
}
