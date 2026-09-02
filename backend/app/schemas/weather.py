from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class WeatherCondition(BaseModel):
    temperature_c: float
    apparent_temperature_c: float
    precipitation_probability: float
    rain_mm: float
    wind_speed_kmh: float
    weather_code: int
    condition_text: str
    is_day: bool

class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    timezone: str
    current: WeatherCondition
    daily_summary: Dict[str, Any] = {}
