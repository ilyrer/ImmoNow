"""
HR Schemas
Pydantic models für HR-Management (Urlaub, Anwesenheit, Überstunden, Spesen, Dokumente)
"""

from pydantic import BaseModel, Field, validator, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date as DateType, time as TimeType
from decimal import Decimal
from enum import Enum


# Enums für Schemas
class LeaveType(str, Enum):
    VACATION = "vacation"
    SICK = "sick"
    PERSONAL = "personal"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    STUDY = "study"
    OTHER = "other"


class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ExpenseCategory(str, Enum):
    TRAVEL = "travel"
    MEALS = "meals"
    TRANSPORT = "transport"
    ACCOMMODATION = "accommodation"
    COMMUNICATION = "communication"
    OFFICE_SUPPLIES = "office_supplies"
    TRAINING = "training"
    CLIENT_ENTERTAINMENT = "client_entertainment"
    OTHER = "other"


class ExpenseStatus(str, Enum):
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"


class DocumentType(str, Enum):
    CONTRACT = "contract"
    CERTIFICATE = "certificate"
    ID_CARD = "id_card"
    PASSPORT = "passport"
    DRIVER_LICENSE = "driver_license"
    QUALIFICATION = "qualification"
    TRAINING_CERTIFICATE = "training_certificate"
    MEDICAL_CERTIFICATE = "medical_certificate"
    OTHER = "other"


# Leave Request Schemas
class LeaveRequestBase(BaseModel):
    """Base leave request schema"""
    start_date: DateType = Field(..., description="Urlaubsbeginn")
    end_date: DateType = Field(..., description="Urlaubsende")
    leave_type: LeaveType = Field(default=LeaveType.VACATION, description="Urlaubstyp")
    days_count: Decimal = Field(..., ge=0.1, le=365, description="Anzahl Urlaubstage")
    reason: Optional[str] = Field(None, description="Begründung")
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('Enddatum muss nach dem Startdatum liegen')
        return v
    
    @validator('days_count')
    def validate_days_count(cls, v, values):
        if 'start_date' in values and 'end_date' in values:
            start = values['start_date']
            end = values['end_date']
            max_days = (end - start).days + 1
            if v > max_days:
                raise ValueError(f'Anzahl Tage darf nicht größer als {max_days} sein')
        return v


class LeaveRequestCreate(LeaveRequestBase):
    """Schema for creating a leave request"""
    pass


class LeaveRequestUpdate(BaseModel):
    """Schema for updating a leave request"""
    start_date: Optional[DateType] = None
    end_date: Optional[DateType] = None
    leave_type: Optional[LeaveType] = None
    days_count: Optional[Decimal] = Field(None, ge=0.1, le=365)
    reason: Optional[str] = None


class LeaveRequestResponse(LeaveRequestBase):
    """Schema for leave request response"""
    id: str
    employee_id: str
    employee_name: str
    status: LeaveStatus
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Attendance Schemas
class AttendanceBase(BaseModel):
    """Base attendance schema"""
    date: DateType = Field(..., description="Datum")
    check_in: Optional[TimeType] = Field(None, description="Check-in Zeit")
    check_out: Optional[TimeType] = Field(None, description="Check-out Zeit")
    location: Optional[str] = Field(None, max_length=100, description="Arbeitsort")
    notes: Optional[str] = Field(None, description="Notizen")


class AttendanceCreate(AttendanceBase):
    """Schema for creating attendance record"""
    pass


class AttendanceUpdate(BaseModel):
    """Schema for updating attendance record"""
    check_in: Optional[TimeType] = None
    check_out: Optional[TimeType] = None
    location: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class AttendanceResponse(AttendanceBase):
    """Schema for attendance response"""
    id: str
    employee_id: str
    employee_name: str
    hours_worked: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Overtime Schemas
class OvertimeBase(BaseModel):
    """Base overtime schema"""
    date: DateType = Field(..., description="Datum")
    hours: Decimal = Field(..., ge=0.1, le=24, description="Überstunden")
    rate: Decimal = Field(default=Decimal('1.0'), ge=1.0, le=3.0, description="Überstundenzuschlag")
    reason: str = Field(..., min_length=10, description="Begründung")


class OvertimeCreate(OvertimeBase):
    """Schema for creating overtime record"""
    pass


class OvertimeUpdate(BaseModel):
    """Schema for updating overtime record"""
    date: Optional[DateType] = None
    hours: Optional[Decimal] = Field(None, ge=0.1, le=24)
    rate: Optional[Decimal] = Field(None, ge=1.0, le=3.0)
    reason: Optional[str] = Field(None, min_length=10)


class OvertimeResponse(OvertimeBase):
    """Schema for overtime response"""
    id: str
    employee_id: str
    employee_name: str
    approved: bool
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    total_amount: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Expense Schemas
class ExpenseBase(BaseModel):
    """Base expense schema"""
    date: DateType = Field(..., description="Datum der Ausgabe")
    amount: Decimal = Field(..., ge=0.01, description="Betrag")
    category: ExpenseCategory = Field(..., description="Kategorie")
    description: str = Field(..., min_length=5, description="Beschreibung")
    receipt_url: Optional[str] = Field(None, description="Beleg-URL")


class ExpenseCreate(ExpenseBase):
    """Schema for creating expense record"""
    pass


class ExpenseUpdate(BaseModel):
    """Schema for updating expense record"""
    date: Optional[DateType] = None
    amount: Optional[Decimal] = Field(None, ge=0.01)
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = Field(None, min_length=5)
    receipt_url: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    """Schema for expense response"""
    id: str
    employee_id: str
    employee_name: str
    status: ExpenseStatus
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Employee Document Schemas
class EmployeeDocumentBase(BaseModel):
    """Base employee document schema"""
    title: str = Field(..., min_length=3, max_length=200, description="Titel")
    document_type: DocumentType = Field(..., description="Dokumenttyp")
    description: Optional[str] = Field(None, description="Beschreibung")
    expires_at: Optional[DateType] = Field(None, description="Ablaufdatum")
    is_confidential: bool = Field(default=False, description="Vertraulich")


class EmployeeDocumentCreate(EmployeeDocumentBase):
    """Schema for creating employee document"""
    file_url: str = Field(..., description="Datei-URL")
    file_size: Optional[int] = Field(None, ge=0, description="Dateigröße in Bytes")
    mime_type: Optional[str] = Field(None, description="MIME-Typ")


class EmployeeDocumentUpdate(BaseModel):
    """Schema for updating employee document"""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    document_type: Optional[DocumentType] = None
    description: Optional[str] = None
    expires_at: Optional[DateType] = None
    is_confidential: Optional[bool] = None


class EmployeeDocumentResponse(EmployeeDocumentBase):
    """Schema for employee document response"""
    id: str
    employee_id: str
    employee_name: str
    file_url: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    file_extension: Optional[str] = None
    is_expired: bool
    uploaded_by: str
    uploaded_by_name: str
    uploaded_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Employee Detail Response (kombiniert alle Daten)
class EmployeeAdminUpdate(BaseModel):
    """Schema für Admin-Updates von Mitarbeiterdaten"""
    # Basic Info
    department: Optional[str] = None
    position: Optional[str] = None
    employment_type: Optional[str] = None
    
    # HR Fields
    annual_leave_days: Optional[int] = Field(None, ge=0, le=365, description="Jährliche Urlaubstage")
    remaining_leave_days: Optional[int] = Field(None, ge=0, le=365, description="Verbleibende Urlaubstage")
    overtime_balance: Optional[float] = Field(None, description="Überstunden-Saldo")
    expense_limit: Optional[Decimal] = Field(None, ge=0, description="Spesen-Limit")
    
    # Compensation (optional)
    base_salary: Optional[Decimal] = Field(None, ge=0, description="Grundgehalt")
    bonuses: Optional[Decimal] = Field(None, ge=0, description="Boni")
    
    # Contact
    work_email: Optional[str] = Field(None, description="Arbeits-E-Mail")
    work_phone: Optional[str] = Field(None, description="Arbeits-Telefon")
    office_location: Optional[str] = Field(None, description="Bürostandort")
    
    # Status
    is_active: Optional[bool] = Field(None, description="Aktiv")
    is_on_leave: Optional[bool] = Field(None, description="Im Urlaub")
    leave_start: Optional[DateType] = Field(None, description="Urlaubsbeginn")
    leave_end: Optional[DateType] = Field(None, description="Urlaubsende")


class EmployeeDetailResponse(BaseModel):
    """Vollständige Mitarbeiterdetails"""
    # Basic Info
    id: str
    employee_number: str
    full_name: str
    email: str
    department: str
    position: str
    employment_type: str
    start_date: DateType
    end_date: Optional[DateType] = None
    is_active: bool
    is_on_leave: bool
    leave_start: Optional[DateType] = None
    leave_end: Optional[DateType] = None
    
    # Contact Info
    work_email: Optional[str] = None
    work_phone: Optional[str] = None
    office_location: Optional[str] = None
    
    # Manager Info
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    
    # Statistics
    total_leave_days_used: int = 0
    total_leave_days_remaining: int = 0
    total_overtime_hours: float = 0.0
    total_expenses_amount: float = 0.0
    total_expenses_pending: float = 0.0
    attendance_rate: float = 0.0
    
    # Admin-editable fields
    annual_leave_days: Optional[int] = None
    overtime_balance: Optional[float] = None
    expense_limit: Optional[Decimal] = None
    
    # Recent Activity
    recent_leave_requests: List[LeaveRequestResponse] = []
    recent_attendance: List[AttendanceResponse] = []
    recent_overtime: List[OvertimeResponse] = []
    recent_expenses: List[ExpenseResponse] = []
    recent_documents: List[EmployeeDocumentResponse] = []
    
    # Timestamps
    created_at: datetime
    updated_at: datetime


# List Response Schemas
class LeaveRequestListResponse(BaseModel):
    """Leave requests list response"""
    leave_requests: List[LeaveRequestResponse]
    total: int
    page: int
    size: int
    pages: int


class AttendanceListResponse(BaseModel):
    """Attendance list response"""
    attendance_records: List[AttendanceResponse]
    total: int
    page: int
    size: int
    pages: int


class OvertimeListResponse(BaseModel):
    """Overtime list response"""
    overtime_records: List[OvertimeResponse]
    total: int
    page: int
    size: int
    pages: int


class ExpenseListResponse(BaseModel):
    """Expense list response"""
    expenses: List[ExpenseResponse]
    total: int
    page: int
    size: int
    pages: int


class EmployeeDocumentListResponse(BaseModel):
    """Employee documents list response"""
    documents: List[EmployeeDocumentResponse]
    total: int
    page: int
    size: int
    pages: int


# Statistics Schemas
class HRStats(BaseModel):
    """HR Statistics"""
    total_employees: int
    active_employees: int
    employees_on_leave: int
    pending_leave_requests: int
    pending_overtime_approvals: int
    pending_expense_approvals: int
    total_leave_days_used: int
    total_overtime_hours: Decimal
    total_expenses_amount: Decimal
    average_attendance_rate: Decimal


# Approval Request Schemas
class LeaveApprovalRequest(BaseModel):
    """Request for approving/rejecting leave request"""
    approved: bool
    manager_notes: Optional[str] = Field(None, description="Manager Notizen")


class OvertimeApprovalRequest(BaseModel):
    """Request for approving/rejecting overtime"""
    approved: bool
    notes: Optional[str] = Field(None, description="Notizen")


class ExpenseApprovalRequest(BaseModel):
    """Request for approving/rejecting expense"""
    approved: bool
    manager_notes: Optional[str] = Field(None, description="Manager Notizen")
