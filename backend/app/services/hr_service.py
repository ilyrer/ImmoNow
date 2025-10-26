"""
HR Service
Service für HR-Management (Urlaub, Anwesenheit, Überstunden, Spesen, Dokumente)
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from asgiref.sync import sync_to_async

from app.core.security import TokenData
from app.core.errors import NotFoundError, ValidationError, ForbiddenError
from app.core.hr_permissions import (
    can_access_employee_data, 
    get_accessible_employee_ids, 
    validate_employee_access,
    get_employee_by_user_id
)
from app.schemas.hr import (
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse,
    AttendanceCreate, AttendanceUpdate, AttendanceResponse,
    OvertimeCreate, OvertimeUpdate, OvertimeResponse,
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    EmployeeDocumentCreate, EmployeeDocumentUpdate, EmployeeDocumentResponse, EmployeeDocumentListResponse,
    EmployeeDetailResponse, HRStats,
    LeaveApprovalRequest, OvertimeApprovalRequest, ExpenseApprovalRequest
)
from app.db.models import (
    LeaveRequest, Attendance, Overtime, Expense, HRDocument,
    Employee, User, Tenant
)
from django.db import models
from django.db.models import Sum

logger = logging.getLogger(__name__)


class HRService:
    """Service für HR-Management"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    # ============================================================================
    # LEAVE REQUEST MANAGEMENT
    # ============================================================================
    
    async def create_leave_request(
        self, 
        current_user: TokenData, 
        leave_data: LeaveRequestCreate
    ) -> LeaveRequestResponse:
        """Erstelle Urlaubsantrag"""
        
        # Hole Employee-Objekt
        employee = await get_employee_by_user_id(current_user.user_id)
        if not employee:
            raise NotFoundError("Employee profile not found")
        
        # Validiere Daten
        if leave_data.start_date < date.today():
            raise ValidationError("Start date cannot be in the past")
        
        # Prüfe auf Überschneidungen
        overlapping_requests = await sync_to_async(list)(
            LeaveRequest.objects.filter(
                tenant_id=self.tenant_id,
                employee=employee,
                status__in=['pending', 'approved'],
                start_date__lte=leave_data.end_date,
                end_date__gte=leave_data.start_date
            )
        )
        
        if overlapping_requests:
            raise ValidationError("Overlapping leave request already exists")
        
        # Erstelle LeaveRequest
        leave_request = LeaveRequest(
            tenant_id=self.tenant_id,
            employee=employee,
            start_date=leave_data.start_date,
            end_date=leave_data.end_date,
            leave_type=leave_data.leave_type,
            days_count=leave_data.days_count,
            reason=leave_data.reason
        )
        
        await sync_to_async(leave_request.save)()
        
        return await self._convert_leave_request_to_response(leave_request)
    
    async def get_leave_requests(
        self, 
        current_user: TokenData,
        employee_id: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 20
    ) -> List[LeaveRequestResponse]:
        """Hole Urlaubsanträge"""
        
        # Einfache Validierung ohne komplexe Berechtigungen
        if current_user.role not in ["admin", "owner", "manager", "employee"]:
            raise ForbiddenError("Insufficient permissions")
        
        def _get_leave_requests():
            queryset = LeaveRequest.objects.filter(tenant_id=self.tenant_id)
            
            if employee_id:
                queryset = queryset.filter(employee_id=employee_id)
            if status:
                queryset = queryset.filter(status=status)
            
            offset = (page - 1) * size
            return list(queryset[offset:offset + size])
        
        leave_requests = await sync_to_async(_get_leave_requests)()
        
        return [await self._convert_leave_request_to_response(lr) for lr in leave_requests]
    
    async def approve_leave_request(
        self, 
        current_user: TokenData, 
        leave_request_id: str, 
        approval_data: LeaveApprovalRequest
    ) -> LeaveRequestResponse:
        """Genehmige/Ablehne Urlaubsantrag"""
        
        # Hole LeaveRequest
        leave_request = await sync_to_async(
            LeaveRequest.objects.filter(id=leave_request_id).first
        )()
        
        if not leave_request:
            raise NotFoundError("Leave request not found")
        
        # Prüfe Berechtigung
        if not await can_access_employee_data(current_user, str(leave_request.employee.id)):
            raise ForbiddenError("Insufficient permissions")
        
        # Prüfe ob bereits bearbeitet
        if leave_request.status not in ['pending']:
            raise ValidationError("Leave request already processed")
        
        # Hole approver
        approver = await sync_to_async(
            User.objects.filter(id=current_user.user_id).first
        )()
        
        # Update Status
        leave_request.status = approval_data.status
        leave_request.approved_by = approver
        leave_request.approved_at = datetime.now()
        
        if approval_data.status == 'rejected' and approval_data.rejection_reason:
            leave_request.rejection_reason = approval_data.rejection_reason
        
        await sync_to_async(leave_request.save)()
        
        return await self._convert_leave_request_to_response(leave_request)
    
    # ============================================================================
    # ATTENDANCE MANAGEMENT
    # ============================================================================
    
    async def record_attendance(
        self, 
        current_user: TokenData, 
        attendance_data: AttendanceCreate
    ) -> AttendanceResponse:
        """Erfasse Anwesenheit"""
        
        # Hole Employee-Objekt
        employee = await get_employee_by_user_id(current_user.user_id)
        if not employee:
            raise NotFoundError("Employee profile not found")
        
        def _check_existing_attendance():
            return Attendance.objects.filter(
                tenant_id=self.tenant_id,
                employee=employee,
                date=attendance_data.date
            ).first()
        
        existing_attendance = await sync_to_async(_check_existing_attendance)()
        
        if existing_attendance:
            # Update bestehenden Eintrag
            if attendance_data.check_in:
                existing_attendance.check_in = attendance_data.check_in
            if attendance_data.check_out:
                existing_attendance.check_out = attendance_data.check_out
            if attendance_data.location:
                existing_attendance.location = attendance_data.location
            if attendance_data.notes:
                existing_attendance.notes = attendance_data.notes
            
            await sync_to_async(existing_attendance.save)()
            return await self._convert_attendance_to_response(existing_attendance)
        else:
            # Erstelle neuen Eintrag
            def _create_attendance():
                attendance = Attendance(
                    tenant_id=self.tenant_id,
                    employee=employee,
                    date=attendance_data.date,
                    check_in=attendance_data.check_in,
                    check_out=attendance_data.check_out,
                    location=attendance_data.location,
                    notes=attendance_data.notes
                )
                attendance.save()
                return attendance
            
            attendance = await sync_to_async(_create_attendance)()
            return await self._convert_attendance_to_response(attendance)
    
    async def get_attendance(
        self, 
        current_user: TokenData,
        employee_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        size: int = 20
    ) -> List[AttendanceResponse]:
        """Hole Anwesenheitsdaten"""
        
        # Einfache Validierung ohne komplexe Berechtigungen
        if current_user.role not in ["admin", "owner", "manager", "employee"]:
            raise ForbiddenError("Insufficient permissions")
        
        def _get_attendance():
            queryset = Attendance.objects.filter(tenant_id=self.tenant_id)
            
            if employee_id:
                queryset = queryset.filter(employee_id=employee_id)
            if start_date:
                queryset = queryset.filter(date__gte=start_date)
            if end_date:
                queryset = queryset.filter(date__lte=end_date)
            
            offset = (page - 1) * size
            return list(queryset[offset:offset + size])
        
        attendance_records = await sync_to_async(_get_attendance)()
        
        return [await self._convert_attendance_to_response(ar) for ar in attendance_records]
    
    # ============================================================================
    # OVERTIME MANAGEMENT
    # ============================================================================
    
    async def submit_overtime(
        self, 
        current_user: TokenData, 
        overtime_data: OvertimeCreate
    ) -> OvertimeResponse:
        """Erfasse Überstunden"""
        
        # Hole Employee-Objekt
        employee = await get_employee_by_user_id(current_user.user_id)
        if not employee:
            raise NotFoundError("Employee profile not found")
        
        def _create_overtime():
            overtime = Overtime(
                tenant_id=self.tenant_id,
                employee=employee,
                date=overtime_data.date,
                hours=overtime_data.hours,
                rate=overtime_data.rate,
                reason=overtime_data.reason
            )
            overtime.save()
            return overtime
        
        overtime = await sync_to_async(_create_overtime)()
        
        return await self._convert_overtime_to_response(overtime)
    
    async def get_overtime(
        self, 
        current_user: TokenData,
        employee_id: Optional[str] = None,
        approved: Optional[bool] = None,
        page: int = 1,
        size: int = 20
    ) -> List[OvertimeResponse]:
        """Hole Überstunden"""
        
        # Einfache Validierung ohne komplexe Berechtigungen
        if current_user.role not in ["admin", "owner", "manager", "employee"]:
            raise ForbiddenError("Insufficient permissions")
        
        def _get_overtime():
            queryset = Overtime.objects.filter(tenant_id=self.tenant_id)
            
            if employee_id:
                queryset = queryset.filter(employee_id=employee_id)
            if approved is not None:
                queryset = queryset.filter(approved=approved)
            
            offset = (page - 1) * size
            return list(queryset[offset:offset + size])
        
        overtime_records = await sync_to_async(_get_overtime)()
        
        return [await self._convert_overtime_to_response(or_) for or_ in overtime_records]
    
    async def approve_overtime(
        self, 
        current_user: TokenData, 
        overtime_id: str, 
        approval_data: OvertimeApprovalRequest
    ) -> OvertimeResponse:
        """Genehmige/Ablehne Überstunden"""
        
        # Hole Overtime
        overtime = await sync_to_async(
            Overtime.objects.filter(id=overtime_id).first
        )()
        
        if not overtime:
            raise NotFoundError("Overtime record not found")
        
        # Prüfe Berechtigung
        if not await can_access_employee_data(current_user, str(overtime.employee.id)):
            raise ForbiddenError("Insufficient permissions")
        
        # Hole approver
        approver = await sync_to_async(
            User.objects.filter(id=current_user.user_id).first
        )()
        
        # Update Status
        overtime.approved = approval_data.approved
        overtime.approved_by = approver
        overtime.approved_at = datetime.now()
        
        if not approval_data.approved and approval_data.rejection_reason:
            overtime.rejection_reason = approval_data.rejection_reason
        
        await sync_to_async(overtime.save)()
        
        return await self._convert_overtime_to_response(overtime)
    
    # ============================================================================
    # EXPENSE MANAGEMENT
    # ============================================================================
    
    async def submit_expense(
        self, 
        current_user: TokenData, 
        expense_data: ExpenseCreate
    ) -> ExpenseResponse:
        """Erfasse Spesen"""
        
        # Hole Employee-Objekt
        employee = await get_employee_by_user_id(current_user.user_id)
        if not employee:
            raise NotFoundError("Employee profile not found")
        
        def _create_expense():
            expense = Expense(
                tenant_id=self.tenant_id,
                employee=employee,
                date=expense_data.date,
                amount=expense_data.amount,
                category=expense_data.category,
                description=expense_data.description,
                receipt_url=expense_data.receipt_url
            )
            expense.save()
            return expense
        
        expense = await sync_to_async(_create_expense)()
        
        return await self._convert_expense_to_response(expense)
    
    async def get_expenses(
        self, 
        current_user: TokenData,
        employee_id: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        size: int = 20
    ) -> List[ExpenseResponse]:
        """Hole Spesen"""
        
        # Einfache Validierung ohne komplexe Berechtigungen
        if current_user.role not in ["admin", "owner", "manager", "employee"]:
            raise ForbiddenError("Insufficient permissions")
        
        def _get_expenses():
            queryset = Expense.objects.filter(tenant_id=self.tenant_id)
            
            if employee_id:
                queryset = queryset.filter(employee_id=employee_id)
            if status:
                queryset = queryset.filter(status=status)
            
            offset = (page - 1) * size
            return list(queryset[offset:offset + size])
        
        expenses = await sync_to_async(_get_expenses)()
        
        return [await self._convert_expense_to_response(exp) for exp in expenses]
    
    async def approve_expense(
        self, 
        current_user: TokenData, 
        expense_id: str, 
        approval_data: ExpenseApprovalRequest
    ) -> ExpenseResponse:
        """Genehmige/Ablehne Spesen"""
        
        # Hole Expense
        expense = await sync_to_async(
            Expense.objects.filter(id=expense_id).first
        )()
        
        if not expense:
            raise NotFoundError("Expense record not found")
        
        # Prüfe Berechtigung
        if not await can_access_employee_data(current_user, str(expense.employee.id)):
            raise ForbiddenError("Insufficient permissions")
        
        # Hole approver
        approver = await sync_to_async(
            User.objects.filter(id=current_user.user_id).first
        )()
        
        # Update Status
        expense.status = approval_data.status
        expense.approved_by = approver
        expense.approved_at = datetime.now()
        
        if approval_data.status == 'rejected' and approval_data.rejection_reason:
            expense.rejection_reason = approval_data.rejection_reason
        
        await sync_to_async(expense.save)()
        
        return await self._convert_expense_to_response(expense)
    
    # ============================================================================
    # DOCUMENT MANAGEMENT
    # ============================================================================
    
    async def upload_document(
        self, 
        current_user: TokenData, 
        document_data: EmployeeDocumentCreate,
        employee_id: str
    ) -> EmployeeDocumentResponse:
        """Lade Dokument hoch"""
        
        # Prüfe Berechtigung
        if not await can_access_employee_data(current_user, employee_id):
            raise ForbiddenError("Insufficient permissions")
        
        # Hole Employee
        employee = await sync_to_async(
            Employee.objects.filter(id=employee_id).first
        )()
        
        if not employee:
            raise NotFoundError("Employee not found")
        
        # Hole uploader
        uploader = await sync_to_async(
            User.objects.filter(id=current_user.user_id).first
        )()
        
        # Erstelle HRDocument
        document = HRDocument(
            tenant_id=self.tenant_id,
            employee=employee,
            title=document_data.title,
            document_type=document_data.document_type,
            file_url=document_data.file_url,
            file_size=document_data.file_size,
            mime_type=document_data.mime_type,
            description=document_data.description,
            expires_at=document_data.expires_at,
            is_confidential=document_data.is_confidential,
            uploaded_by=uploader
        )
        
        await sync_to_async(document.save)()
        
        return await self._convert_document_to_response(document)
    
    async def get_documents(
        self, 
        current_user: TokenData,
        page: int = 1,
        size: int = 10,
        document_type: Optional[str] = None,
        employee_id: Optional[str] = None
    ) -> EmployeeDocumentListResponse:
        """Hole alle Dokumente"""
        
        # Einfache Validierung ohne komplexe Berechtigungen
        if current_user.role not in ["admin", "owner", "manager", "employee"]:
            raise ForbiddenError("Insufficient permissions")
        
        def _get_documents():
            queryset = HRDocument.objects.filter(tenant_id=self.tenant_id)
            
            if document_type:
                queryset = queryset.filter(document_type=document_type)
            if employee_id:
                queryset = queryset.filter(employee_id=employee_id)
            
            total = queryset.count()
            offset = (page - 1) * size
            documents = list(queryset[offset:offset + size])
            
            return documents, total
        
        documents, total = await sync_to_async(_get_documents)()
        
        # Konvertiere zu Response-Objekten
        document_responses = []
        for doc in documents:
            response = await self._convert_document_to_response(doc)
            document_responses.append(response)
        
        pages = (total + size - 1) // size if total > 0 else 0
        
        return EmployeeDocumentListResponse(
            documents=document_responses,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
    
    # ============================================================================
    # EMPLOYEE DETAIL
    # ============================================================================
    
    async def get_employee_detail(
        self, 
        current_user: TokenData, 
        employee_id: str
    ) -> EmployeeDetailResponse:
        """Hole vollständige Mitarbeiterdetails - echte Daten"""
        
        # Einfache Validierung ohne komplexe Berechtigungen
        if current_user.role not in ["admin", "owner", "manager", "employee"]:
            raise ForbiddenError("Insufficient permissions")
        
        # Hole Employee mit User-Daten
        def _get_employee():
            return Employee.objects.select_related('user', 'manager').filter(user_id=employee_id).first()
        
        employee = await sync_to_async(_get_employee)()
        
        if not employee:
            raise NotFoundError("Employee not found")
        
        # Berechne echte Statistiken
        def _get_statistics():
            # Urlaubstage
            leave_requests = LeaveRequest.objects.filter(employee=employee, status='approved')
            total_leave_used = sum(lr.days_count for lr in leave_requests)
            
            # Überstunden
            overtime_records = Overtime.objects.filter(employee=employee, approved=True)
            total_overtime = sum(float(or_.hours) for or_ in overtime_records)
            
            # Spesen
            expenses = Expense.objects.filter(employee=employee)
            total_expenses = sum(float(exp.amount) for exp in expenses)
            pending_expenses = sum(float(exp.amount) for exp in expenses.filter(status='pending'))
            
            return {
                'total_leave_used': total_leave_used,
                'total_overtime': total_overtime,
                'total_expenses': total_expenses,
                'pending_expenses': pending_expenses
            }
        
        stats = await sync_to_async(_get_statistics)()
        
        # Erstelle Response mit echten Daten
        return EmployeeDetailResponse(
            id=str(employee.id),
            employee_number=employee.employee_number or f"EMP{str(employee.id)[:8].upper()}",
            full_name=f"{employee.user.first_name or ''} {employee.user.last_name or ''}".strip() or employee.user.email,
            email=employee.user.email or '',
            department=employee.department or '',
            position=employee.position or '',
            employment_type=employee.employment_type or 'Vollzeit',
            start_date=employee.start_date or '2024-01-01',
            end_date=employee.end_date,
            work_email=employee.work_email or employee.user.email,
            work_phone=employee.work_phone or '',
            office_location=employee.office_location or '',
            manager_id=str(employee.manager.id) if employee.manager else None,
            manager_name=f"{employee.manager.user.first_name} {employee.manager.user.last_name}".strip() if employee.manager else None,
            is_active=employee.is_active,
            is_on_leave=employee.is_on_leave,
            leave_start=employee.leave_start,
            leave_end=employee.leave_end,
            created_at=employee.created_at,
            updated_at=employee.updated_at,
            
            # Echte Statistiken
            total_leave_days_used=int(stats['total_leave_used']),
            total_leave_days_remaining=max(0, 30 - int(stats['total_leave_used'])),  # Annahme: 30 Tage
            total_overtime_hours=stats['total_overtime'],
            total_expenses_amount=stats['total_expenses'],
            total_expenses_pending=stats['pending_expenses'],
            attendance_rate=95.0,  # TODO: Berechne echte Anwesenheitsrate
            
            # Admin-editable fields
            annual_leave_days=employee.annual_leave_days,
            overtime_balance=float(employee.overtime_balance),
            expense_limit=employee.expense_limit,
            
            # Leere Listen für jetzt
            recent_leave_requests=[],
            recent_attendance=[],
            recent_overtime=[],
            recent_expenses=[],
            recent_documents=[]
        )
    
    async def update_employee_detail(
        self, 
        current_user: TokenData, 
        employee_id: str,
        update_data: dict
    ) -> EmployeeDetailResponse:
        """Aktualisiere Mitarbeiterdetails"""
        
        # Nur Admins und Owner können bearbeiten
        if current_user.role not in ["admin", "owner"]:
            raise ForbiddenError("Only admins and owners can edit employee data")
        
        # Hole Employee
        def _get_employee():
            return Employee.objects.select_related('user').filter(user_id=employee_id).first()
        
        employee = await sync_to_async(_get_employee)()
        
        if not employee:
            raise NotFoundError("Employee not found")
        
        # Aktualisiere erlaubte Felder
        allowed_fields = [
            'department', 'position', 'employment_type', 'work_email', 
            'work_phone', 'office_location', 'is_active', 'is_on_leave',
            'leave_start', 'leave_end', 'annual_leave_days', 'overtime_balance', 'expense_limit'
        ]
        
        def _update_employee():
            for field in allowed_fields:
                if field in update_data:
                    setattr(employee, field, update_data[field])
            
            # Spezielle Behandlung für Urlaubstage
            if 'annual_leave_days' in update_data:
                # Berechne verbleibende Urlaubstage neu
                def _calculate_remaining_leave():
                    approved_leave = LeaveRequest.objects.filter(
                        employee=employee, 
                        status='approved'
                    ).aggregate(total=models.Sum('days_count'))['total'] or 0
                    return max(0, update_data['annual_leave_days'] - int(approved_leave))
                
                remaining_leave = _calculate_remaining_leave()
                employee.remaining_leave_days = remaining_leave
            
            employee.save()
            return employee
        
        updated_employee = await sync_to_async(_update_employee)()
        
        # Hole aktualisierte Daten
        return await self.get_employee_detail(current_user, employee_id)
    
    async def get_approved_leave_dates(
        self,
        employee_id: str,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Hole alle genehmigten Urlaubstage für Kalender-Anzeige"""
        
        def _get_approved_leaves():
            # Hole Employee
            employee = Employee.objects.filter(user_id=employee_id).first()
            if not employee:
                return []
            
            # Filter: status='approved', employee_id, Datumsbereich
            leaves = LeaveRequest.objects.filter(
                employee=employee,
                status='approved',
                start_date__lte=end_date,
                end_date__gte=start_date
            ).order_by('start_date')
            
            result = []
            for leave in leaves:
                # Erstelle Liste aller Tage im Urlaubszeitraum
                current_date = max(leave.start_date, start_date)
                end_leave_date = min(leave.end_date, end_date)
                
                while current_date <= end_leave_date:
                    result.append({
                        'date': current_date.isoformat(),
                        'leave_type': leave.leave_type,
                        'reason': leave.reason or '',
                        'days_count': leave.days_count,
                        'leave_id': str(leave.id)
                    })
                    current_date += timedelta(days=1)
            
            return result
        
        return await sync_to_async(_get_approved_leaves)()
    
    async def _convert_leave_request_to_response(self, lr: LeaveRequest) -> LeaveRequestResponse:
        """Konvertiere LeaveRequest zu Response"""
        def _get_employee_name():
            return f"{lr.employee.user.first_name} {lr.employee.user.last_name}".strip() if lr.employee and lr.employee.user else "Unknown"
        
        def _get_approver_name():
            return f"{lr.approved_by.first_name} {lr.approved_by.last_name}".strip() if lr.approved_by else None
        
        employee_name = await sync_to_async(_get_employee_name)()
        approver_name = await sync_to_async(_get_approver_name)() if lr.approved_by else None
        
        return LeaveRequestResponse(
            id=str(lr.id),
            employee_id=str(lr.employee.id),
            employee_name=employee_name,
            start_date=lr.start_date,
            end_date=lr.end_date,
            leave_type=lr.leave_type,
            days_count=lr.days_count,
            reason=lr.reason,
            status=lr.status,
            approved_by=str(lr.approved_by.id) if lr.approved_by else None,
            approved_by_name=approver_name,
            approved_at=lr.approved_at,
            rejection_reason=lr.rejection_reason,
            created_at=lr.created_at,
            updated_at=lr.updated_at
        )
    
    async def _convert_attendance_to_response(self, att: Attendance) -> AttendanceResponse:
        """Konvertiere Attendance zu Response"""
        def _get_employee_name():
            return f"{att.employee.user.first_name} {att.employee.user.last_name}".strip() if att.employee and att.employee.user else "Unknown"
        
        employee_name = await sync_to_async(_get_employee_name)()
        
        return AttendanceResponse(
            id=str(att.id),
            employee_id=str(att.employee.id),
            employee_name=employee_name,
            date=att.date,
            check_in=att.check_in,
            check_out=att.check_out,
            hours_worked=att.hours_worked,
            location=att.location,
            notes=att.notes,
            created_at=att.created_at,
            updated_at=att.updated_at
        )
    
    async def _convert_overtime_to_response(self, ot: Overtime) -> OvertimeResponse:
        """Konvertiere Overtime zu Response"""
        def _get_employee_name():
            return f"{ot.employee.user.first_name} {ot.employee.user.last_name}".strip() if ot.employee and ot.employee.user else "Unknown"
        
        def _get_approver_name():
            return f"{ot.approved_by.first_name} {ot.approved_by.last_name}".strip() if ot.approved_by else None
        
        employee_name = await sync_to_async(_get_employee_name)()
        approver_name = await sync_to_async(_get_approver_name)() if ot.approved_by else None
        
        return OvertimeResponse(
            id=str(ot.id),
            employee_id=str(ot.employee.id),
            employee_name=employee_name,
            date=ot.date,
            hours=ot.hours,
            rate=ot.rate,
            reason=ot.reason,
            approved=ot.approved,
            approved_by=str(ot.approved_by.id) if ot.approved_by else None,
            approved_by_name=approver_name,
            approved_at=ot.approved_at,
            rejection_reason=ot.rejection_reason,
            total_amount=ot.total_amount,
            created_at=ot.created_at,
            updated_at=ot.updated_at
        )
    
    async def _convert_expense_to_response(self, exp: Expense) -> ExpenseResponse:
        """Konvertiere Expense zu Response"""
        def _get_employee_name():
            return f"{exp.employee.user.first_name} {exp.employee.user.last_name}".strip() if exp.employee and exp.employee.user else "Unknown"
        
        def _get_approver_name():
            return f"{exp.approved_by.first_name} {exp.approved_by.last_name}".strip() if exp.approved_by else None
        
        employee_name = await sync_to_async(_get_employee_name)()
        approver_name = await sync_to_async(_get_approver_name)() if exp.approved_by else None
        
        return ExpenseResponse(
            id=str(exp.id),
            employee_id=str(exp.employee.id),
            employee_name=employee_name,
            date=exp.date,
            amount=exp.amount,
            category=exp.category,
            description=exp.description,
            receipt_url=exp.receipt_url,
            status=exp.status,
            approved_by=str(exp.approved_by.id) if exp.approved_by else None,
            approved_by_name=approver_name,
            approved_at=exp.approved_at,
            rejection_reason=exp.rejection_reason,
            created_at=exp.created_at,
            updated_at=exp.updated_at
        )
    
    async def _convert_document_to_response(self, doc: HRDocument) -> EmployeeDocumentResponse:
        """Konvertiere HRDocument zu Response"""
        def _get_employee_name():
            return f"{doc.employee.user.first_name} {doc.employee.user.last_name}".strip() if doc.employee and doc.employee.user else "Unknown"
        
        def _get_uploader_name():
            return f"{doc.uploaded_by.first_name} {doc.uploaded_by.last_name}".strip() if doc.uploaded_by else "Unknown"
        
        employee_name = await sync_to_async(_get_employee_name)()
        uploader_name = await sync_to_async(_get_uploader_name)()
        
        return EmployeeDocumentResponse(
            id=str(doc.id),
            employee_id=str(doc.employee.id),
            employee_name=employee_name,
            title=doc.title,
            document_type=doc.document_type,
            description=doc.description,
            expires_at=doc.expires_at,
            is_confidential=doc.is_confidential,
            file_url=doc.file_url,
            file_size=doc.file_size,
            mime_type=doc.mime_type,
            file_extension=doc.file_extension,
            is_expired=doc.is_expired,
            uploaded_by=str(doc.uploaded_by.id),
            uploaded_by_name=uploader_name,
            uploaded_at=doc.uploaded_at,
            updated_at=doc.updated_at
        )
