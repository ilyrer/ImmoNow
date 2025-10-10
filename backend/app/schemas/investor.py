"""
Investor Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import PropertyType


class InvestorAssetResponse(BaseModel):
    """Investor asset response model"""
    id: str
    address: str
    city: str
    type: PropertyType
    sqm: int
    value: float
    roi: float
    cashflow: float
    status: str
    purchase_date: datetime
    purchase_price: float
    current_value: float
    monthly_rent: float
    occupancy_rate: float
    maintenance_costs: float
    property_tax: float
    insurance: float
    
    model_config = ConfigDict(from_attributes=True)


class PortfolioKPIsResponse(BaseModel):
    """Portfolio KPIs response model"""
    total_value: float
    average_roi: float
    total_cashflow: float
    vacancy_rate: float
    asset_count: int
    monthly_income: float
    annual_return: float
    portfolio_growth: float


class InvestorPortfolioResponse(BaseModel):
    """Investor portfolio response model"""
    assets: List[InvestorAssetResponse]
    kpis: PortfolioKPIsResponse
    generated_at: datetime
