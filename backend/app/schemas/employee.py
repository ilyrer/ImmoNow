"""
Employee Schemas
Pydantic models for employee-related operations
"""

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


class Department(str, Enum):
    """Employee departments"""
    MANAGEMENT = "management"
    SALES = "sales"
    MARKETING = "marketing"
    ADMIN = "admin"
    IT = "it"
    HR = "hr"
    FINANCE = "finance"
    LEGAL = "legal"
    OTHER = "other"


class Position(str, Enum):
    """Employee positions"""
    CEO = "ceo"
    MANAGER = "manager"
    SENIOR_AGENT = "senior_agent"
    AGENT = "agent"
    JUNIOR_AGENT = "junior_agent"
    ASSISTANT = "assistant"
    INTERN = "intern"
    OTHER = "other"


class EmploymentType(str, Enum):
    """Employment types"""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"
    FREELANCE = "freelance"


class SalaryType(str, Enum):
    """Salary types"""
    MONTHLY = "monthly"
    ANNUAL = "annual"
    HOURLY = "hourly"


class CommissionType(str, Enum):
    """Commission types"""
    PERCENTAGE = "percentage"
    FIXED = "fixed"
    TIERED = "tiered"


# Employee Schemas
class EmployeeBase(BaseModel):
    """Base employee schema"""
    employee_number: str = Field(..., description="Mitarbeiternummer")
    department: Department = Field(default=Department.SALES, description="Abteilung")
    position: Position = Field(default=Position.AGENT, description="Position")
    employment_type: EmploymentType = Field(default=EmploymentType.FULL_TIME, description="Anstellungsart")
    start_date: date = Field(..., description="Einstellungsdatum")
    end_date: Optional[date] = Field(None, description="Austrittsdatum")
    work_email: Optional[EmailStr] = Field(None, description="Arbeits-E-Mail")
    work_phone: Optional[str] = Field(None, description="Arbeits-Telefon")
    office_location: Optional[str] = Field(None, description="Bürostandort")
    manager_id: Optional[str] = Field(None, description="Manager-ID")
    is_active: bool = Field(default=True, description="Aktiv")
    is_on_leave: bool = Field(default=False, description="Im Urlaub")
    leave_start: Optional[date] = Field(None, description="Urlaubsbeginn")
    leave_end: Optional[date] = Field(None, description="Urlaubsende")
    notes: Optional[str] = Field(None, description="Interne Notizen")


class EmployeeCreate(EmployeeBase):
    """Schema for creating an employee"""
    user_id: str = Field(..., description="Benutzer-ID")
    
    @validator('employee_number')
    def validate_employee_number(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Mitarbeiternummer darf nicht leer sein')
        return v.strip()


class EmployeeUpdate(BaseModel):
    """Schema for updating an employee"""
    employee_number: Optional[str] = None
    department: Optional[Department] = None
    position: Optional[Position] = None
    employment_type: Optional[EmploymentType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    work_email: Optional[EmailStr] = None
    work_phone: Optional[str] = None
    office_location: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None
    is_on_leave: Optional[bool] = None
    leave_start: Optional[date] = None
    leave_end: Optional[date] = None
    notes: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    """Schema for employee response"""
    id: str
    user_id: str
    user_first_name: str
    user_last_name: str
    user_email: str
    manager_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    
    @property
    def full_name(self) -> str:
        return f"{self.user_first_name} {self.user_last_name}"
    
    @property
    def email(self) -> str:
        return self.work_email or self.user_email
    
    class Config:
        from_attributes = True


# Employee Compensation Schemas
class EmployeeCompensationBase(BaseModel):
    """Base employee compensation schema"""
    base_salary: Decimal = Field(..., ge=0, description="Grundgehalt")
    salary_type: SalaryType = Field(default=SalaryType.MONTHLY, description="Gehaltstyp")
    currency: str = Field(default="EUR", description="Währung")
    commission_percentage: Decimal = Field(default=Decimal('0.00'), ge=0, le=100, description="Provisionssatz")
    commission_type: CommissionType = Field(default=CommissionType.PERCENTAGE, description="Provisionstyp")
    commission_threshold: Decimal = Field(default=Decimal('0.00'), ge=0, description="Mindestumsatz für Provision")
    monthly_bonus: Decimal = Field(default=Decimal('0.00'), ge=0, description="Monatlicher Bonus")
    annual_bonus: Decimal = Field(default=Decimal('0.00'), ge=0, description="Jährlicher Bonus")
    car_allowance: Decimal = Field(default=Decimal('0.00'), ge=0, description="Fahrzeugzuschuss")
    phone_allowance: Decimal = Field(default=Decimal('0.00'), ge=0, description="Telefonzuschuss")
    other_allowances: Decimal = Field(default=Decimal('0.00'), ge=0, description="Sonstige Zuschüsse")
    tax_class: str = Field(default="1", description="Steuerklasse")
    social_security_number: Optional[str] = Field(None, description="Sozialversicherungsnummer")
    effective_from: date = Field(..., description="Gültig ab")
    effective_until: Optional[date] = Field(None, description="Gültig bis")


class EmployeeCompensationCreate(EmployeeCompensationBase):
    """Schema for creating employee compensation"""
    employee_id: str = Field(..., description="Mitarbeiter-ID")


class EmployeeCompensationUpdate(BaseModel):
    """Schema for updating employee compensation"""
    base_salary: Optional[Decimal] = Field(None, ge=0)
    salary_type: Optional[SalaryType] = None
    currency: Optional[str] = None
    commission_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    commission_type: Optional[CommissionType] = None
    commission_threshold: Optional[Decimal] = Field(None, ge=0)
    monthly_bonus: Optional[Decimal] = Field(None, ge=0)
    annual_bonus: Optional[Decimal] = Field(None, ge=0)
    car_allowance: Optional[Decimal] = Field(None, ge=0)
    phone_allowance: Optional[Decimal] = Field(None, ge=0)
    other_allowances: Optional[Decimal] = Field(None, ge=0)
    tax_class: Optional[str] = None
    social_security_number: Optional[str] = None
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None


class EmployeeCompensationResponse(EmployeeCompensationBase):
    """Schema for employee compensation response"""
    id: str
    employee_id: str
    employee_name: str
    total_monthly_gross: Decimal
    is_current: bool
    created_at: datetime
    updated_at: datetime
    created_by: str
    
    class Config:
        from_attributes = True


# Employee List Response
class EmployeeListResponse(BaseModel):
    """Schema for employee list response"""
    employees: List[EmployeeResponse]
    total: int
    page: int
    size: int
    pages: int


# Employee Statistics
class EmployeeStats(BaseModel):
    """Employee statistics"""
    total_employees: int
    active_employees: int
    employees_on_leave: int
    employees_by_department: Dict[str, int]
    employees_by_position: Dict[str, int]
    employees_by_employment_type: Dict[str, int]
    average_salary: Optional[Decimal] = None
    total_monthly_payroll: Optional[Decimal] = None
