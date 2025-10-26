"""
Payroll Schemas
Pydantic models for payroll-related operations
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class PayrollStatus(str, Enum):
    """Payroll run status"""
    DRAFT = "draft"
    APPROVED = "approved"
    PAID = "paid"
    CANCELLED = "cancelled"


# Payroll Run Schemas
class PayrollRunBase(BaseModel):
    """Base payroll run schema"""
    period: str = Field(..., description="Periode (YYYY-MM)")
    period_start: date = Field(..., description="Periode von")
    period_end: date = Field(..., description="Periode bis")
    notes: Optional[str] = Field(None, description="Interne Notizen")
    
    @validator('period')
    def validate_period(cls, v):
        """Validate period format"""
        if not v or len(v) != 7 or v[4] != '-':
            raise ValueError('Periode muss im Format YYYY-MM sein')
        try:
            year, month = v.split('-')
            int(year)
            int(month)
            if not (1 <= int(month) <= 12):
                raise ValueError('Monat muss zwischen 1 und 12 liegen')
        except ValueError:
            raise ValueError('Ungültiges Periodenformat')
        return v


class PayrollRunCreate(PayrollRunBase):
    """Schema for creating a payroll run"""
    pass


class PayrollRunUpdate(BaseModel):
    """Schema for updating a payroll run"""
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    notes: Optional[str] = None


class PayrollRunResponse(PayrollRunBase):
    """Schema for payroll run response"""
    id: str
    status: PayrollStatus
    total_gross: Decimal
    total_net: Decimal
    total_taxes: Decimal
    total_social_security: Decimal
    employee_count: int
    created_at: datetime
    approved_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_by: str
    approved_by: Optional[str] = None
    
    @property
    def is_editable(self) -> bool:
        return self.status == PayrollStatus.DRAFT
    
    @property
    def can_be_approved(self) -> bool:
        return self.status == PayrollStatus.DRAFT and self.employee_count > 0
    
    @property
    def can_be_paid(self) -> bool:
        return self.status == PayrollStatus.APPROVED
    
    class Config:
        from_attributes = True


# Payroll Entry Schemas
class PayrollEntryBase(BaseModel):
    """Base payroll entry schema"""
    base_salary: Decimal = Field(..., ge=0, description="Grundgehalt")
    commission: Decimal = Field(default=Decimal('0.00'), ge=0, description="Provision")
    bonuses: Decimal = Field(default=Decimal('0.00'), ge=0, description="Boni")
    overtime: Decimal = Field(default=Decimal('0.00'), ge=0, description="Überstunden")
    car_allowance: Decimal = Field(default=Decimal('0.00'), ge=0, description="Fahrzeugzuschuss")
    phone_allowance: Decimal = Field(default=Decimal('0.00'), ge=0, description="Telefonzuschuss")
    other_allowances: Decimal = Field(default=Decimal('0.00'), ge=0, description="Sonstige Zuschüsse")
    income_tax: Decimal = Field(default=Decimal('0.00'), ge=0, description="Einkommensteuer")
    social_security_employee: Decimal = Field(default=Decimal('0.00'), ge=0, description="Sozialversicherung AN")
    health_insurance: Decimal = Field(default=Decimal('0.00'), ge=0, description="Krankenversicherung")
    pension_insurance: Decimal = Field(default=Decimal('0.00'), ge=0, description="Rentenversicherung")
    unemployment_insurance: Decimal = Field(default=Decimal('0.00'), ge=0, description="Arbeitslosenversicherung")
    other_deductions: Decimal = Field(default=Decimal('0.00'), ge=0, description="Sonstige Abzüge")
    currency: str = Field(default="EUR", description="Währung")
    working_days: int = Field(default=0, ge=0, description="Arbeitstage")
    total_days: int = Field(default=30, ge=1, description="Gesamttage")


class PayrollEntryCreate(PayrollEntryBase):
    """Schema for creating a payroll entry"""
    payroll_run_id: str = Field(..., description="Lohnlauf-ID")
    employee_id: str = Field(..., description="Mitarbeiter-ID")


class PayrollEntryUpdate(BaseModel):
    """Schema for updating a payroll entry"""
    base_salary: Optional[Decimal] = Field(None, ge=0)
    commission: Optional[Decimal] = Field(None, ge=0)
    bonuses: Optional[Decimal] = Field(None, ge=0)
    overtime: Optional[Decimal] = Field(None, ge=0)
    car_allowance: Optional[Decimal] = Field(None, ge=0)
    phone_allowance: Optional[Decimal] = Field(None, ge=0)
    other_allowances: Optional[Decimal] = Field(None, ge=0)
    income_tax: Optional[Decimal] = Field(None, ge=0)
    social_security_employee: Optional[Decimal] = Field(None, ge=0)
    health_insurance: Optional[Decimal] = Field(None, ge=0)
    pension_insurance: Optional[Decimal] = Field(None, ge=0)
    unemployment_insurance: Optional[Decimal] = Field(None, ge=0)
    other_deductions: Optional[Decimal] = Field(None, ge=0)
    working_days: Optional[int] = Field(None, ge=0)
    total_days: Optional[int] = Field(None, ge=1)


class PayrollEntryManualCreate(BaseModel):
    """Schema für manuelle Lohnzettel-Erstellung"""
    employee_id: str = Field(..., description="Mitarbeiter-ID")
    period: str = Field(..., description="Periode (YYYY-MM)")
    gross_salary: Decimal = Field(..., ge=0, description="Bruttogehalt")
    deductions: Decimal = Field(..., ge=0, description="Abzüge")
    net_salary: Decimal = Field(..., ge=0, description="Nettogehalt")
    bonuses: Optional[Decimal] = Field(0, ge=0, description="Boni")
    overtime_pay: Optional[Decimal] = Field(0, ge=0, description="Überstunden-Vergütung")
    notes: Optional[str] = Field(None, description="Notizen")


class PayrollEntryAutoCreate(BaseModel):
    """Schema für automatische Lohnzettel-Erstellung"""
    employee_id: str = Field(..., description="Mitarbeiter-ID")
    period: str = Field(..., description="Periode (YYYY-MM)")
    include_overtime: bool = Field(True, description="Überstunden einbeziehen")
    include_bonuses: bool = Field(True, description="Boni einbeziehen")


class PayrollEntryResponse(PayrollEntryBase):
    """Schema for payroll entry response"""
    id: str
    payroll_run_id: str
    employee_id: str
    employee_name: str
    gross_amount: Decimal
    total_deductions: Decimal
    net_amount: Decimal
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Payroll Detail Response
class PayrollDetailResponse(BaseModel):
    """Schema for detailed payroll run response"""
    payroll_run: PayrollRunResponse
    entries: List[PayrollEntryResponse]
    summary: Dict[str, Any]


# Payroll List Response
class PayrollListResponse(BaseModel):
    """Schema for payroll list response"""
    payroll_runs: List[PayrollRunResponse]
    total: int
    page: int
    size: int
    pages: int


# Payroll Statistics
class PayrollStats(BaseModel):
    """Payroll statistics"""
    total_runs: int
    draft_runs: int
    approved_runs: int
    paid_runs: int
    total_gross_amount: Decimal
    total_net_amount: Decimal
    total_taxes: Decimal
    total_social_security: Decimal
    average_gross_per_employee: Optional[Decimal] = None
    average_net_per_employee: Optional[Decimal] = None
    monthly_trend: List[Dict[str, Any]] = []


# Payroll Calculation Request
class PayrollCalculationRequest(BaseModel):
    """Request for payroll calculation"""
    payroll_run_id: str
    employee_ids: Optional[List[str]] = None  # If None, calculate for all employees
    recalculate_existing: bool = Field(default=False, description="Bestehende Einträge neu berechnen")


# Payroll Approval Request
class PayrollApprovalRequest(BaseModel):
    """Request for payroll approval"""
    payroll_run_id: str
    notes: Optional[str] = None


# Payroll Payment Request
class PayrollPaymentRequest(BaseModel):
    """Request for marking payroll as paid"""
    payroll_run_id: str
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
