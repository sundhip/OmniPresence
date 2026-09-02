import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.schemas.weather import WeatherResponse, WeatherCondition

WMO_CODE_MAP = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}

class WeatherService:
    def __init__(self):
        self.base_url = settings.OPEN_METEO_BASE_URL

    async def get_current_weather(self, lat: float = 37.7749, lon: float = -122.4194) -> WeatherResponse:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ["temperature_2m", "apparent_temperature", "precipitation", "rain", "weather_code", "wind_speed_10m", "is_day"],
            "hourly": ["temperature_2m", "precipitation_probability", "weather_code"],
            "daily": ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_probability_max"],
            "timezone": "auto"
        }
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(self.base_url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    curr = data.get("current", {})
                    w_code = curr.get("weather_code", 0)
                    condition_text = WMO_CODE_MAP.get(w_code, "Clear")
                    
                    return WeatherResponse(
                        latitude=lat,
                        longitude=lon,
                        timezone=data.get("timezone", "UTC"),
                        current=WeatherCondition(
                            temperature_c=float(curr.get("temperature_2m", 22.0)),
                            apparent_temperature_c=float(curr.get("apparent_temperature", 22.0)),
                            precipitation_probability=float(data.get("daily", {}).get("precipitation_probability_max", [0])[0] if data.get("daily") else 0.0),
                            rain_mm=float(curr.get("rain", 0.0)),
                            wind_speed_kmh=float(curr.get("wind_speed_10m", 5.0)),
                            weather_code=w_code,
                            condition_text=condition_text,
                            is_day=bool(curr.get("is_day", 1))
                        ),
                        daily_summary=data.get("daily", {})
                    )
        except Exception as e:
            # Resilient fallback if network fails
            pass

        return self._get_fallback_weather(lat, lon)

    def _get_fallback_weather(self, lat: float, lon: float) -> WeatherResponse:
        return WeatherResponse(
            latitude=lat,
            longitude=lon,
            timezone="UTC",
            current=WeatherCondition(
                temperature_c=22.0,
                apparent_temperature_c=22.0,
                precipitation_probability=10.0,
                rain_mm=0.0,
                wind_speed_kmh=8.0,
                weather_code=1,
                condition_text="Mainly clear",
                is_day=True
            ),
            daily_summary={"temperature_max": 24.0, "temperature_min": 18.0}
        )

weather_service = WeatherService()
