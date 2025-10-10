"""
Appointment Schemas
"""
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import AppointmentType, AppointmentStatus, UserResponse


class Attendee(BaseModel):
    """Attendee model"""
    id: str
    name: str
    email: str
    role: Optional[str] = None
    status: Literal['pending', 'accepted', 'declined']
    
    model_config = ConfigDict(from_attributes=True)


class AppointmentResponse(BaseModel):
    """Appointment response model"""
    id: str
    title: str
    description: Optional[str] = None
    type: AppointmentType
    status: AppointmentStatus
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = None
    attendees: List[Attendee] = Field(default_factory=list)
    property_id: Optional[str] = None
    property_title: Optional[str] = None
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    
    model_config = ConfigDict(from_attributes=True)


class CreateAppointmentRequest(BaseModel):
    """Create appointment request model"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    type: AppointmentType
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = Field(None, max_length=255)
    property_id: Optional[str] = None
    contact_id: Optional[str] = None
    attendees: List[Dict[str, Any]] = Field(default_factory=list)


class UpdateAppointmentRequest(BaseModel):
    """Update appointment request model"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    type: Optional[AppointmentType] = None
    status: Optional[AppointmentStatus] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=255)
    property_id: Optional[str] = None
    contact_id: Optional[str] = None
    attendees: Optional[List[Dict[str, Any]]] = None


class AppointmentListResponse(BaseModel):
    """Appointment list response model"""
    appointments: List[AppointmentResponse]
    total: int
    page: int
    size: int
    pages: int
