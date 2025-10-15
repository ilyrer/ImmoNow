"""
Payroll API Endpoints
Lohnabrechnung und Gehaltsverwaltung
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import require_admin_scope, get_tenant_id
from app.core.security import TokenData

router = APIRouter()


class PayrollRunResponse(BaseModel):
    """Payroll run response model"""
    id: str
    period: str  # YYYY-MM
    status: str  # draft, approved, paid
    total_gross: float
    total_net: float
    employee_count: int
    created_at: datetime
    approved_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_by: str
    
    class Config:
        from_attributes = True


class EmployeeCompensationResponse(BaseModel):
    """Employee compensation response model"""
    employee_id: str
    employee_name: str
    base_salary: float
    commission_percent: float
    bonuses: float = 0.0
    gross_amount: float
    net_amount: float
    currency: str = "EUR"
    
    class Config:
        from_attributes = True


class PayrollDetailResponse(BaseModel):
    """Payroll detail response model"""
    payroll_run: PayrollRunResponse
    employees: List[EmployeeCompensationResponse]


@router.get("/runs", response_model=List[PayrollRunResponse])
async def get_payroll_runs(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all payroll runs for tenant"""
    
    # Mock data for now - replace with real database queries
    mock_runs = [
        PayrollRunResponse(
            id="1",
            period="2024-01",
            status="paid",
            total_gross=50000.0,
            total_net=40000.0,
            employee_count=10,
            created_at=datetime.now(),
            approved_at=datetime.now(),
            paid_at=datetime.now(),
            created_by=current_user.user_id
        ),
        PayrollRunResponse(
            id="2",
            period="2024-02",
            status="approved",
            total_gross=52000.0,
            total_net=41600.0,
            employee_count=11,
            created_at=datetime.now(),
            approved_at=datetime.now(),
            created_by=current_user.user_id
        ),
        PayrollRunResponse(
            id="3",
            period="2024-03",
            status="draft",
            total_gross=53000.0,
            total_net=42400.0,
            employee_count=12,
            created_at=datetime.now(),
            created_by=current_user.user_id
        )
    ]
    
    return mock_runs


@router.get("/runs/{run_id}", response_model=PayrollDetailResponse)
async def get_payroll_detail(
    run_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get detailed payroll run information"""
    
    # Mock data for now
    mock_run = PayrollRunResponse(
        id=run_id,
        period="2024-01",
        status="paid",
        total_gross=50000.0,
        total_net=40000.0,
        employee_count=10,
        created_at=datetime.now(),
        approved_at=datetime.now(),
        paid_at=datetime.now(),
        created_by=current_user.user_id
    )
    
    mock_employees = [
        EmployeeCompensationResponse(
            employee_id="1",
            employee_name="Max Mustermann",
            base_salary=5000.0,
            commission_percent=5.0,
            bonuses=500.0,
            gross_amount=5500.0,
            net_amount=4400.0
        ),
        EmployeeCompensationResponse(
            employee_id="2",
            employee_name="Anna Schmidt",
            base_salary=4500.0,
            commission_percent=3.0,
            bonuses=300.0,
            gross_amount=4800.0,
            net_amount=3840.0
        )
    ]
    
    return PayrollDetailResponse(
        payroll_run=mock_run,
        employees=mock_employees
    )


@router.post("/runs/{run_id}/approve", response_model=PayrollRunResponse)
async def approve_payroll_run(
    run_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Approve a payroll run"""
    
    # Mock approval - replace with real database update
    mock_run = PayrollRunResponse(
        id=run_id,
        period="2024-01",
        status="approved",
        total_gross=50000.0,
        total_net=40000.0,
        employee_count=10,
        created_at=datetime.now(),
        approved_at=datetime.now(),
        created_by=current_user.user_id
    )
    
    return mock_run


@router.post("/runs/{run_id}/mark-paid", response_model=PayrollRunResponse)
async def mark_payroll_paid(
    run_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Mark payroll run as paid"""
    
    # Mock payment - replace with real database update
    mock_run = PayrollRunResponse(
        id=run_id,
        period="2024-01",
        status="paid",
        total_gross=50000.0,
        total_net=40000.0,
        employee_count=10,
        created_at=datetime.now(),
        approved_at=datetime.now(),
        paid_at=datetime.now(),
        created_by=current_user.user_id
    )
    
    return mock_run


@router.post("/runs", response_model=PayrollRunResponse, status_code=status.HTTP_201_CREATED)
async def create_payroll_run(
    period: str = Query(..., description="Payroll period in YYYY-MM format"),
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new payroll run"""
    
    # Mock creation - replace with real database insert
    mock_run = PayrollRunResponse(
        id="new-run-id",
        period=period,
        status="draft",
        total_gross=0.0,
        total_net=0.0,
        employee_count=0,
        created_at=datetime.now(),
        created_by=current_user.user_id
    )
    
    return mock_run
