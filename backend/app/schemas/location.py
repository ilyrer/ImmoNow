"""
Location Market Data Schemas
Pydantic models for Location API
"""

from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class LocationMarketDataBase(BaseModel):
    """Base schema for location market data"""

    city: str = Field(..., min_length=1, max_length=200)
    state: Optional[str] = Field(None, max_length=100)
    country: str = Field(default="Deutschland", max_length=100)
    postal_code_start: Optional[str] = Field(None, max_length=10)
    postal_code_end: Optional[str] = Field(None, max_length=10)
    base_price_per_sqm: float = Field(..., ge=0)
    is_premium_location: bool = False
    is_suburban: bool = False
    population: Optional[int] = Field(None, ge=0)
    location_type: Literal["metropolis", "city", "town", "village"] = "city"
    is_active: bool = True


class LocationMarketDataCreate(LocationMarketDataBase):
    """Schema for creating a new location"""

    pass


class LocationMarketDataUpdate(BaseModel):
    """Schema for updating a location (all fields optional)"""

    city: Optional[str] = Field(None, min_length=1, max_length=200)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code_start: Optional[str] = Field(None, max_length=10)
    postal_code_end: Optional[str] = Field(None, max_length=10)
    base_price_per_sqm: Optional[float] = Field(None, ge=0)
    is_premium_location: Optional[bool] = None
    is_suburban: Optional[bool] = None
    population: Optional[int] = Field(None, ge=0)
    location_type: Optional[Literal["metropolis", "city", "town", "village"]] = None
    is_active: Optional[bool] = None


class LocationMarketDataResponse(LocationMarketDataBase):
    """Schema for location response"""

    id: int
    adjusted_price_per_sqm: float = Field(
        ..., description="Base price adjusted for premium/suburban factors"
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_obj(cls, obj):
        """Convert Django model to Pydantic model"""
        return cls(
            id=obj.id,
            city=obj.city,
            state=obj.state or "",
            country=obj.country,
            postal_code_start=obj.postal_code_start or "",
            postal_code_end=obj.postal_code_end or "",
            base_price_per_sqm=float(obj.base_price_per_sqm),
            is_premium_location=obj.is_premium_location,
            is_suburban=obj.is_suburban,
            population=obj.population,
            location_type=obj.location_type,
            is_active=obj.is_active,
            adjusted_price_per_sqm=obj.get_adjusted_price(),
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )


class LocationSearchResult(BaseModel):
    """Lightweight schema for search/autocomplete results"""

    id: int
    city: str
    state: Optional[str]
    postal_code_start: Optional[str]
    population: Optional[int]
    base_price_per_sqm: float

    model_config = ConfigDict(from_attributes=True)


class LocationListResponse(BaseModel):
    """Paginated list of locations"""

    items: List[LocationMarketDataResponse]
    total: int
    page: int = 1
    page_size: int = 50
