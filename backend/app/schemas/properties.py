"""
Property Schemas
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_serializer,
    field_validator,
    model_validator,
)

from app.schemas.common import PropertyType, UserResponse


class Address(BaseModel):
    """Address model"""

    street: str
    house_number: Optional[str] = None
    city: str
    zip_code: Optional[str] = None
    postal_code: Optional[str] = None
    state: Optional[str] = None
    country: str = "Deutschland"

    model_config = ConfigDict(from_attributes=True)


class ContactPerson(BaseModel):
    """Contact person model"""

    id: str
    name: str
    email: str
    phone: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class ContactPersonCreate(BaseModel):
    """Contact person creation model - flexible input"""

    # Support both formats: name OR (first_name + last_name)
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    phone: str
    role: Optional[str] = "Ansprechpartner"

    @model_validator(mode="before")
    @classmethod
    def build_name_from_parts(cls, values):
        """Build name from first_name and last_name if name is not provided"""
        if isinstance(values, dict):
            # If name is already provided, use it
            if values.get("name"):
                return values

            # Build name from first_name and last_name
            first_name = str(values.get("first_name", "")).strip()
            last_name = str(values.get("last_name", "")).strip()

            if first_name or last_name:
                full_name = f"{first_name} {last_name}".strip()
                values["name"] = full_name if full_name else "Unbekannt"
            else:
                values["name"] = "Unbekannt"

        return values

    model_config = ConfigDict(extra="ignore")


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
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    alt_text: Optional[str] = None
    is_primary: bool = False
    order: int = 0
    size: int = 0
    mime_type: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    uploaded_by: Optional[str] = None

    @field_serializer("uploaded_at")
    def serialize_uploaded_at(self, value: Optional[datetime]) -> Optional[str]:
        """Serialize datetime to ISO format string"""
        return value.isoformat() if value else None

    model_config = ConfigDict(from_attributes=True)


class PropertyDocument(BaseModel):
    """Property document model"""

    id: str
    url: Optional[str] = None
    name: str
    document_type: str = "other"
    size: int = 0
    mime_type: str
    uploaded_at: Optional[datetime] = None
    uploaded_by: Optional[str] = None

    @field_serializer("uploaded_at")
    def serialize_uploaded_at(self, value: Optional[datetime]) -> Optional[str]:
        """Serialize datetime to ISO format string"""
        return value.isoformat() if value else None

    model_config = ConfigDict(from_attributes=True)


class PropertyResponse(BaseModel):
    """Property response model"""

    id: str
    title: str
    description: str
    status: str
    property_type: PropertyType

    # Price fields
    price: Optional[float] = None
    price_currency: str = "EUR"
    price_type: str = "sale"

    location: str

    # Area fields
    living_area: Optional[int] = None
    total_area: Optional[int] = None
    plot_area: Optional[int] = None

    # Room fields
    rooms: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floors: Optional[int] = None

    # Building info
    year_built: Optional[int] = None
    energy_class: Optional[str] = None
    energy_consumption: Optional[int] = None
    heating_type: Optional[str] = None

    # Location coordinates
    coordinates_lat: Optional[float] = None
    coordinates_lng: Optional[float] = None

    # Additional data
    amenities: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

    address: Optional[Address] = None
    contact_person: Optional[ContactPerson] = None
    features: Optional[PropertyFeatures] = None
    images: List[PropertyImage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    created_by: str

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format string"""
        return value.isoformat() if value else None

    model_config = ConfigDict(from_attributes=True)


class CreatePropertyRequest(BaseModel):
    """Create property request model"""

    title: str = Field(..., min_length=5, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    property_type: PropertyType
    status: Optional[str] = Field("vorbereitung", max_length=50)

    # Price fields
    price: Optional[float] = Field(None, ge=0)
    price_currency: Optional[str] = Field("EUR", max_length=3)
    price_type: Optional[str] = Field("sale", max_length=20)

    location: str = Field(..., min_length=1, max_length=255)

    model_config = ConfigDict(extra="ignore")  # Ignore extra fields like created_by

    # Area fields
    living_area: Optional[int] = Field(None, ge=1)
    total_area: Optional[int] = Field(None, ge=1)
    plot_area: Optional[int] = Field(None, ge=1)

    # Room fields
    rooms: Optional[int] = Field(None, ge=1)
    bedrooms: Optional[int] = Field(None, ge=1)
    bathrooms: Optional[int] = Field(None, ge=1)
    floors: Optional[int] = Field(None, ge=1)

    # Building info
    year_built: Optional[int] = Field(None, ge=1800, le=2025)
    energy_class: Optional[str] = Field(None, max_length=10)
    energy_consumption: Optional[int] = Field(None, ge=0)
    heating_type: Optional[str] = Field(None, max_length=100)

    # Energy Certificate fields
    energy_certificate_type: Optional[str] = Field(None, max_length=50)
    energy_certificate_valid_until: Optional[str] = None
    energy_certificate_issue_date: Optional[str] = None
    co2_emissions: Optional[int] = Field(None, ge=0)

    # Location coordinates
    coordinates_lat: Optional[float] = Field(None, ge=-90, le=90)
    coordinates_lng: Optional[float] = Field(None, ge=-180, le=180)

    # Additional data
    amenities: Optional[List[str]] = Field(default_factory=list)
    tags: Optional[List[str]] = Field(default_factory=list)

    address: Optional[Address] = None
    contact_person: Optional[ContactPersonCreate] = None
    features: Optional[PropertyFeatures] = None

    @field_validator(
        "living_area",
        "total_area",
        "plot_area",
        "rooms",
        "bedrooms",
        "bathrooms",
        "floors",
        "year_built",
        mode="before",
    )
    @classmethod
    def convert_zero_to_none(cls, v):
        """Convert 0 to None for optional numeric fields"""
        if v == 0 or v == "" or v == "0":
            return None
        return v


class UpdatePropertyRequest(BaseModel):
    """Update property request model"""

    title: Optional[str] = Field(None, min_length=5, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = None
    property_type: Optional[PropertyType] = None

    # Price fields
    price: Optional[float] = Field(None, ge=0)
    price_currency: Optional[str] = Field(None, max_length=3)
    price_type: Optional[str] = Field(None, max_length=20)

    location: Optional[str] = Field(None, min_length=1, max_length=255)

    model_config = ConfigDict(extra="ignore")  # Ignore extra fields

    # Area fields
    living_area: Optional[int] = Field(None, ge=1)
    total_area: Optional[int] = Field(None, ge=1)
    plot_area: Optional[int] = Field(None, ge=1)

    # Room fields
    rooms: Optional[int] = Field(None, ge=1)
    bedrooms: Optional[int] = Field(None, ge=1)
    bathrooms: Optional[int] = Field(None, ge=1)
    floors: Optional[int] = Field(None, ge=1)

    # Building info
    year_built: Optional[int] = Field(None, ge=1800, le=2025)
    energy_class: Optional[str] = Field(None, max_length=10)
    energy_consumption: Optional[int] = Field(None, ge=0)
    heating_type: Optional[str] = Field(None, max_length=100)

    # Energy Certificate fields
    energy_certificate_type: Optional[str] = Field(None, max_length=50)
    energy_certificate_valid_until: Optional[str] = None
    energy_certificate_issue_date: Optional[str] = None
    co2_emissions: Optional[int] = Field(None, ge=0)

    # Location coordinates
    coordinates_lat: Optional[float] = Field(None, ge=-90, le=90)
    coordinates_lng: Optional[float] = Field(None, ge=-180, le=180)

    # Additional data
    amenities: Optional[List[str]] = None
    tags: Optional[List[str]] = None

    address: Optional[Address] = None
    contact_person: Optional[ContactPersonCreate] = None
    features: Optional[PropertyFeatures] = None


class PropertyListResponse(BaseModel):
    """Property list response model"""

    properties: List[PropertyResponse]
    total: int
    page: int
    size: int
    pages: int
