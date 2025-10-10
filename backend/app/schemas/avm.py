"""
AVM Schemas
"""
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.schemas.common import PropertyType


class AvmRequest(BaseModel):
    """AVM request model"""
    address: str = Field(..., min_length=5, max_length=200)
    city: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., pattern=r'^\d{5}$')
    property_type: PropertyType
    size: int = Field(..., ge=10, le=10000)
    rooms: Optional[int] = Field(None, ge=1, le=20)
    build_year: Optional[int] = Field(None, ge=1800, le=2024)
    condition: Literal['new', 'renovated', 'good', 'needs_renovation', 'poor']
    features: List[str] = Field(default_factory=list)


class ValuationRange(BaseModel):
    """Valuation range model"""
    min: float
    max: float


class ValuationFactor(BaseModel):
    """Valuation factor model"""
    name: str
    impact: Literal['positive', 'neutral', 'negative']
    weight: int
    description: str


class ComparableListing(BaseModel):
    """Comparable listing model"""
    id: str
    address: str
    city: str
    postal_code: str
    property_type: PropertyType
    size: int
    rooms: Optional[int] = None
    build_year: int
    condition: str
    price: float
    price_per_sqm: float
    sold_date: datetime
    distance: float
    match_score: float
    
    model_config = ConfigDict(from_attributes=True)


class MarketTrendPoint(BaseModel):
    """Market trend point model"""
    date: str
    average_price: float
    average_price_per_sqm: float
    transaction_count: int
    median_price: float
    region: str


class MarketIntelligence(BaseModel):
    """Market intelligence model"""
    region: str
    postal_code: str
    demand_level: Literal['very_high', 'high', 'medium', 'low']
    supply_level: Literal['very_high', 'high', 'medium', 'low']
    price_growth_12m: float
    price_growth_36m: float
    average_days_on_market: int
    competition_index: int
    trends: List[MarketTrendPoint] = Field(default_factory=list)


class AvmResult(BaseModel):
    """AVM result model"""
    estimated_value: float
    confidence_level: Literal['high', 'medium', 'low']
    valuation_range: ValuationRange
    price_per_sqm: float
    methodology: str
    factors: List[ValuationFactor] = Field(default_factory=list)
    comparables_used: int
    last_updated: datetime


class AvmResponse(BaseModel):
    """AVM response model"""
    result: AvmResult
    comparables: List[ComparableListing] = Field(default_factory=list)
    market_intelligence: MarketIntelligence
