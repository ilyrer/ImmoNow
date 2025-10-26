"""
Payroll API Endpoints
Lohnabrechnung und Gehaltsverwaltung
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import require_read_scope, require_write_scope, require_admin_scope, get_tenant_id
from app.core.security import TokenData
from app.schemas.payroll import (
    PayrollRunCreate, PayrollRunUpdate, PayrollRunResponse, PayrollListResponse,
    PayrollDetailResponse, PayrollStats, PayrollCalculationRequest,
    PayrollApprovalRequest, PayrollPaymentRequest
)
from app.services.payroll_service import PayrollService

router = APIRouter()


@router.get("/runs", response_model=PayrollListResponse)
async def get_payroll_runs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get payroll runs with filtering and pagination"""
    
    payroll_service = PayrollService(tenant_id)
    result = await payroll_service.get_payroll_runs(
        page=page,
        size=size,
        status=status,
        period=period
    )
    
    return result


@router.get("/runs/{run_id}", response_model=PayrollRunResponse)
async def get_payroll_run(
    run_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific payroll run"""
    
    payroll_service = PayrollService(tenant_id)
    payroll_run = await payroll_service.get_payroll_run(run_id)
    
    return payroll_run


@router.get("/runs/{run_id}/detail", response_model=PayrollDetailResponse)
async def get_payroll_detail(
    run_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get detailed payroll run information"""
    
    payroll_service = PayrollService(tenant_id)
    detail = await payroll_service.get_payroll_detail(run_id)
    
    return detail


@router.post("/runs", response_model=PayrollRunResponse, status_code=status.HTTP_201_CREATED)
async def create_payroll_run(
    payroll_data: PayrollRunCreate,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new payroll run"""
    
    payroll_service = PayrollService(tenant_id)
    payroll_run = await payroll_service.create_payroll_run(payroll_data, current_user.user_id)
    
    return payroll_run


@router.put("/runs/{run_id}", response_model=PayrollRunResponse)
async def update_payroll_run(
    run_id: str,
    payroll_data: PayrollRunUpdate,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a payroll run"""
    
    payroll_service = PayrollService(tenant_id)
    payroll_run = await payroll_service.update_payroll_run(run_id, payroll_data, current_user.user_id)
    
    return payroll_run


@router.post("/runs/{run_id}/calculate", response_model=PayrollDetailResponse)
async def calculate_payroll(
    run_id: str,
    calculation_request: PayrollCalculationRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Calculate payroll for a run"""
    
    payroll_service = PayrollService(tenant_id)
    calculation_request.payroll_run_id = run_id
    detail = await payroll_service.calculate_payroll(calculation_request)
    
    return detail


@router.post("/runs/{run_id}/approve", response_model=PayrollRunResponse)
async def approve_payroll_run(
    run_id: str,
    approval_request: PayrollApprovalRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Approve a payroll run"""
    
    payroll_service = PayrollService(tenant_id)
    approval_request.payroll_run_id = run_id
    payroll_run = await payroll_service.approve_payroll(approval_request, current_user.user_id)
    
    return payroll_run


@router.post("/runs/{run_id}/mark-paid", response_model=PayrollRunResponse)
async def mark_payroll_paid(
    run_id: str,
    payment_request: PayrollPaymentRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Mark payroll run as paid"""
    
    payroll_service = PayrollService(tenant_id)
    payment_request.payroll_run_id = run_id
    payroll_run = await payroll_service.mark_as_paid(payment_request, current_user.user_id)
    
    return payroll_run


@router.get("/stats", response_model=PayrollStats)
async def get_payroll_stats(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get payroll statistics"""
    
    payroll_service = PayrollService(tenant_id)
    stats = await payroll_service.get_payroll_stats()
    
    return stats