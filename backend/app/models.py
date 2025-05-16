import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import EmailStr, BaseModel, Field
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
    
    class Config:
        extra = "ignore"  # Ignore extra fields in API response


class AreaMetadata(BaseModel):
    name: str
    label_location: LabelLocation
    
    class Config:
        extra = "ignore"  # Ignore extra fields in API response


class ForecastPeriod(BaseModel):
    start: datetime
    end: datetime
    text: str
    
    class Config:
        extra = "ignore"  # Ignore extra fields in API response


class Forecast(BaseModel):
    area: str
    forecast: str
    
    class Config:
        extra = "ignore"  # Ignore extra fields in API response


class WeatherItem(BaseModel):
    updated_timestamp: datetime = Field(alias="update_timestamp")
    timestamp: datetime
    valid_period: ForecastPeriod
    forecasts: List[Forecast]
    
    class Config:
        extra = "ignore"  # Ignore extra fields in API response
        populate_by_name = True  # Allow populating by field name or alias


class WeatherData(BaseModel):
    area_metadata: List[AreaMetadata]
    items: List[WeatherItem]
    pagination_token: Optional[str] = None
    
    class Config:
        extra = "ignore"  # Ignore extra fields in API response


class WeatherResponse(BaseModel):
    code: int
    error_msg: Optional[str] = Field(None, alias="errorMsg")
    data: Optional[WeatherData] = None
    
    class Config:
        extra = "ignore"  # Ignore extra fields in API response
        populate_by_name = True  # Allow populating by field name or alias


class WeatherApiError(BaseModel):
    code: int
    name: str
    data: Optional[Dict[str, Any]] = None
    error_msg: str = Field(alias="errorMsg")
    
    class Config:
        extra = "ignore"  # Ignore extra fields in API response
