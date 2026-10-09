import httpx
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from app.models.schemas import WeatherResponse, WeatherCurrent, DailyForecast, DataOrigin
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback geocoding table for common tourist destinations to ensure reliable coordinates
KNOWN_LOCATIONS: Dict[str, Dict[str, Any]] = {
    "chennai": {"name": "Chennai, India", "lat": 13.0827, "lon": 80.2707},
    "miami": {"name": "Miami, USA", "lat": 25.7617, "lon": -80.1918},
    "tokyo": {"name": "Tokyo, Japan", "lat": 35.6762, "lon": 139.6503},
    "paris": {"name": "Paris, France", "lat": 48.8566, "lon": 2.3522},
    "bangkok": {"name": "Bangkok, Thailand", "lat": 13.7563, "lon": 100.5018},
    "colombo": {"name": "Colombo, Sri Lanka", "lat": 6.9271, "lon": 79.8612},
    "manila": {"name": "Manila, Philippines", "lat": 14.5995, "lon": 120.9842},
    "sydney": {"name": "Sydney, Australia", "lat": -33.8688, "lon": 151.2093},
    "new york": {"name": "New York, USA", "lat": 40.7128, "lon": -74.0060},
    "london": {"name": "London, UK", "lat": 51.5074, "lon": -0.1278},
}

class WeatherService:
    def __init__(self):
        self.base_url = settings.OPEN_METEO_BASE_URL

    async def geocode_location(self, query: str) -> Optional[Dict[str, Any]]:
        norm = query.lower().strip()
        if norm in KNOWN_LOCATIONS:
            return KNOWN_LOCATIONS[norm]
        
        # Try Open-Meteo Geocoding API
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={"name": query, "count": 1, "language": "en", "format": "json"}
                )
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results", [])
                    if results:
                        loc = results[0]
                        return {
                            "name": f"{loc.get('name')}, {loc.get('country', '')}",
                            "lat": loc.get("latitude"),
                            "lon": loc.get("longitude")
                        }
        except Exception as e:
            logger.warning(f"Geocoding external lookup failed: {e}")
            
        return None

    def _map_wmo_code(self, code: int) -> str:
        codes = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            71: "Slight snow",
            75: "Heavy snow",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail"
        }
        return codes.get(code, "Variable Weather")

    async def get_weather(self, location_query: str) -> WeatherResponse:
        loc_info = await self.geocode_location(location_query)
        if not loc_info:
            # Fall back to default location if unrecognized
            loc_info = KNOWN_LOCATIONS["chennai"]

        lat = loc_info["lat"]
        lon = loc_info["lon"]
        name = loc_info["name"]

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(
                    f"{self.base_url}/forecast",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
                        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
                        "timezone": "auto"
                    }
                )
                
                if res.status_code == 200:
                    data = res.json()
                    current_raw = data.get("current", {})
                    weather_code = current_raw.get("weather_code", 0)
                    condition = self._map_wmo_code(weather_code)

                    current = WeatherCurrent(
                        temperature=current_raw.get("temperature_2m", 0.0),
                        rainfall=current_raw.get("precipitation", 0.0),
                        wind_speed=current_raw.get("wind_speed_10m", 0.0),
                        humidity=current_raw.get("relative_humidity_2m"),
                        weather_condition=condition,
                        is_live=True,
                        data_origin=DataOrigin.LIVE_WEATHER_API,
                        retrieved_at=datetime.utcnow(),
                        location_name=name,
                        latitude=lat,
                        longitude=lon
                    )

                    daily_raw = data.get("daily", {})
                    forecasts: list[DailyForecast] = []
                    dates = daily_raw.get("time", [])
                    max_temps = daily_raw.get("temperature_2m_max", [])
                    min_temps = daily_raw.get("temperature_2m_min", [])
                    precips = daily_raw.get("precipitation_sum", [])
                    codes = daily_raw.get("weather_code", [])

                    for i in range(min(5, len(dates))):
                        forecasts.append(DailyForecast(
                            date=dates[i],
                            max_temp=max_temps[i] if i < len(max_temps) else 0.0,
                            min_temp=min_temps[i] if i < len(min_temps) else 0.0,
                            precipitation=precips[i] if i < len(precips) else 0.0,
                            condition=self._map_wmo_code(codes[i] if i < len(codes) else 0)
                        ))

                    return WeatherResponse(current=current, forecast=forecasts, status="success")

        except Exception as e:
            logger.error(f"Error fetching live weather from Open-Meteo: {e}")

        # If live fetch fails, clearly inform that live weather is unavailable
        return WeatherResponse(
            current=WeatherCurrent(
                temperature=0.0,
                rainfall=0.0,
                wind_speed=0.0,
                humidity=0.0,
                weather_condition="Live Data Unavailable",
                is_live=False,
                data_origin=DataOrigin.CACHED_PROVIDER_DATA,
                retrieved_at=datetime.utcnow(),
                location_name=f"{name} (Live fetch failed)",
                latitude=lat,
                longitude=lon
            ),
            forecast=[],
            status="error",
            message="Live weather API connection timed out or is unavailable. Please refresh."
        )

weather_service = WeatherService()
