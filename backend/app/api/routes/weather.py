from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError

from app.core.cache import cache_response, weather_cache
from app.models import (
    AirTemperatureResponse,
    FourDayForecastResponse,
    LightningResponse,
    TwentyFourHourForecastResponse,
    WBGTResponse,
    WeatherApiError,
    WeatherResponse,
    WindDirectionResponse,
)

router = APIRouter(prefix="/weather", tags=["weather"])

WEATHER_API_BASE_URL = "https://api-open.data.gov.sg/v2/real-time/api"

_http_client: httpx.AsyncClient | None = None


async def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=30.0)
    return _http_client


async def make_api_request(
    endpoint: str,
    params: dict[str, Any] | None = None,
    response_model: Any = None,
) -> Any:
    url = f"{WEATHER_API_BASE_URL}/{endpoint}"

    try:
        client = await get_http_client()
        response = await client.get(url, params=params)

        if response.status_code != 200:
            try:
                error_data = response.json()
                error = WeatherApiError(**error_data)
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"{error.name}: {error.error_msg}",
                )
            except (ValidationError, KeyError):
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error from weather API: {response.text}",
                )

        try:
            data = response.json()

            if response_model:
                return response_model(**data)
            return data
        except ValidationError as e:
            print(f"Validation error parsing weather data: {str(e)}")

            if (
                "update_timestamp" in str(e)
                or "updated_timestamp" in str(e)
                or "updatedTimestamp" in str(e)
            ):
                if "data" in data:
                    if "items" in data["data"]:
                        for item in data["data"]["items"]:
                            if (
                                "update_timestamp" in item
                                and "updated_timestamp" not in item
                            ):
                                item["updated_timestamp"] = item["update_timestamp"]

                    if "records" in data["data"]:
                        for record in data["data"]["records"]:
                            if (
                                "updatedTimestamp" in record
                                and "updated_timestamp" not in record
                            ):
                                record["updated_timestamp"] = record["updatedTimestamp"]

                            if "tiemstamp" in record and "timestamp" not in record:
                                record["timestamp"] = record["tiemstamp"]

                    try:
                        if response_model:
                            return response_model(**data)
                        return data
                    except ValidationError:
                        pass

            if "device_id" in str(e) and "Station" in str(e):
                if "data" in data and "stations" in data["data"]:
                    for station in data["data"]["stations"]:
                        if "deviceId" in station and "device_id" not in station:
                            station["device_id"] = station["deviceId"]

                try:
                    if response_model:
                        return response_model(**data)
                    return data
                except ValidationError as new_e:
                    print(
                        f"Still having validation issues after device_id fix: {str(new_e)}"
                    )

            if "TwentyFourHourForecast" in str(e):
                if "data" in data:
                    if (
                        "area_metadata" not in data["data"]
                        and "records" in data["data"]
                    ):
                        data["data"]["area_metadata"] = []

                    try:
                        if response_model:
                            return response_model(**data)
                        return data
                    except ValidationError as new_e:
                        print(
                            f"Still having validation issues after 24-hour forecast fix: {str(new_e)}"
                        )

            if (
                "station_id" in str(e)
                or "value" in str(e)
                or "Reading" in str(e)
                or "stationId" in str(e)
            ):
                if "data" in data and "readings" in data["data"]:
                    for reading in data["data"]["readings"]:
                        if "data" in reading and isinstance(reading["data"], list):
                            flattened_data = []
                            timestamp = reading.get("timestamp")
                            for data_point in reading["data"]:
                                flattened_data.append(
                                    {
                                        "station_id": data_point.get(
                                            "stationId", data_point.get("id")
                                        ),
                                        "value": data_point.get("value"),
                                        "timestamp": timestamp,
                                    }
                                )
                            data["data"]["readings"] = flattened_data
                            break
                        elif "id" in reading and "station_id" not in reading:
                            reading["station_id"] = reading["id"]

                try:
                    if response_model:
                        return response_model(**data)
                    return data
                except ValidationError as new_e:
                    print(
                        f"Still having validation issues after station_id fix: {str(new_e)}"
                    )

            raise HTTPException(
                status_code=500,
                detail=f"Error parsing weather data: {str(e)}",
            )

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error communicating with weather API: {str(e)}",
        )


@router.get("/two-hour-forecast", response_model=WeatherResponse)
@cache_response(_ttl=1800, cache=weather_cache)
async def get_two_hour_forecast(
    date: str | None = Query(
        None,
        description="SGT date for which to retrieve data (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
    ),
    pagination_token: str | None = Query(
        None,
        description="Pagination token for retrieving subsequent data pages",
    ),
) -> Any:
    """
    Retrieve the latest two hour weather forecast from data.gov.sg API.

    - Updated half-hourly from NEA
    - Forecasts are given for multiple areas in Singapore
    """
    params = {}
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request("two-hr-forecast", params, WeatherResponse)


@router.get("/air-temperature", response_model=AirTemperatureResponse)
@cache_response(_ttl=60, cache=weather_cache)
async def get_air_temperature(
    date: str | None = Query(
        None,
        description="Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS (SGT). Example: 2024-07-16 or 2024-07-16T23:59:00",
    ),
    pagination_token: str | None = Query(
        None,
        description="Pagination token for retrieving subsequent data pages",
    ),
) -> Any:
    """
    Get air temperature readings across Singapore

    - Has per-minute readings from NEA
    - Unit of measure for readings is °C
    """
    params = {}
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request("air-temperature", params, AirTemperatureResponse)


@router.get("/wind-direction", response_model=WindDirectionResponse)
@cache_response(_ttl=60, cache=weather_cache)
async def get_wind_direction(
    date: str | None = Query(
        None,
        description="SGT date for which to retrieve data (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
    ),
    pagination_token: str | None = Query(
        None,
        description="Pagination token for retrieving subsequent data pages",
    ),
) -> Any:
    """
    Get wind direction readings across Singapore

    - Has per-minute readings from NEA
    - Unit of measure for readings is °
    """
    params = {}
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request("wind-direction", params, WindDirectionResponse)


@router.get("/lightning", response_model=LightningResponse)
@cache_response(_ttl=300, cache=weather_cache)
async def get_lightning(
    date: str | None = Query(
        None,
        description="SGT date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS). Example: 2025-01-16 or 2025-01-16T23:59:00",
    ),
    pagination_token: str | None = Query(
        None,
        description="Pagination token for retrieving subsequent data pages",
    ),
) -> Any:
    """
    Retrieve the latest lightning observation

    - Updated multiple times throughout the day
    """
    params = {"api": "lightning"}
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request("weather", params, LightningResponse)


@router.get("/wbgt", response_model=WBGTResponse)
@cache_response(_ttl=300, cache=weather_cache)
async def get_wbgt(
    date: str | None = Query(
        None,
        description="SGT date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS). Example: 2025-01-16 or 2025-01-16T23:59:00",
    ),
    pagination_token: str | None = Query(
        None,
        description="Pagination token for retrieving subsequent data pages",
    ),
) -> Any:
    """
    Retrieve the latest WBGT (Wet Bulb Globe Temperature) data for accurate heat stress assessment

    - Updated multiple times throughout the day
    - Unit of measure for readings is °C
    """
    params = {"api": "wbgt"}
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request("weather", params, WBGTResponse)


@router.get("/twenty-four-hour-forecast", response_model=TwentyFourHourForecastResponse)
@cache_response(_ttl=3600, cache=weather_cache)
async def get_twenty_four_hour_forecast(
    date: str | None = Query(
        None,
        description="SGT date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS). Example: 2024-07-16 or 2024-07-16T23:59:00",
    ),
    pagination_token: str | None = Query(
        None,
        description="Pagination token for retrieving subsequent data pages",
    ),
) -> Any:
    """
    Retrieve the latest 24 hour weather forecast

    - Updated multiple times throughout the day
    - Provides forecasts for different areas of Singapore
    """
    params = {}
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request(
        "twenty-four-hr-forecast", params, TwentyFourHourForecastResponse
    )


@router.get("/four-day-outlook", response_model=FourDayForecastResponse)
@cache_response(_ttl=7200, cache=weather_cache)
async def get_four_day_outlook(
    date: str | None = Query(
        None,
        description="SGT date for which to retrieve data (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
    ),
    pagination_token: str | None = Query(
        None,
        description="Pagination token for retrieving subsequent data pages",
    ),
) -> Any:
    """
    Retrieve the latest 4 day weather forecast

    - Updated twice a day from NEA
    - The forecast is for the next 4 days
    """
    params = {}
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request("four-day-outlook", params, FourDayForecastResponse)
