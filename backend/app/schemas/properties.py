"""
Property Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_serializer

from app.schemas.common import PropertyType, UserResponse


class Address(BaseModel):
    """Address model"""
    street: str
    city: str
    zip_code: str
    state: str
    country: str
    
    model_config = ConfigDict(from_attributes=True)


class ContactPerson(BaseModel):
    """Contact person model"""
    id: str
    name: str
    email: str
    phone: str
    role: str
    
    model_config = ConfigDict(from_attributes=True)


class PropertyFeatures(BaseModel):
    """Property features model"""
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    year_built: Optional[int] = None
    energy_class: Optional[str] = None
    heating_type: Optional[str] = None
    parking_spaces: Optional[int] = None
    balcony: bool = False
    garden: bool = False
    elevator: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class PropertyImage(BaseModel):
    """Property image model"""
    id: str
    url: str
    alt_text: Optional[str] = None
    is_primary: bool = False
    order: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class PropertyResponse(BaseModel):
    """Property response model"""
    id: str
    title: str
    description: str
    status: str
    property_type: PropertyType
    price: Optional[float] = None
    location: str
    living_area: Optional[int] = None
    rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    year_built: Optional[int] = None
    address: Optional[Address] = None
    contact_person: Optional[ContactPerson] = None
    features: Optional[PropertyFeatures] = None
    images: List[PropertyImage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    created_by: str
    
    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format string"""
        return value.isoformat() if value else None
    
    model_config = ConfigDict(from_attributes=True)


class CreatePropertyRequest(BaseModel):
    """Create property request model"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    property_type: PropertyType
    price: Optional[float] = Field(None, ge=0)
    location: str = Field(..., min_length=1, max_length=255)
    living_area: Optional[int] = Field(None, ge=1)
    rooms: Optional[int] = Field(None, ge=1)
    bathrooms: Optional[int] = Field(None, ge=1)
    year_built: Optional[int] = Field(None, ge=1800, le=2024)
    address: Optional[Address] = None
    contact_person: Optional[ContactPerson] = None
    features: Optional[PropertyFeatures] = None


class UpdatePropertyRequest(BaseModel):
    """Update property request model"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = None
    property_type: Optional[PropertyType] = None
    price: Optional[float] = Field(None, ge=0)
    location: Optional[str] = Field(None, min_length=1, max_length=255)
    living_area: Optional[int] = Field(None, ge=1)
    rooms: Optional[int] = Field(None, ge=1)
    bathrooms: Optional[int] = Field(None, ge=1)
    year_built: Optional[int] = Field(None, ge=1800, le=2024)
    address: Optional[Address] = None
    contact_person: Optional[ContactPerson] = None
    features: Optional[PropertyFeatures] = None


class PropertyListResponse(BaseModel):
    """Property list response model"""
    properties: List[PropertyResponse]
    total: int
    page: int
    size: int
    pages: int
