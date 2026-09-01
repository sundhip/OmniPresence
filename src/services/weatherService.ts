import { WeatherContext } from "@/types/weather";

const CACHE_KEY = "op_weather_cache";
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes client cache

// Deterministic fallback data per city for offline or local preview
const FALLBACK_CITIES: Record<
  string,
  { temp: number; feels: number; condition: any; precip: string; humidity: number; wind: number }
> = {
  bengaluru: {
    temp: 28,
    feels: 30,
    condition: "Partly Cloudy",
    precip: "0% (No rain)",
    humidity: 58,
    wind: 12,
  },
  mumbai: {
    temp: 32,
    feels: 37,
    condition: "Sunny",
    precip: "0% (No rain)",
    humidity: 78,
    wind: 14,
  },
  delhi: {
    temp: 29,
    feels: 31,
    condition: "Clear",
    precip: "0% (No rain)",
    humidity: 48,
    wind: 8,
  },
  london: {
    temp: 16,
    feels: 14,
    condition: "Cloudy",
    precip: "20% (Drizzle possible)",
    humidity: 74,
    wind: 18,
  },
  newyork: {
    temp: 22,
    feels: 22,
    condition: "Sunny",
    precip: "0% (No rain)",
    humidity: 52,
    wind: 10,
  },
  paris: {
    temp: 18,
    feels: 17,
    condition: "Partly Cloudy",
    precip: "10%",
    humidity: 62,
    wind: 11,
  },
  tokyo: {
    temp: 24,
    feels: 25,
    condition: "Clear",
    precip: "0% (No rain)",
    humidity: 60,
    wind: 9,
  },
};

export const weatherService = {
  // Get active weather context (Cached -> Server Route -> Deterministic fallback)
  getWeatherContext: async (
    targetLocation?: string,
    forceRefresh: boolean = false
  ): Promise<WeatherContext> => {
    const location = targetLocation || weatherService.getUserLocation();

    // 1. Check client-side cache
    if (!forceRefresh && typeof window !== "undefined") {
      try {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          const age = Date.now() - (parsed.timestamp || 0);
          if (
            age < CACHE_TTL_MS &&
            parsed.location.toLowerCase().includes(location.split(",")[0].toLowerCase())
          ) {
            return {
              ...parsed,
              isCached: true,
            };
          }
        }
      } catch (e) {
        console.warn("Weather cache read error:", e);
      }
    }

    // 2. Fetch from backend API route in browser environment
    if (typeof window !== "undefined" && window.location) {
      try {
        const res = await fetch(
          `/api/v1/weather?location=${encodeURIComponent(location)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.weather) {
            const weather: WeatherContext = {
              ...data.weather,
              isCached: false,
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(weather));
            return weather;
          }
        }
      } catch (e) {
        // Fallback silently if offline or route unreachable
      }
    }

    // 3. Fallback deterministic context if offline or in server/test environment
    const cityKey = location.toLowerCase().replace(/[^a-z]/g, "");
    const matched = Object.keys(FALLBACK_CITIES).find((k) => cityKey.includes(k));
    const data = matched ? FALLBACK_CITIES[matched] : FALLBACK_CITIES.bengaluru;

    const fallbackWeather: WeatherContext = {
      location,
      temperature: data.temp,
      feelsLike: data.feels,
      condition: data.condition,
      precipitation: data.precip,
      humidity: data.humidity,
      windSpeed: data.wind,
      timestamp: Date.now(),
      isCached: false,
    };

    if (typeof window !== "undefined" && localStorage) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(fallbackWeather));
    }

    return fallbackWeather;
  },

  // Get currently selected user location
  getUserLocation: (): string => {
    if (typeof window === "undefined" || !localStorage) return "Bengaluru, India";
    return localStorage.getItem("op_user_location") || "Bengaluru, India";
  },

  // Set user custom location
  setUserLocation: (location: string): void => {
    if (typeof window !== "undefined" && localStorage) {
      localStorage.setItem("op_user_location", location);
    }
  },

  // Geolocation detection helper
  detectBrowserLocation: async (): Promise<string | null> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`/api/v1/weather?lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.weather?.location) {
                weatherService.setUserLocation(data.weather.location);
                resolve(data.weather.location);
                return;
              }
            }
          } catch (e) {
            console.warn("Reverse geocoding error:", e);
          }
          resolve("Current Device Location");
        },
        () => {
          resolve(null);
        },
        { timeout: 8000 }
      );
    });
  },
};
