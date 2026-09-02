import pytest
from app.services.weather_service import weather_service

@pytest.mark.asyncio
async def test_weather_service_resilience():
    # Calling with test coords (San Francisco)
    weather = await weather_service.get_current_weather(37.7749, -122.4194)
    assert weather is not None
    assert weather.current.temperature_c is not None
    assert isinstance(weather.current.condition_text, str)
    assert weather.current.condition_text != ""
