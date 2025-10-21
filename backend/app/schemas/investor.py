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


class InvestorPositionResponse(BaseModel):
    """Individual investor position/asset response"""
    id: str
    property_id: str
    property_title: str
    address: str
    city: str
    type: PropertyType
    sqm: int
    purchase_date: datetime
    purchase_price: float
    current_value: float
    monthly_rent: float
    occupancy_rate: float
    roi: float
    cashflow: float
    maintenance_costs: float
    property_tax: float
    insurance: float
    net_yield: float
    status: str
    
    model_config = ConfigDict(from_attributes=True)


class PerformanceDataPoint(BaseModel):
    """Performance data point"""
    date: datetime
    value: float
    roi: float
    cashflow: float
    vacancy_rate: float


class PerformanceResponse(BaseModel):
    """Performance response model"""
    period: str  # day, week, month, year
    data_points: List[PerformanceDataPoint]
    total_return: float
    annualized_return: float
    volatility: float
    sharpe_ratio: float


class VacancyAnalyticsResponse(BaseModel):
    """Vacancy analytics response"""
    current_vacancy_rate: float
    average_vacancy_rate: float
    vacancy_trend: List[Dict[str, Any]]  # Monthly data
    properties_by_vacancy: List[Dict[str, Any]]
    vacancy_costs: float
    recommendations: List[str]


class CostAnalyticsResponse(BaseModel):
    """Cost analytics response"""
    total_costs: float
    costs_by_category: Dict[str, float]
    cost_trend: List[Dict[str, Any]]  # Monthly data
    cost_per_sqm: float
    maintenance_efficiency: float
    recommendations: List[str]


class InvestorReportResponse(BaseModel):
    """Investor report response"""
    id: str
    title: str
    report_type: str  # monthly, quarterly, annual
    period_start: datetime
    period_end: datetime
    generated_at: datetime
    status: str  # generated, processing, failed
    file_url: Optional[str] = None
    summary: Dict[str, Any]


class GenerateReportRequest(BaseModel):
    """Generate report request"""
    report_type: str = Field(..., description="Type of report: monthly, quarterly, annual")
    period_start: datetime
    period_end: datetime
    include_charts: bool = Field(default=True)
    include_recommendations: bool = Field(default=True)


class MarketplacePackageResponse(BaseModel):
    """Marketplace package response"""
    id: str
    title: str
    description: str
    location: str
    total_value: float
    expected_roi: float
    min_investment: float
    max_investors: int
    current_investors: int
    status: str  # available, reserved, sold
    created_at: datetime
    expires_at: Optional[datetime] = None
    property_count: int
    property_types: List[str]


class ReservePackageRequest(BaseModel):
    """Reserve package request"""
    investment_amount: float
    contact_preference: str = Field(default="email")


class ROISimulationRequest(BaseModel):
    """ROI simulation request"""
    property_value: float
    down_payment: float
    interest_rate: float
    loan_term_years: int
    monthly_rent: float
    vacancy_rate: float
    maintenance_rate: float
    property_tax_rate: float
    insurance_rate: float
    management_fee_rate: float
    appreciation_rate: float


class ROISimulationResponse(BaseModel):
    """ROI simulation response"""
    monthly_cashflow: float
    annual_cashflow: float
    annual_roi: float
    total_return_5y: float
    total_return_10y: float
    break_even_months: int
    net_present_value: float
    internal_rate_return: float
    cash_on_cash_return: float
    scenarios: List[Dict[str, Any]]  # Different scenarios


class InvestorPortfolioResponse(BaseModel):
    """Investor portfolio response model"""
    assets: List[InvestorAssetResponse]
    kpis: PortfolioKPIsResponse
    generated_at: datetime


class PerformanceSnapshotResponse(BaseModel):
    """Performance snapshot response"""
    id: str
    snapshot_date: datetime
    total_portfolio_value: float
    average_roi: float
    total_cashflow: float
    vacancy_rate: float
    asset_count: int
    monthly_income: float
    annual_return: float
    portfolio_growth: float
    created_at: datetime


class VacancyRecordResponse(BaseModel):
    """Vacancy record response"""
    id: str
    property_id: str
    property_title: str
    record_date: datetime
    vacancy_rate: float
    vacant_units: int
    total_units: int
    vacancy_costs: float
    notes: Optional[str] = None


class CostRecordResponse(BaseModel):
    """Cost record response"""
    id: str
    property_id: str
    property_title: str
    record_date: datetime
    category: str
    amount: float
    description: Optional[str] = None
    invoice_number: Optional[str] = None
    vendor: Optional[str] = None


class SavedSimulationResponse(BaseModel):
    """Saved ROI simulation response"""
    id: str
    name: str
    scenario: str
    property_value: float
    down_payment: float
    interest_rate: float
    loan_term_years: int
    monthly_rent: float
    vacancy_rate: float
    maintenance_rate: float
    property_tax_rate: float
    insurance_rate: float
    management_fee_rate: float
    appreciation_rate: float
    monthly_cashflow: float
    annual_cashflow: float
    annual_roi: float
    total_return_5y: float
    total_return_10y: float
    break_even_months: int
    net_present_value: float
    internal_rate_return: float
    cash_on_cash_return: float
    roi_projection: List[float]
    scenarios: List[Dict[str, Any]]
    created_at: datetime


class SaveSimulationRequest(BaseModel):
    """Save simulation request"""
    name: str
    scenario: str
    property_value: float
    down_payment: float
    interest_rate: float
    loan_term_years: int
    monthly_rent: float
    vacancy_rate: float
    maintenance_rate: float
    property_tax_rate: float
    insurance_rate: float
    management_fee_rate: float
    appreciation_rate: float


class PackageReservationResponse(BaseModel):
    """Package reservation response"""
    id: str
    package_id: str
    package_title: str
    investor_name: str
    investor_email: str
    investor_phone: Optional[str] = None
    investment_amount: float
    contact_preference: str
    status: str
    reserved_at: datetime
    expires_at: datetime
    confirmed_at: Optional[datetime] = None
    notes: Optional[str] = None