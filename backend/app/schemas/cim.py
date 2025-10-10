"""
CIM Schemas
"""
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class RecentPropertySummary(BaseModel):
    """Recent property summary model"""
    id: str
    title: str
    address: str
    price: Optional[float] = None
    price_formatted: str
    status: str
    status_label: str
    created_at: datetime
    last_contact: Optional[datetime] = None
    lead_quality: Literal['high', 'medium', 'low']
    lead_quality_label: str
    contact_count: int
    match_score: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class RecentContactSummary(BaseModel):
    """Recent contact summary model"""
    id: str
    name: str
    email: str
    phone: str
    status: str
    status_label: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_currency: str
    budget_formatted: str
    created_at: datetime
    last_contact: Optional[datetime] = None
    last_action: str
    lead_score: int
    matching_properties: List[str] = Field(default_factory=list)
    matching_count: int
    
    model_config = ConfigDict(from_attributes=True)


class PerfectMatch(BaseModel):
    """Perfect match model"""
    contact_id: str
    contact_name: str
    contact_budget: str
    property_id: str
    property_title: str
    property_price: str
    match_score: float
    lead_quality: str
    contact_lead_score: int
    
    model_config = ConfigDict(from_attributes=True)


class CIMSummary(BaseModel):
    """CIM summary model"""
    total_properties: int
    active_properties: int
    new_properties_last_30_days: int
    total_contacts: int
    new_leads_last_30_days: int
    high_priority_contacts: int
    matched_contacts_properties: int


class CIMOverviewResponse(BaseModel):
    """CIM overview response model"""
    recent_properties: List[RecentPropertySummary]
    recent_contacts: List[RecentContactSummary]
    perfect_matches: List[PerfectMatch]
    summary: CIMSummary
    generated_at: datetime
