"""
Tenant Management Schemas
"""

from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional
from datetime import datetime
import uuid


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class TenantUpdateRequest(BaseModel):
    """Schema for updating tenant information"""
    name: Optional[str] = Field(None, min_length=2, max_length=255, description="Organization name")
    email: Optional[EmailStr] = Field(None, description="Main contact email")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    
    # Branding
    logo_url: Optional[str] = Field(None, max_length=500, description="URL to company logo")
    
    # Address
    address: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    postal_code: Optional[str] = Field(None, max_length=20, description="Postal code")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    
    # Additional settings
    tax_id: Optional[str] = Field(None, max_length=50, description="Tax ID / VAT number")
    registration_number: Optional[str] = Field(None, max_length=100, description="Company registration number")
    website: Optional[str] = Field(None, max_length=255, description="Company website")
    
    # Branding colors
    primary_color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", description="Primary brand color (hex)")
    secondary_color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", description="Secondary brand color (hex)")
    
    # Default settings
    currency: Optional[str] = Field(None, max_length=3, description="Default currency (ISO code)")
    timezone: Optional[str] = Field(None, max_length=50, description="Default timezone")
    language: Optional[str] = Field(None, max_length=10, description="Default language")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Mustermann Immobilien GmbH",
                "email": "info@mustermann-immobilien.de",
                "phone": "+49 123 456789",
                "logo_url": "https://cdn.example.com/logos/mustermann.png",
                "address": "Musterstraße 123",
                "city": "Berlin",
                "postal_code": "10115",
                "country": "Deutschland",
                "tax_id": "DE123456789",
                "registration_number": "HRB 12345",
                "website": "https://mustermann-immobilien.de",
                "primary_color": "#3B82F6",
                "secondary_color": "#1E40AF",
                "currency": "EUR",
                "timezone": "Europe/Berlin",
                "language": "de"
            }
        }


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class BrandingSettings(BaseModel):
    """Branding settings"""
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#3B82F6"
    secondary_color: Optional[str] = "#1E40AF"
    
    class Config:
        from_attributes = True


class AddressInfo(BaseModel):
    """Address information"""
    street: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "Deutschland"
    
    class Config:
        from_attributes = True


class DefaultSettings(BaseModel):
    """Default tenant settings"""
    currency: str = "EUR"
    timezone: str = "Europe/Berlin"
    language: str = "de"
    
    class Config:
        from_attributes = True


class SubscriptionInfo(BaseModel):
    """Subscription information"""
    plan: str
    billing_cycle: str
    status: str
    start_date: datetime
    end_date: Optional[datetime] = None
    max_users: int
    max_properties: int
    storage_limit_gb: int
    
    class Config:
        from_attributes = True


class TenantDetailResponse(BaseModel):
    """Detailed tenant information response"""
    id: str
    name: str
    slug: str
    email: str
    phone: Optional[str] = None
    
    # Branding
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#3B82F6"
    secondary_color: Optional[str] = "#1E40AF"
    
    # Address
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "Deutschland"
    
    # Company info
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None
    website: Optional[str] = None
    
    # Default settings
    currency: str = "EUR"
    timezone: str = "Europe/Berlin"
    language: str = "de"
    
    # Subscription
    plan: str
    billing_cycle: str
    subscription_status: str
    max_users: int
    max_properties: int
    storage_limit_gb: int
    
    # Status
    is_active: bool
    created_at: datetime
    updated_at: datetime
    subscription_start_date: datetime
    subscription_end_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Mustermann Immobilien GmbH",
                "slug": "mustermann-immobilien",
                "email": "info@mustermann-immobilien.de",
                "phone": "+49 123 456789",
                "logo_url": "https://cdn.example.com/logos/mustermann.png",
                "primary_color": "#3B82F6",
                "secondary_color": "#1E40AF",
                "address": "Musterstraße 123",
                "city": "Berlin",
                "postal_code": "10115",
                "country": "Deutschland",
                "tax_id": "DE123456789",
                "registration_number": "HRB 12345",
                "website": "https://mustermann-immobilien.de",
                "currency": "EUR",
                "timezone": "Europe/Berlin",
                "language": "de",
                "plan": "professional",
                "billing_cycle": "yearly",
                "subscription_status": "active",
                "max_users": 25,
                "max_properties": 100,
                "storage_limit_gb": 50,
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "subscription_start_date": "2024-01-01T00:00:00Z",
                "subscription_end_date": None
            }
        }


class LogoUploadResponse(BaseModel):
    """Response after logo upload"""
    success: bool
    logo_url: str
    message: str = "Logo successfully uploaded"
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "logo_url": "https://cdn.example.com/logos/tenant-uuid.png",
                "message": "Logo successfully uploaded"
            }
        }

