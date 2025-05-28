from datetime import datetime
from typing import Any, Optional, Dict

import httpx
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import ValidationError

# Import directly from models file
from app.models import (
    WeatherApiError, 
    WeatherResponse, 
    AirTemperatureResponse,
    WindDirectionResponse,
    LightningResponse,
    WBGTResponse,
    TwentyFourHourForecastResponse,
    FourDayForecastResponse
)

router = APIRouter(prefix="/weather", tags=["weather"])

WEATHER_API_BASE_URL = "https://api-open.data.gov.sg/v2/real-time/api"


async def make_api_request(
    endpoint: str, 
    params: Dict[str, Any] = None, 
    response_model: Any = None
) -> Any:
    """
    Generic function to make API requests to the weather API
    """
    url = f"{WEATHER_API_BASE_URL}/{endpoint}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            
            # Handle error responses
            if response.status_code != 200:
                try:
                    error_data = response.json()
                    error = WeatherApiError(**error_data)
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"{error.name}: {error.error_msg}"
                    )
                except (ValidationError, KeyError):
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Error from weather API: {response.text}"
                    )
            
            # Parse successful response
            try:
                data = response.json()
                
                # Try parsing with the model
                if response_model:
                    return response_model(**data)
                return data
            except ValidationError as e:
                # If there's a validation error, provide detailed error information
                print(f"Validation error parsing weather data: {str(e)}")
                
                # If the error is specifically about timestamp fields, try to fix
                if 'update_timestamp' in str(e) or 'updated_timestamp' in str(e) or 'updatedTimestamp' in str(e):
                    # Try to manually fix the data structure
                    if 'data' in data:
                        # For standard items structure
                        if 'items' in data['data']:
                            for item in data['data']['items']:
                                if 'update_timestamp' in item and 'updated_timestamp' not in item:
                                    item['updated_timestamp'] = item['update_timestamp']
                        
                        # For forecast records structure (both 24-hour and 4-day)
                        if 'records' in data['data']:
                            for record in data['data']['records']:
                                # Handle updatedTimestamp field
                                if 'updatedTimestamp' in record and 'updated_timestamp' not in record:
                                    record['updated_timestamp'] = record['updatedTimestamp']
                                
                                # Handle possible "tiemstamp" typo in API that should be "timestamp"
                                if 'tiemstamp' in record and 'timestamp' not in record:
                                    record['timestamp'] = record['tiemstamp']
                        
                        # Try parsing again with the fixed data
                        try:
                            if response_model:
                                return response_model(**data)
                            return data
                        except ValidationError:
                            # If it still fails, fall back to the original error
                            pass
                
                # Handle field name mismatches for air temperature data
                if 'device_id' in str(e) and 'Station' in str(e):
                    # API returns deviceId, but model expects device_id
                    if 'data' in data and 'stations' in data['data']:
                        for station in data['data']['stations']:
                            if 'deviceId' in station and 'device_id' not in station:
                                station['device_id'] = station['deviceId']
                    
                    # Try parsing again with the fixed data
                    try:
                        if response_model:
                            return response_model(**data)
                        return data
                    except ValidationError as new_e:
                        # If there are other issues, continue with fixes
                        print(f"Still having validation issues after device_id fix: {str(new_e)}")
                
                # Handle 24-hour forecast structure issues
                if 'TwentyFourHourForecast' in str(e):
                    # Handle missing area_metadata or other structural issues
                    if 'data' in data:
                        # If area_metadata is missing but required, provide an empty list
                        if 'area_metadata' not in data['data'] and 'records' in data['data']:
                            data['data']['area_metadata'] = []
                        
                        # Try parsing again with the fixed data
                        try:
                            if response_model:
                                return response_model(**data)
                            return data
                        except ValidationError as new_e:
                            # If it still fails, continue with other fixes
                            print(f"Still having validation issues after 24-hour forecast fix: {str(new_e)}")
                
                # Handle readings issues (station_id -> stationId mapping and data flattening)
                if 'station_id' in str(e) or 'value' in str(e) or 'Reading' in str(e) or 'stationId' in str(e):
                    if 'data' in data and 'readings' in data['data']:
                        for reading in data['data']['readings']:
                            # The API structure has timestamp at reading level and data array with stationId/value pairs
                            # but the frontend/older structure expects flattened readings
                            if 'data' in reading and isinstance(reading['data'], list):
                                # For air temperature, flatten the data structure
                                # Convert from: {"timestamp": "...", "data": [{"stationId": "S109", "value": 33}]}
                                # To: [{"station_id": "S109", "value": 33, "timestamp": "..."}]
                                flattened_data = []
                                timestamp = reading.get('timestamp')
                                for data_point in reading['data']:
                                    flattened_data.append({
                                        'station_id': data_point.get('stationId', data_point.get('id')),
                                        'value': data_point.get('value'),
                                        'timestamp': timestamp
                                    })
                                # Replace the readings array with flattened structure
                                data['data']['readings'] = flattened_data
                                break  # Only process first reading with nested data
                            elif 'id' in reading and 'station_id' not in reading:
                                reading['station_id'] = reading['id']
                    
                    # Try parsing again with the fixed data
                    try:
                        if response_model:
                            return response_model(**data)
                        return data
                    except ValidationError as new_e:
                        # If it still fails, fall back to the original error
                        print(f"Still having validation issues after station_id fix: {str(new_e)}")
                
                # If we couldn't fix it, raise the original error
                raise HTTPException(
                    status_code=500,
                    detail=f"Error parsing weather data: {str(e)}"
                )
    
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error communicating with weather API: {str(e)}"
        )


@router.get("/two-hour-forecast", response_model=WeatherResponse)
async def get_two_hour_forecast(
    date: Optional[str] = Query(
        None,
        description="SGT date for which to retrieve data (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
    ),
    pagination_token: Optional[str] = Query(
        None, description="Pagination token for retrieving subsequent data pages"
    ),
) -> Any:
    """
    Retrieve the latest two hour weather forecast from data.gov.sg API.
    
    - Updated half-hourly from NEA
    - Forecasts are given for multiple areas in Singapore
    """
    
    # Build the URL and parameters
    params = {}
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request("two-hr-forecast", params, WeatherResponse)


@router.get("/air-temperature", response_model=AirTemperatureResponse)
async def get_air_temperature(
    date: Optional[str] = Query(
        None,
        description="Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS (SGT). Example: 2024-07-16 or 2024-07-16T23:59:00",
    ),
    pagination_token: Optional[str] = Query(
        None, description="Pagination token for retrieving subsequent data pages"
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
async def get_wind_direction(
    date: Optional[str] = Query(
        None,
        description="SGT date for which to retrieve data (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
    ),
    pagination_token: Optional[str] = Query(
        None, description="Pagination token for retrieving subsequent data pages"
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
async def get_lightning(
    date: Optional[str] = Query(
        None,
        description="SGT date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS). Example: 2025-01-16 or 2025-01-16T23:59:00",
    ),
    pagination_token: Optional[str] = Query(
        None, description="Pagination token for retrieving subsequent data pages"
    ),
) -> Any:
    """
    Retrieve the latest lightning observation
    
    - Updated multiple times throughout the day
    """
    
    params = {
        "api": "lightning"  # Required parameter for this endpoint
    }
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request("weather", params, LightningResponse)


@router.get("/wbgt", response_model=WBGTResponse)
async def get_wbgt(
    date: Optional[str] = Query(
        None,
        description="SGT date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS). Example: 2025-01-16 or 2025-01-16T23:59:00",
    ),
    pagination_token: Optional[str] = Query(
        None, description="Pagination token for retrieving subsequent data pages"
    ),
) -> Any:
    """
    Retrieve the latest WBGT (Wet Bulb Globe Temperature) data for accurate heat stress assessment
    
    - Updated multiple times throughout the day
    - Unit of measure for readings is °C
    """
    
    params = {
        "api": "wbgt"  # Required parameter for this endpoint
    }
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

    return await make_api_request("weather", params, WBGTResponse)


@router.get("/twenty-four-hour-forecast", response_model=TwentyFourHourForecastResponse)
async def get_twenty_four_hour_forecast(
    date: Optional[str] = Query(
        None,
        description="SGT date (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS). Example: 2024-07-16 or 2024-07-16T23:59:00",
    ),
    pagination_token: Optional[str] = Query(
        None, description="Pagination token for retrieving subsequent data pages"
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

    return await make_api_request("twenty-four-hr-forecast", params, TwentyFourHourForecastResponse)


@router.get("/four-day-outlook", response_model=FourDayForecastResponse)
async def get_four_day_outlook(
    date: Optional[str] = Query(
        None,
        description="SGT date for which to retrieve data (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
    ),
    pagination_token: Optional[str] = Query(
        None, description="Pagination token for retrieving subsequent data pages"
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