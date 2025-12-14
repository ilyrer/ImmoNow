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
    additional_info: Dict[str, Any] = Field(default_factory=dict)
    address: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None
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
    additional_info: Optional[Dict[str, Any]] = None
    address: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    lead_score: Optional[int] = Field(None, ge=0, le=100)
    last_contact: Optional[datetime] = None


class ContactListResponse(BaseModel):
    """Contact list response model"""

    contacts: List[ContactResponse]
    total: int
    page: int
    size: int
    pages: int


class LeadScoreSignal(BaseModel):
    """Individual signal contributing to lead score"""

    name: str = Field(..., description="Signal name")
    value: str = Field(..., description="Signal value")
    impact: int = Field(..., description="Point impact on score")
    icon: str = Field(..., description="Remix icon name")


class LeadScoreBreakdown(BaseModel):
    """Breakdown of lead score by factor"""

    factor: str = Field(..., description="Factor name")
    value: float = Field(..., description="Points from this factor")
    weight: int = Field(..., description="Maximum weight for factor")
    description: str = Field(..., description="Factor description")


class LeadScoreResponse(BaseModel):
    """Lead score response with breakdown"""

    score: int = Field(..., ge=0, le=100, description="Total lead score")
    category: str = Field(..., description="Score category: kalt/warm/heiß")
    category_label: str = Field(..., description="Display label for category")
    breakdown: List[LeadScoreBreakdown] = Field(
        ..., description="Score breakdown by factor"
    )
    signals: List[LeadScoreSignal] = Field(..., description="Top contributing signals")
    last_updated: str = Field(..., description="ISO timestamp of last calculation")


class AiInsightsResponse(BaseModel):
    """AI-generated insights for contact"""

    summary: str = Field(..., description="3-5 sentence briefing about the contact")
    score_explanation: str = Field(..., description="Explanation of lead score drivers")
    segment: str = Field(..., description="Customer segment/classification")
    top_signals: List[LeadScoreSignal] = Field(..., description="Top 3 signals")
    generated_at: str = Field(..., description="ISO timestamp of generation")


class NextActionRecommendation(BaseModel):
    """AI-recommended next best action"""

    action_type: str = Field(..., description="Action type: call/email/meeting/note")
    urgency: str = Field(..., description="Urgency: 24h/48h/this_week")
    reason: str = Field(..., description="1-2 sentence reason")
    script: str = Field(..., description="2-3 sentence suggested script/template")
    priority: str = Field("medium", description="Priority level")


class NextActionRequest(BaseModel):
    """Request for next action recommendation"""

    goal: Optional[str] = Field(
        None, description="Optional goal: follow_up/appointment/proposal/check_in"
    )


class NextActionResponse(BaseModel):
    """Next action response"""

    recommendation: NextActionRecommendation
    contact_context: Dict[str, Any] = Field(..., description="Contact context used")
    generated_at: str = Field(..., description="ISO timestamp")
