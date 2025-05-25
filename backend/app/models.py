import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import EmailStr, BaseModel, Field, model_validator
from sqlmodel import Field as SQLModelField, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = SQLModelField(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = SQLModelField(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = SQLModelField(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = SQLModelField(max_length=255)
    password: str = SQLModelField(min_length=8, max_length=40)
    full_name: str | None = SQLModelField(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = SQLModelField(default=None, max_length=255)  # type: ignore
    password: str | None = SQLModelField(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = SQLModelField(default=None, max_length=255)
    email: EmailStr | None = SQLModelField(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = SQLModelField(min_length=8, max_length=40)
    new_password: str = SQLModelField(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = SQLModelField(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = SQLModelField(min_length=1, max_length=255)
    description: str | None = SQLModelField(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = SQLModelField(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = SQLModelField(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = SQLModelField(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = SQLModelField(min_length=8, max_length=40)


# Weather models
class LabelLocation(BaseModel):
    latitude: float
    longitude: float
    
    model_config = {
        "extra": "ignore"  # Ignore extra fields in API response
    }


class AreaMetadata(BaseModel):
    name: str
    label_location: LabelLocation
    
    model_config = {
        "extra": "ignore"  # Ignore extra fields in API response
    }


class ForecastPeriod(BaseModel):
    start: datetime
    end: datetime
    text: str
    
    model_config = {
        "extra": "ignore"  # Ignore extra fields in API response
    }


class Forecast(BaseModel):
    area: str
    forecast: str
    
    model_config = {
        "extra": "ignore"  # Ignore extra fields in API response
    }


class WeatherItem(BaseModel):
    updated_timestamp: datetime = Field(alias="update_timestamp")
    timestamp: datetime
    valid_period: ForecastPeriod
    forecasts: List[Forecast]
    
    model_config = {
        "extra": "ignore",  # Ignore extra fields in API response
        "populate_by_name": True  # Allow populating by field name or alias
    }


class WeatherData(BaseModel):
    area_metadata: List[AreaMetadata]
    items: List[WeatherItem]
    pagination_token: Optional[str] = None
    
    model_config = {
        "extra": "ignore"  # Ignore extra fields in API response
    }


class WeatherResponse(BaseModel):
    code: int
    error_msg: Optional[str] = Field(None, alias="errorMsg")
    data: Optional[Dict[str, Any]] = None
    
    model_config = {
        "extra": "ignore",  # Ignore extra fields in API response
        "populate_by_name": True  # Allow populating by field name or alias
    }


class WeatherApiError(BaseModel):
    code: int
    name: str
    data: Optional[Dict[str, Any]] = None
    error_msg: str = Field(alias="errorMsg")
    
    model_config = {
        "extra": "ignore"  # Ignore extra fields in API response
    }


# Models for air temperature readings
class Station(BaseModel):
    id: str
    device_id: Optional[str] = Field(None, alias="deviceId")  # API returns deviceId
    name: str
    location: Dict[str, float]  # Contains latitude and longitude
    
    model_config = {
        "extra": "ignore",  # Ignore extra fields in API response
        "populate_by_name": True  # Allow both snake_case and camelCase
    }


class Reading(BaseModel):
    station_id: Optional[str] = Field(None, alias="id")  # API returns 'id' instead of 'station_id'
    value: Optional[float] = None
    timestamp: datetime
    
    model_config = {
        "extra": "ignore",  # Ignore extra fields in API response
        "populate_by_name": True  # Allow both snake_case and camelCase
    }


class AirTemperatureData(BaseModel):
    stations: List[Station]
    readings: List[Reading]
    reading_type: str = Field(alias="readingType")
    reading_unit: str = Field(alias="readingUnit")
    pagination_token: Optional[str] = Field(None, alias="paginationToken")
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


class AirTemperatureResponse(BaseModel):
    code: int
    error_msg: Optional[str] = Field(None, alias="errorMsg")
    data: Optional[AirTemperatureData] = None
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


# Models for wind direction readings
class WindDirectionData(BaseModel):
    stations: List[Station]
    readings: List[Reading]
    reading_type: str = Field(alias="readingType")
    reading_unit: str = Field(alias="readingUnit")
    pagination_token: Optional[str] = Field(None, alias="paginationToken")
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


class WindDirectionResponse(BaseModel):
    code: int
    error_msg: Optional[str] = Field(None, alias="errorMsg")
    data: Optional[WindDirectionData] = None
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


# Models for lightning observation
class LightningItem(BaseModel):
    # Generic item model for lightning data
    # The actual structure can be expanded based on the real API response
    pass
    
    model_config = {
        "extra": "ignore"
    }


class LightningRecord(BaseModel):
    datetime: str
    item: Dict[str, Any]  # Flexible structure to accommodate different data formats
    updated_timestamp: Optional[datetime] = Field(None)
    
    model_config = {
        "extra": "ignore"
    }


class LightningData(BaseModel):
    records: List[LightningRecord]
    pagination_token: Optional[str] = Field(None, alias="paginationToken")
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


class LightningResponse(BaseModel):
    code: int
    error_msg: Optional[str] = Field(None, alias="errorMsg")
    data: Optional[LightningData] = None
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


# Models for WBGT (Wet Bulb Globe Temperature) observations
class WBGTRecord(BaseModel):
    datetime: str
    item: Dict[str, Any]  # Flexible structure to accommodate different data formats
    updated_timestamp: Optional[datetime] = Field(None)
    
    model_config = {
        "extra": "ignore"
    }


class WBGTData(BaseModel):
    records: List[WBGTRecord]
    pagination_token: Optional[str] = Field(None, alias="paginationToken")
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


class WBGTResponse(BaseModel):
    code: int
    error_msg: Optional[str] = Field(None, alias="errorMsg")
    data: Optional[WBGTData] = None
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


# Models for 24-hour weather forecast
class ForecastItem(BaseModel):
    date: str
    updated_timestamp: datetime
    timestamp: datetime
    forecasts: List[Forecast]
    
    model_config = {
        "extra": "ignore"
    }


class TwentyFourHourForecastData(BaseModel):
    area_metadata: List[AreaMetadata]
    records: List[ForecastItem]
    pagination_token: Optional[str] = Field(None, alias="paginationToken")
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


class TwentyFourHourForecastResponse(BaseModel):
    code: int
    error_msg: Optional[str] = Field(None, alias="errorMsg")
    data: Optional[TwentyFourHourForecastData] = None
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True
    }


# Models for 4-day weather forecast
class FourDayForecastItem(BaseModel):
    date: str
    updated_timestamp: datetime = Field(alias="updatedTimestamp")
    timestamp: datetime
    forecasts: List[Dict[str, Any]]  # Flexible structure for the forecasts
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True  # Allow both snake_case and camelCase
    }


class FourDayForecastData(BaseModel):
    records: List[FourDayForecastItem]
    pagination_token: Optional[str] = Field(None, alias="paginationToken")
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True  # Allow both snake_case and camelCase
    }


class FourDayForecastResponse(BaseModel):
    code: int
    error_msg: Optional[str] = Field(None, alias="errorMsg")
    data: Optional[FourDayForecastData] = None
    
    model_config = {
        "extra": "ignore",
        "populate_by_name": True  # Allow both snake_case and camelCase
    }
