"""
Employee API Endpoints
API-Endpunkte für Mitarbeiterverwaltung
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File, Path, Body
from fastapi.responses import StreamingResponse
import io

from app.api.deps import require_read_scope, require_write_scope, require_admin_scope, get_tenant_id, require_hr_access
from app.core.security import TokenData
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeListResponse,
    EmployeeCompensationCreate, EmployeeCompensationUpdate, EmployeeCompensationResponse,
    EmployeeStats
)
from app.schemas.hr import EmployeeDetailResponse, EmployeeAdminUpdate
from app.schemas.payroll import PayrollEntryManualCreate, PayrollEntryAutoCreate, PayrollEntryResponse
from app.services.employee_service import EmployeeService
from app.services.hr_service import HRService
from app.services.payroll_service import PayrollService
from app.core.errors import NotFoundError, ForbiddenError

router = APIRouter()


@router.get("/employees", response_model=EmployeeListResponse)
async def get_employees(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    position: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    manager_id: Optional[str] = Query(None),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get employees with filtering and pagination"""
    
    employee_service = EmployeeService(tenant_id)
    result = await employee_service.get_employees(
        page=page,
        size=size,
        search=search,
        department=department,
        position=position,
        is_active=is_active,
        manager_id=manager_id
    )
    
    return result


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific employee"""
    
    employee_service = EmployeeService(tenant_id)
    employee = await employee_service.get_employee(employee_id)
    
    return employee


@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_data: EmployeeCreate,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new employee"""
    
    employee_service = EmployeeService(tenant_id)
    employee = await employee_service.create_employee(employee_data, current_user.user_id)
    
    return employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str,
    employee_data: EmployeeUpdate,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update an employee"""
    
    employee_service = EmployeeService(tenant_id)
    employee = await employee_service.update_employee(employee_id, employee_data, current_user.user_id)
    
    return employee


@router.delete("/employees/{employee_id}", status_code=status.HTTP_200_OK)
async def delete_employee(
    employee_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete an employee"""
    
    employee_service = EmployeeService(tenant_id)
    await employee_service.delete_employee(employee_id, current_user.user_id)
    
    return {"message": "Employee deleted successfully"}


@router.get("/employees/stats", response_model=EmployeeStats)
async def get_employee_stats(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get employee statistics"""
    
    employee_service = EmployeeService(tenant_id)
    stats = await employee_service.get_employee_stats()
    
    return stats


@router.get("/employees/{employee_id}/compensation", response_model=Optional[EmployeeCompensationResponse])
async def get_employee_compensation(
    employee_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get employee compensation"""
    
    employee_service = EmployeeService(tenant_id)
    compensation = await employee_service.get_employee_compensation(employee_id)
    
    return compensation


@router.put("/employees/{employee_id}/compensation", response_model=EmployeeCompensationResponse)
async def update_employee_compensation(
    employee_id: str,
    compensation_data: EmployeeCompensationUpdate,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update employee compensation"""
    
    employee_service = EmployeeService(tenant_id)
    compensation = await employee_service.update_employee_compensation(
        employee_id, compensation_data, current_user.user_id
    )
    
    return compensation


# ============================================================================
# EMPLOYEE DETAIL ENDPOINTS
# ============================================================================

@router.get("/employees/{employee_id}/detail", response_model=EmployeeDetailResponse)
async def get_employee_detail(
    employee_id: str = Path(..., description="Mitarbeiter-ID"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Hole vollständige Mitarbeiterdetails"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.get_employee_detail(current_user, employee_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/employees/{employee_id}/detail", response_model=EmployeeDetailResponse)
async def update_employee_detail(
    employee_id: str = Path(..., description="Mitarbeiter-ID"),
    update_data: dict = Body(..., description="Zu aktualisierende Daten"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Aktualisiere Mitarbeiterdetails (nur für Admins/Owner)"""
    try:
        # Nur Admins und Owner können bearbeiten
        if current_user.role not in ["admin", "owner"]:
            raise ForbiddenError("Only admins and owners can edit employee data")
        
        hr_service = HRService(tenant_id)
        return await hr_service.update_employee_detail(current_user, employee_id, update_data)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# PAYSLIP ENDPOINTS
# ============================================================================

@router.get("/employees/{employee_id}/payslips", response_model=List[PayrollEntryResponse])
async def get_employee_payslips(
    employee_id: str = Path(..., description="Mitarbeiter-ID"),
    page: int = Query(1, ge=1, description="Seite"),
    size: int = Query(20, ge=1, le=100, description="Größe"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Hole Lohnabrechnungen eines Mitarbeiters"""
    try:
        # Prüfe Berechtigung
        from app.core.hr_permissions import can_access_employee_data
        if not await can_access_employee_data(current_user, employee_id):
            raise ForbiddenError("Insufficient permissions")
        
        payroll_service = PayrollService(tenant_id)
        payslips = await payroll_service.get_payroll_entries_by_employee(
            employee_id, page, size
        )
        
        return payslips
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/employees/{employee_id}/payslips/{payslip_id}/pdf")
async def download_payslip_pdf(
    employee_id: str = Path(..., description="Mitarbeiter-ID"),
    payslip_id: str = Path(..., description="Lohnzettel-ID"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Lade Lohnzettel als PDF herunter"""
    try:
        # Prüfe Berechtigung
        from app.core.hr_permissions import can_access_employee_data
        if not await can_access_employee_data(current_user, employee_id):
            raise ForbiddenError("Insufficient permissions")
        
        payroll_service = PayrollService(tenant_id)
        pdf_data = await payroll_service.generate_payslip_pdf(payslip_id)
        
        # Erstelle StreamingResponse
        return StreamingResponse(
            io.BytesIO(pdf_data),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=payslip_{payslip_id}.pdf"
            }
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/employees/{employee_id}/payslips/manual", response_model=PayrollEntryResponse)
async def create_manual_payslip(
    employee_id: str = Path(..., description="Mitarbeiter-ID"),
    payslip_data: PayrollEntryManualCreate = Body(..., description="Lohnzettel-Daten"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erstelle manuellen Lohnzettel"""
    try:
        # Nur Admins und Owner können Lohnzettel erstellen
        if current_user.role not in ["admin", "owner"]:
            raise ForbiddenError("Only admins and owners can create payslips")
        
        payroll_service = PayrollService(tenant_id)
        return await payroll_service.create_manual_payroll_entry(payslip_data, current_user.user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/employees/{employee_id}/payslips/auto", response_model=PayrollEntryResponse)
async def create_auto_payslip(
    employee_id: str = Path(..., description="Mitarbeiter-ID"),
    payslip_data: PayrollEntryAutoCreate = Body(..., description="Automatische Lohnzettel-Daten"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erstelle automatischen Lohnzettel basierend auf Compensation + Overtime"""
    try:
        # Nur Admins und Owner können Lohnzettel erstellen
        if current_user.role not in ["admin", "owner"]:
            raise ForbiddenError("Only admins and owners can create payslips")
        
        payroll_service = PayrollService(tenant_id)
        return await payroll_service.create_automatic_payroll_entry(payslip_data, current_user.user_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))