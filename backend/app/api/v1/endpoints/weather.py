from fastapi import APIRouter, Query
from app.services.weather_service import weather_service
from app.schemas.weather import WeatherResponse

router = APIRouter()

@router.get("", response_model=WeatherResponse)
async def get_weather(
    lat: float = Query(default=37.7749),
    lon: float = Query(default=-122.4194)
):
    return await weather_service.get_current_weather(lat, lon)
