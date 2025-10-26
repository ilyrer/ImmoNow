"""
Employee Service
Service für Mitarbeiterverwaltung und Gehaltsverwaltung
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta
from decimal import Decimal
from django.db import transaction
from django.db.models import Q, Count, Avg, Sum
from django.core.exceptions import ValidationError
from asgiref.sync import sync_to_async

from app.db.models import Employee, EmployeeCompensation, User, TenantUser, Tenant
from app.schemas.employee import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeListResponse,
    EmployeeCompensationCreate, EmployeeCompensationUpdate, EmployeeCompensationResponse,
    EmployeeStats
)
from app.core.errors import NotFoundError, ValidationError as AppValidationError


class EmployeeService:
    """Service für Mitarbeiterverwaltung"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_employees(
        self, 
        page: int = 1, 
        size: int = 20,
        search: Optional[str] = None,
        department: Optional[str] = None,
        position: Optional[str] = None,
        is_active: Optional[bool] = None,
        manager_id: Optional[str] = None
    ) -> EmployeeListResponse:
        """Alle Mitarbeiter abrufen mit Filterung und Paginierung"""
        
        def _get_employees():
            queryset = Employee.objects.filter(tenant_id=self.tenant_id)
            
            # Apply filters
            if search:
                queryset = queryset.filter(
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search) |
                    Q(user__email__icontains=search) |
                    Q(employee_number__icontains=search)
                )
            
            if department:
                queryset = queryset.filter(department=department)
            
            if position:
                queryset = queryset.filter(position=position)
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active)
            
            if manager_id:
                queryset = queryset.filter(manager_id=manager_id)
            
            # Count total
            total = queryset.count()
            
            # Apply pagination
            offset = (page - 1) * size
            employees = list(
                queryset.select_related('user', 'manager__user')
                .order_by('employee_number')[offset:offset + size]
            )
            
            return employees, total
        
        employees, total = await sync_to_async(_get_employees)()
        
        # Convert to response format
        employee_responses = []
        for emp in employees:
            employee_responses.append(EmployeeResponse(
                id=str(emp.id),
                user_id=str(emp.user.id),
                user_first_name=emp.user.first_name,
                user_last_name=emp.user.last_name,
                user_email=emp.user.email,
                employee_number=emp.employee_number,
                department=emp.department,
                position=emp.position,
                employment_type=emp.employment_type,
                start_date=emp.start_date,
                end_date=emp.end_date,
                work_email=emp.work_email,
                work_phone=emp.work_phone,
                office_location=emp.office_location,
                manager_id=str(emp.manager.id) if emp.manager else None,
                manager_name=f"{emp.manager.user.first_name} {emp.manager.user.last_name}".strip() if emp.manager and emp.manager.user else None,
                is_active=emp.is_active,
                is_on_leave=emp.is_on_leave,
                leave_start=emp.leave_start,
                leave_end=emp.leave_end,
                notes=emp.notes,
                created_at=emp.created_at,
                updated_at=emp.updated_at,
                created_by=str(emp.created_by.id)
            ))
        
        return EmployeeListResponse(
            employees=employee_responses,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
    
    async def get_employee(self, employee_id: str) -> EmployeeResponse:
        """Einzelnen Mitarbeiter abrufen"""
        
        def _get_employee():
            try:
                employee = Employee.objects.select_related('user', 'manager__user').get(
                    id=employee_id, 
                    tenant_id=self.tenant_id
                )
                return employee
            except Employee.DoesNotExist:
                raise NotFoundError(f"Mitarbeiter mit ID {employee_id} nicht gefunden")
        
        employee = await sync_to_async(_get_employee)()
        
        return EmployeeResponse(
            id=str(employee.id),
            user_id=str(employee.user.id),
            user_first_name=employee.user.first_name,
            user_last_name=employee.user.last_name,
            user_email=employee.user.email,
            employee_number=employee.employee_number,
            department=employee.department,
            position=employee.position,
            employment_type=employee.employment_type,
            start_date=employee.start_date,
            end_date=employee.end_date,
            work_email=employee.work_email,
            work_phone=employee.work_phone,
            office_location=employee.office_location,
            manager_id=str(employee.manager.id) if employee.manager else None,
            manager_name=f"{employee.manager.user.first_name} {employee.manager.user.last_name}".strip() if employee.manager and employee.manager.user else None,
            is_active=employee.is_active,
            is_on_leave=employee.is_on_leave,
            leave_start=employee.leave_start,
            leave_end=employee.leave_end,
            notes=employee.notes,
            created_at=employee.created_at,
            updated_at=employee.updated_at,
            created_by=str(employee.created_by.id)
        )
    
    async def create_employee(self, employee_data: EmployeeCreate, created_by: str) -> EmployeeResponse:
        """Neuen Mitarbeiter erstellen"""
        
        def _create_employee():
            # Get user
            try:
                user = User.objects.get(id=employee_data.user_id)
            except User.DoesNotExist:
                raise NotFoundError("Benutzer nicht gefunden")
            
            # Check if employee already exists for this user
            if Employee.objects.filter(user=user, tenant_id=self.tenant_id).exists():
                raise ValidationError("Mitarbeiter für diesen Benutzer existiert bereits")
            
            # Get manager if specified
            manager = None
            if employee_data.manager_id:
                try:
                    manager = Employee.objects.get(id=employee_data.manager_id, tenant_id=self.tenant_id)
                except Employee.DoesNotExist:
                    raise NotFoundError("Manager nicht gefunden")
            
            # Get created_by user
            try:
                created_by_user = User.objects.get(id=created_by)
            except User.DoesNotExist:
                raise NotFoundError("Ersteller nicht gefunden")
            
            # Create employee
            employee = Employee.objects.create(
                tenant_id=self.tenant_id,
                user=user,
                employee_number=employee_data.employee_number,
                department=employee_data.department,
                position=employee_data.position,
                employment_type=employee_data.employment_type,
                start_date=employee_data.start_date,
                end_date=employee_data.end_date,
                work_email=employee_data.work_email,
                work_phone=employee_data.work_phone,
                office_location=employee_data.office_location,
                manager=manager,
                is_active=employee_data.is_active,
                is_on_leave=employee_data.is_on_leave,
                leave_start=employee_data.leave_start,
                leave_end=employee_data.leave_end,
                notes=employee_data.notes,
                created_by=created_by_user
            )
            
            return employee
        
        employee = await sync_to_async(_create_employee)()
        
        return EmployeeResponse(
            id=str(employee.id),
            user_id=str(employee.user.id),
            user_first_name=employee.user.first_name,
            user_last_name=employee.user.last_name,
            user_email=employee.user.email,
            employee_number=employee.employee_number,
            department=employee.department,
            position=employee.position,
            employment_type=employee.employment_type,
            start_date=employee.start_date,
            end_date=employee.end_date,
            work_email=employee.work_email,
            work_phone=employee.work_phone,
            office_location=employee.office_location,
            manager_id=str(employee.manager.id) if employee.manager else None,
            manager_name=f"{employee.manager.user.first_name} {employee.manager.user.last_name}".strip() if employee.manager and employee.manager.user else None,
            is_active=employee.is_active,
            is_on_leave=employee.is_on_leave,
            leave_start=employee.leave_start,
            leave_end=employee.leave_end,
            notes=employee.notes,
            created_at=employee.created_at,
            updated_at=employee.updated_at,
            created_by=str(employee.created_by.id)
        )
    
    async def update_employee(self, employee_id: str, employee_data: EmployeeUpdate, updated_by: str) -> EmployeeResponse:
        """Mitarbeiter aktualisieren"""
        
        def _update_employee():
            try:
                employee = Employee.objects.get(id=employee_id, tenant_id=self.tenant_id)
            except Employee.DoesNotExist:
                raise NotFoundError(f"Mitarbeiter mit ID {employee_id} nicht gefunden")
            
            # Update fields
            if employee_data.employee_number:
                employee.employee_number = employee_data.employee_number
            if employee_data.department:
                employee.department = employee_data.department
            if employee_data.position:
                employee.position = employee_data.position
            if employee_data.employment_type:
                employee.employment_type = employee_data.employment_type
            if employee_data.start_date:
                employee.start_date = employee_data.start_date
            if employee_data.end_date is not None:
                employee.end_date = employee_data.end_date
            if employee_data.work_email:
                employee.work_email = employee_data.work_email
            if employee_data.work_phone is not None:
                employee.work_phone = employee_data.work_phone
            if employee_data.office_location is not None:
                employee.office_location = employee_data.office_location
            if employee_data.manager_id is not None:
                if employee_data.manager_id:
                    try:
                        manager = Employee.objects.get(id=employee_data.manager_id, tenant_id=self.tenant_id)
                        employee.manager = manager
                    except Employee.DoesNotExist:
                        raise NotFoundError("Manager nicht gefunden")
                else:
                    employee.manager = None
            if employee_data.is_active is not None:
                employee.is_active = employee_data.is_active
            if employee_data.is_on_leave is not None:
                employee.is_on_leave = employee_data.is_on_leave
            if employee_data.leave_start is not None:
                employee.leave_start = employee_data.leave_start
            if employee_data.leave_end is not None:
                employee.leave_end = employee_data.leave_end
            if employee_data.notes is not None:
                employee.notes = employee_data.notes
            
            employee.save()
            return employee
        
        employee = await sync_to_async(_update_employee)()
        
        return EmployeeResponse(
            id=str(employee.id),
            user_id=str(employee.user.id),
            user_first_name=employee.user.first_name,
            user_last_name=employee.user.last_name,
            user_email=employee.user.email,
            employee_number=employee.employee_number,
            department=employee.department,
            position=employee.position,
            employment_type=employee.employment_type,
            start_date=employee.start_date,
            end_date=employee.end_date,
            work_email=employee.work_email,
            work_phone=employee.work_phone,
            office_location=employee.office_location,
            manager_id=str(employee.manager.id) if employee.manager else None,
            manager_name=f"{employee.manager.user.first_name} {employee.manager.user.last_name}".strip() if employee.manager and employee.manager.user else None,
            is_active=employee.is_active,
            is_on_leave=employee.is_on_leave,
            leave_start=employee.leave_start,
            leave_end=employee.leave_end,
            notes=employee.notes,
            created_at=employee.created_at,
            updated_at=employee.updated_at,
            created_by=str(employee.created_by.id)
        )
    
    async def delete_employee(self, employee_id: str) -> bool:
        """Mitarbeiter löschen"""
        
        def _delete_employee():
            try:
                employee = Employee.objects.get(id=employee_id, tenant_id=self.tenant_id)
                employee.delete()
                return True
            except Employee.DoesNotExist:
                raise NotFoundError(f"Mitarbeiter mit ID {employee_id} nicht gefunden")
        
        await sync_to_async(_delete_employee)()
        return True
    
    async def get_employee_stats(self) -> EmployeeStats:
        """Mitarbeiter-Statistiken abrufen"""
        
        def _get_employee_stats():
            total_employees = Employee.objects.filter(tenant_id=self.tenant_id).count()
            active_employees = Employee.objects.filter(tenant_id=self.tenant_id, is_active=True).count()
            inactive_employees = total_employees - active_employees
            
            # Employees by department
            employees_by_department = {}
            employees = list(Employee.objects.filter(tenant_id=self.tenant_id).exclude(department__isnull=True).exclude(department=''))
            for emp in employees:
                dept = emp.department
                employees_by_department[dept] = employees_by_department.get(dept, 0) + 1
            
            # Employees by position
            employees_by_position = {}
            employees_pos = list(Employee.objects.filter(tenant_id=self.tenant_id).exclude(position__isnull=True).exclude(position=''))
            for emp in employees_pos:
                pos = emp.position
                employees_by_position[pos] = employees_by_position.get(pos, 0) + 1
            
            # Employees by employment type
            employees_by_employment_type = {}
            employees_type = list(Employee.objects.filter(tenant_id=self.tenant_id).exclude(employment_type__isnull=True).exclude(employment_type=''))
            for emp in employees_type:
                emp_type = emp.employment_type
                employees_by_employment_type[emp_type] = employees_by_employment_type.get(emp_type, 0) + 1
            
            # Average tenure
            employees_with_start_date = list(Employee.objects.filter(
                tenant_id=self.tenant_id,
                start_date__isnull=False
            ))
            if employees_with_start_date:
                total_months = 0
                for emp in employees_with_start_date:
                    if emp.end_date:
                        tenure_months = (emp.end_date - emp.start_date).days // 30
                    else:
                        tenure_months = (date.today() - emp.start_date).days // 30
                    total_months += tenure_months
                average_tenure_months = total_months // len(employees_with_start_date)
            else:
                average_tenure_months = 0
            
            # Employees on leave
            employees_on_leave = Employee.objects.filter(tenant_id=self.tenant_id, is_on_leave=True).count()
            
            # Recent hires (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_hires = Employee.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=thirty_days_ago
            ).count()
            
            # Upcoming anniversaries (next 30 days)
            today = date.today()
            next_month = today + timedelta(days=30)
            upcoming_anniversaries = Employee.objects.filter(
                tenant_id=self.tenant_id,
                start_date__month=today.month,
                start_date__day__gte=today.day,
                start_date__day__lte=next_month.day
            ).count()
            
            return {
                'total_employees': total_employees,
                'active_employees': active_employees,
                'employees_on_leave': employees_on_leave,
                'employees_by_department': employees_by_department,
                'employees_by_position': employees_by_position,
                'employees_by_employment_type': employees_by_employment_type,
                'average_salary': None,  # Placeholder
                'total_monthly_payroll': None  # Placeholder
            }
        
        stats = await sync_to_async(_get_employee_stats)()
        return EmployeeStats(**stats)
    
    async def get_employee_compensation(self, employee_id: str) -> Optional[EmployeeCompensationResponse]:
        """Mitarbeiter-Vergütung abrufen"""
        
        def _get_compensation():
            try:
                compensation = EmployeeCompensation.objects.select_related('employee').get(
                    employee_id=employee_id,
                    employee__tenant_id=self.tenant_id
                )
                return compensation
            except EmployeeCompensation.DoesNotExist:
                return None
        
        compensation = await sync_to_async(_get_compensation)()
        
        if not compensation:
            return None
        
        return EmployeeCompensationResponse(
            id=str(compensation.id),
            employee_id=str(compensation.employee.id),
            employee_name=f"{compensation.employee.user.first_name} {compensation.employee.user.last_name}".strip(),
            base_salary=compensation.base_salary,
            currency=compensation.currency,
            bonuses=compensation.bonuses,
            commission=compensation.commission,
            car_allowance=compensation.car_allowance,
            phone_allowance=compensation.phone_allowance,
            other_allowances=compensation.other_allowances,
            health_insurance=compensation.health_insurance,
            pension_insurance=compensation.pension_insurance,
            unemployment_insurance=compensation.unemployment_insurance,
            income_tax=compensation.income_tax,
            social_security_employee=compensation.social_security_employee,
            other_deductions=compensation.other_deductions,
            gross_amount=compensation.gross_amount,
            total_deductions=compensation.total_deductions,
            net_amount=compensation.net_amount,
            effective_date=compensation.effective_date,
            created_at=compensation.created_at,
            updated_at=compensation.updated_at
        )