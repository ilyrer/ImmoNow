"""
SLA Schemas
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SLAResponse(BaseModel):
    """SLA Response"""
    id: str
    name: str
    description: Optional[str] = None
    sla_type: str  # "first_response" oder "resolution"
    time_limit_hours: int
    applies_to: Dict[str, Any] = Field(default_factory=dict)
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


class CreateSLARequest(BaseModel):
    """Create SLA Request"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    sla_type: str = Field(..., description="first_response oder resolution")
    time_limit_hours: int = Field(..., ge=1, le=8760, description="Time limit in hours (max 1 year)")
    applies_to: Dict[str, Any] = Field(default_factory=dict)


class UpdateSLARequest(BaseModel):
    """Update SLA Request"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    time_limit_hours: Optional[int] = Field(None, ge=1, le=8760)
    applies_to: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class SLAInstanceResponse(BaseModel):
    """SLA Instance Response"""
    id: str
    sla_id: str
    sla_name: str
    sla_type: str
    task_id: str
    status: str  # active, paused, breached, resolved
    started_at: datetime
    deadline: datetime
    paused_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    breached_at: Optional[datetime] = None
    remaining_time_hours: float
    is_breached: bool
    
    model_config = ConfigDict(from_attributes=True)

