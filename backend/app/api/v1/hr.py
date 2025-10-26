"""
HR API Endpoints
API für HR-Management (Urlaub, Anwesenheit, Überstunden, Spesen, Dokumente)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, UploadFile, File
from fastapi.responses import Response
from fastapi.responses import StreamingResponse
from typing import Optional, List
import io
import logging

from app.schemas.hr import (
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse, LeaveRequestListResponse,
    AttendanceCreate, AttendanceUpdate, AttendanceResponse, AttendanceListResponse,
    OvertimeCreate, OvertimeUpdate, OvertimeResponse, OvertimeListResponse,
    ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseListResponse,
    EmployeeDocumentCreate, EmployeeDocumentUpdate, EmployeeDocumentResponse, EmployeeDocumentListResponse,
    EmployeeDetailResponse, HRStats,
    LeaveApprovalRequest, OvertimeApprovalRequest, ExpenseApprovalRequest
)
from app.services.hr_service import HRService
from app.core.security import TokenData
from app.api.deps import (
    require_hr_access, require_manager_access, require_admin_scope,
    get_tenant_id, get_current_user
)
from app.core.errors import NotFoundError, ValidationError, ForbiddenError
from asgiref.sync import sync_to_async
from app.db.models import LeaveRequest, Attendance, Overtime, Expense, HRDocument

logger = logging.getLogger(__name__)
router = APIRouter(prefix="")


# ============================================================================
# LEAVE REQUEST ENDPOINTS
# ============================================================================

@router.post("/leave-requests", response_model=LeaveRequestResponse)
async def create_leave_request(
    leave_data: LeaveRequestCreate,
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erstelle Urlaubsantrag"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.create_leave_request(current_user, leave_data)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/leave-requests", response_model=LeaveRequestListResponse)
async def get_leave_requests(
    employee_id: Optional[str] = Query(None, description="Mitarbeiter-ID"),
    status: Optional[str] = Query(None, description="Status"),
    page: int = Query(1, ge=1, description="Seite"),
    size: int = Query(20, ge=1, le=100, description="Größe"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Hole Urlaubsanträge"""
    try:
        hr_service = HRService(tenant_id)
        leave_requests = await hr_service.get_leave_requests(
            current_user, employee_id, status, page, size
        )
        
        return LeaveRequestListResponse(
            leave_requests=leave_requests,
            total=await sync_to_async(
                lambda: LeaveRequest.objects.filter(tenant_id=tenant_id).count()
            )(),
            page=page,
            size=size,
            pages=(await sync_to_async(
                lambda: LeaveRequest.objects.filter(tenant_id=tenant_id).count()
            )() + size - 1) // size
        )
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/leave-requests/{leave_request_id}/approve", response_model=LeaveRequestResponse)
async def approve_leave_request(
    leave_request_id: str = Path(..., description="Urlaubsantrag-ID"),
    approval_data: LeaveApprovalRequest = ...,
    current_user: TokenData = Depends(require_manager_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Genehmige/Ablehne Urlaubsantrag"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.approve_leave_request(current_user, leave_request_id, approval_data)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# ATTENDANCE ENDPOINTS
# ============================================================================

@router.post("/attendance", response_model=AttendanceResponse)
async def record_attendance(
    attendance_data: AttendanceCreate,
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erfasse Anwesenheit"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.record_attendance(current_user, attendance_data)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/attendance", response_model=AttendanceListResponse)
async def get_attendance(
    employee_id: Optional[str] = Query(None, description="Mitarbeiter-ID"),
    start_date: Optional[str] = Query(None, description="Startdatum (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Enddatum (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Seite"),
    size: int = Query(20, ge=1, le=100, description="Größe"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Hole Anwesenheitsdaten"""
    try:
        from datetime import datetime
        
        hr_service = HRService(tenant_id)
        
        # Parse dates
        start_date_obj = None
        end_date_obj = None
        
        if start_date:
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        if end_date:
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        attendance_records = await hr_service.get_attendance(
            current_user, employee_id, start_date_obj, end_date_obj, page, size
        )
        
        return AttendanceListResponse(
            attendance_records=attendance_records,
            total=await sync_to_async(
                lambda: Attendance.objects.filter(tenant_id=tenant_id).count()
            )(),
            page=page,
            size=size,
            pages=(await sync_to_async(
                lambda: Attendance.objects.filter(tenant_id=tenant_id).count()
            )() + size - 1) // size
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format")
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# OVERTIME ENDPOINTS
# ============================================================================

@router.post("/overtime", response_model=OvertimeResponse)
async def submit_overtime(
    overtime_data: OvertimeCreate,
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erfasse Überstunden"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.submit_overtime(current_user, overtime_data)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/overtime", response_model=OvertimeListResponse)
async def get_overtime(
    employee_id: Optional[str] = Query(None, description="Mitarbeiter-ID"),
    approved: Optional[bool] = Query(None, description="Genehmigt"),
    page: int = Query(1, ge=1, description="Seite"),
    size: int = Query(20, ge=1, le=100, description="Größe"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Hole Überstunden"""
    try:
        hr_service = HRService(tenant_id)
        overtime_records = await hr_service.get_overtime(
            current_user, employee_id, approved, page, size
        )
        
        return OvertimeListResponse(
            overtime_records=overtime_records,
            total=await sync_to_async(
                lambda: Overtime.objects.filter(tenant_id=tenant_id).count()
            )(),
            page=page,
            size=size,
            pages=(await sync_to_async(
                lambda: Overtime.objects.filter(tenant_id=tenant_id).count()
            )() + size - 1) // size
        )
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/overtime/{overtime_id}/approve", response_model=OvertimeResponse)
async def approve_overtime(
    overtime_id: str = Path(..., description="Überstunden-ID"),
    approval_data: OvertimeApprovalRequest = ...,
    current_user: TokenData = Depends(require_manager_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Genehmige/Ablehne Überstunden"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.approve_overtime(current_user, overtime_id, approval_data)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# EXPENSE ENDPOINTS
# ============================================================================

@router.post("/expenses", response_model=ExpenseResponse)
async def submit_expense(
    expense_data: ExpenseCreate,
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Erfasse Spesen"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.submit_expense(current_user, expense_data)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/expenses", response_model=ExpenseListResponse)
async def get_expenses(
    employee_id: Optional[str] = Query(None, description="Mitarbeiter-ID"),
    status: Optional[str] = Query(None, description="Status"),
    page: int = Query(1, ge=1, description="Seite"),
    size: int = Query(20, ge=1, le=100, description="Größe"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Hole Spesen"""
    try:
        hr_service = HRService(tenant_id)
        expenses = await hr_service.get_expenses(
            current_user, employee_id, status, page, size
        )
        
        return ExpenseListResponse(
            expenses=expenses,
            total=await sync_to_async(
                lambda: Expense.objects.filter(tenant_id=tenant_id).count()
            )(),
            page=page,
            size=size,
            pages=(await sync_to_async(
                lambda: Expense.objects.filter(tenant_id=tenant_id).count()
            )() + size - 1) // size
        )
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/expenses/{expense_id}/approve", response_model=ExpenseResponse)
async def approve_expense(
    expense_id: str = Path(..., description="Spesen-ID"),
    approval_data: ExpenseApprovalRequest = ...,
    current_user: TokenData = Depends(require_manager_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Genehmige/Ablehne Spesen"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.approve_expense(current_user, expense_id, approval_data)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# DOCUMENT ENDPOINTS
# ============================================================================

@router.post("/documents/{employee_id}", response_model=EmployeeDocumentResponse)
async def upload_document(
    employee_id: str = Path(..., description="Mitarbeiter-ID"),
    document_data: EmployeeDocumentCreate = ...,
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Lade Dokument hoch"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.upload_document(current_user, document_data, employee_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/documents/{employee_id}", response_model=EmployeeDocumentListResponse)
async def get_documents(
    employee_id: str = Path(..., description="Mitarbeiter-ID"),
    document_type: Optional[str] = Query(None, description="Dokumenttyp"),
    page: int = Query(1, ge=1, description="Seite"),
    size: int = Query(20, ge=1, le=100, description="Größe"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Hole Dokumente"""
    try:
        hr_service = HRService(tenant_id)
        documents = await hr_service.get_documents(
            current_user, employee_id, document_type, page, size
        )
        
        return EmployeeDocumentListResponse(
            documents=documents,
            total=await sync_to_async(
                lambda: HRDocument.objects.filter(tenant_id=tenant_id, employee_id=employee_id).count()
            )(),
            page=page,
            size=size,
            pages=(await sync_to_async(
                lambda: HRDocument.objects.filter(tenant_id=tenant_id, employee_id=employee_id).count()
            )() + size - 1) // size
        )
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/leave-requests/calendar")
async def get_leave_calendar(
    employee_id: str = Query(..., description="Mitarbeiter-ID"),
    start_date: str = Query(..., description="Start-Datum (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End-Datum (YYYY-MM-DD)"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Hole Urlaubs-Kalender für Mitarbeiter"""
    try:
        from datetime import datetime
        
        # Parse dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        hr_service = HRService(tenant_id)
        leave_dates = await hr_service.get_approved_leave_dates(employee_id, start_dt, end_dt)
        
        return {
            "employee_id": employee_id,
            "start_date": start_date,
            "end_date": end_date,
            "leave_dates": leave_dates
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error in get_leave_calendar: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/documents")
async def get_documents(
    page: int = Query(1, ge=1, description="Seitennummer"),
    size: int = Query(10, ge=1, le=100, description="Seitengröße"),
    document_type: Optional[str] = Query(None, description="Dokumenttyp"),
    employee_id: Optional[str] = Query(None, description="Mitarbeiter-ID"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Hole alle Dokumente"""
    try:
        hr_service = HRService(tenant_id)
        return await hr_service.get_documents(current_user, page, size, document_type, employee_id)
    except Exception as e:
        logger.error(f"Error in get_documents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: str = Path(..., description="Dokument-ID"),
    current_user: TokenData = Depends(require_hr_access),
    tenant_id: str = Depends(get_tenant_id)
):
    """Lade Dokument herunter"""
    try:
        hr_service = HRService(tenant_id)
        
        # Hole Dokument-Info
        def _get_document():
            return HRDocument.objects.filter(
                id=document_id, 
                tenant_id=tenant_id
            ).first()
        
        document = await sync_to_async(_get_document)()
        
        if not document:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokument nicht gefunden")
        
        # Prüfe Berechtigung
        if not await hr_service.can_access_employee_data(current_user, str(document.employee_id)):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Keine Berechtigung")
        
        # Echter Datei-Download implementiert
        if document.file_path:
            try:
                import os
                file_path = os.path.join("media", document.file_path)
                
                if os.path.exists(file_path):
                    with open(file_path, 'rb') as f:
                        file_content = f.read()
                    
                    # Bestimme MIME-Type basierend auf Dateiendung
                    mime_type = "application/octet-stream"
                    if document.file_name:
                        if document.file_name.lower().endswith('.pdf'):
                            mime_type = "application/pdf"
                        elif document.file_name.lower().endswith(('.jpg', '.jpeg')):
                            mime_type = "image/jpeg"
                        elif document.file_name.lower().endswith('.png'):
                            mime_type = "image/png"
                        elif document.file_name.lower().endswith('.doc'):
                            mime_type = "application/msword"
                        elif document.file_name.lower().endswith('.docx'):
                            mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    
                    return Response(
                        content=file_content,
                        media_type=mime_type,
                        headers={
                            "Content-Disposition": f"attachment; filename={document.file_name}",
                            "Content-Length": str(len(file_content))
                        }
                    )
                else:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Datei nicht im Dateisystem gefunden")
            except Exception as e:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Download-Fehler: {str(e)}")
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Datei nicht verfügbar")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# EMPLOYEE DETAIL ENDPOINT
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
