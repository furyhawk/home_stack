from datetime import datetime
from typing import Any, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError

# Import directly from models file
from app.models import WeatherApiError, WeatherResponse

router = APIRouter(prefix="/weather", tags=["weather"])

WEATHER_API_BASE_URL = "https://api-open.data.gov.sg/v2/real-time/api"


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
    url = f"{WEATHER_API_BASE_URL}/two-hr-forecast"
    params = {}
    if date:
        params["date"] = date
    if pagination_token:
        params["paginationToken"] = pagination_token

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
                # Debug: Print the keys received from the API response
                print(f"API response keys: {data.keys()}")
                if 'items' in data.get('data', {}):
                    print(f"First item keys: {data['data']['items'][0].keys()}")
                
                # Try parsing with the model
                return WeatherResponse(**data)
            except ValidationError as e:
                # If there's a validation error, try to provide more detailed error information
                print(f"Validation error parsing weather data: {str(e)}")
                
                # If the error is specifically about missing update_timestamp vs updated_timestamp,
                # try to manually fix the response data
                if 'update_timestamp' in str(e) or 'updated_timestamp' in str(e):
                    # Try to manually fix the data structure
                    if 'data' in data and 'items' in data['data']:
                        for item in data['data']['items']:
                            if 'update_timestamp' in item and 'updated_timestamp' not in item:
                                item['updated_timestamp'] = item['update_timestamp']
                        
                        # Try parsing again with the fixed data
                        try:
                            return WeatherResponse(**data)
                        except ValidationError:
                            # If it still fails, fall back to the original error
                            pass
                
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