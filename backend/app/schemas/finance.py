"""
Finance Pydantic Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

from app.schemas.common import PaginatedResponse


class FinancingType(str, Enum):
    MORTGAGE = "mortgage"
    LEASE = "lease"
    INVESTMENT = "investment"
    REFINANCING = "refinancing"


class PaymentFrequency(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"


class FinancingCalculationRequest(BaseModel):
    """Financing calculation request"""
    property_value: float
    down_payment: float
    interest_rate: float
    loan_term_years: int
    financing_type: FinancingType
    payment_frequency: PaymentFrequency = PaymentFrequency.MONTHLY
    additional_costs: Optional[Dict[str, float]] = None
    tax_rate: Optional[float] = None
    insurance_rate: Optional[float] = None


class FinancingCalculationResponse(BaseModel):
    """Financing calculation response"""
    monthly_payment: float
    total_payment: float
    total_interest: float
    loan_amount: float
    down_payment: float
    property_value: float
    loan_to_value_ratio: float
    debt_service_coverage_ratio: Optional[float] = None
    amortization_schedule: List[Dict[str, Any]]
    payment_breakdown: Dict[str, float]
    total_costs: Dict[str, float]
    
    model_config = ConfigDict(from_attributes=True)


class InvestmentAnalysisRequest(BaseModel):
    """Investment analysis request"""
    property_value: float
    purchase_price: float
    renovation_costs: float
    monthly_rent: float
    operating_expenses: float
    vacancy_rate: float
    appreciation_rate: float
    holding_period_years: int
    financing_details: Optional[FinancingCalculationRequest] = None


class InvestmentAnalysisResponse(BaseModel):
    """Investment analysis response"""
    total_investment: float
    monthly_cash_flow: float
    annual_cash_flow: float
    net_operating_income: float
    cap_rate: float
    cash_on_cash_return: float
    internal_rate_of_return: float
    net_present_value: float
    gross_rent_multiplier: float
    debt_service_coverage_ratio: Optional[float] = None
    break_even_analysis: Dict[str, Any]
    sensitivity_analysis: Dict[str, Any]
    
    model_config = ConfigDict(from_attributes=True)


class BankComparisonRequest(BaseModel):
    """Bank comparison request"""
    loan_amount: float
    loan_term_years: int
    property_value: float
    borrower_profile: Dict[str, Any]


class BankOffer(BaseModel):
    """Bank offer model"""
    bank_name: str
    interest_rate: float
    monthly_payment: float
    total_payment: float
    total_interest: float
    fees: Dict[str, float]
    conditions: List[str]
    approval_probability: float
    processing_time_days: int
    
    model_config = ConfigDict(from_attributes=True)


class BankComparisonResponse(BaseModel):
    """Bank comparison response"""
    offers: List[BankOffer]
    best_offer: BankOffer
    savings_comparison: Dict[str, float]
    recommendation: str
    analysis_date: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FinancingScenario(BaseModel):
    """Financing scenario model"""
    id: str
    name: str
    description: str
    calculation: FinancingCalculationResponse
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CreateScenarioRequest(BaseModel):
    """Create financing scenario request"""
    name: str
    description: str
    calculation_request: FinancingCalculationRequest


class UpdateScenarioRequest(BaseModel):
    """Update financing scenario request"""
    name: Optional[str] = None
    description: Optional[str] = None
    calculation_request: Optional[FinancingCalculationRequest] = None


class ExportRequest(BaseModel):
    """Export request"""
    format: str  # "pdf", "excel", "word"
    include_charts: bool = True
    include_schedule: bool = True
    custom_template: Optional[str] = None


class ExportResponse(BaseModel):
    """Export response"""
    file_url: str
    file_name: str
    file_size: int
    expires_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
