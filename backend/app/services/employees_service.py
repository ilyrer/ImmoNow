"""
Employees Service
"""
from typing import Optional, List, Tuple
from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q

from app.db.models import UserProfile
from app.schemas.tasks import EmployeeResponse
from app.core.errors import NotFoundError


class EmployeesService:
    """Employees service for business logic"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_employees(
        self,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        department: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Tuple[List[EmployeeResponse], int]:
        """Get employees with filters and pagination"""
        
        queryset = UserProfile.objects.filter(tenant_id=self.tenant_id)
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        if role:
            queryset = queryset.filter(role=role)
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        
        total = queryset.count()
        employees = list(queryset[offset:offset + limit])
        
        return [self._build_employee_response(emp) for emp in employees], total
    
    async def get_employee(self, employee_id: str) -> Optional[EmployeeResponse]:
        """Get a specific employee"""
        
        try:
            employee = UserProfile.objects.get(
                user_id=employee_id, 
                tenant_id=self.tenant_id
            )
            return self._build_employee_response(employee)
        except UserProfile.DoesNotExist:
            return None
    
    def _build_employee_response(self, employee: UserProfile) -> EmployeeResponse:
        """Build EmployeeResponse from UserProfile model"""
        
        return EmployeeResponse(
            id=str(employee.user.id),
            name=f"{employee.user.first_name} {employee.user.last_name}",
            email=employee.user.email,
            avatar=employee.avatar or '',
            role=employee.role,
            department=None,  # TODO: Add department field
            is_active=employee.is_active
        )
