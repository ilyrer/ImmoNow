"""
Contact Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import ContactResponse, PaginatedResponse, PageResponse


class CreateContactRequest(BaseModel):
    """Create contact request model"""
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=50)
    company: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    status: str = Field("Lead", max_length=50)
    priority: Optional[str] = Field("medium", max_length=20)
    location: Optional[str] = Field(None, max_length=255)
    avatar: Optional[str] = None
    budget: Optional[float] = Field(None, ge=0)
    budget_currency: str = Field("EUR", max_length=3)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    last_contact: Optional[datetime] = None


class UpdateContactRequest(BaseModel):
    """Update contact request model"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    company: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = None
    priority: Optional[str] = None
    location: Optional[str] = None
    avatar: Optional[str] = None
    budget: Optional[float] = Field(None, ge=0)
    budget_currency: Optional[str] = Field(None, max_length=3)
    preferences: Optional[Dict[str, Any]] = None
    lead_score: Optional[int] = Field(None, ge=0, le=100)
    last_contact: Optional[datetime] = None


class ContactListResponse(BaseModel):
    """Contact list response model"""
    contacts: List[ContactResponse]
    total: int
    page: int
    size: int
    pages: int
