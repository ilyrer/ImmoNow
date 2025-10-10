"""
Employees API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query

from app.api.deps import require_read_scope, get_tenant_id
from app.core.security import TokenData
from app.schemas.tasks import EmployeeResponse
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset
from app.services.employees_service import EmployeesService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[EmployeeResponse])
async def get_employees(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search term"),
    role: Optional[str] = Query(None, description="Role filter"),
    department: Optional[str] = Query(None, description="Department filter"),
    is_active: Optional[bool] = Query(None, description="Active status filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get paginated list of employees"""
    
    # Calculate pagination offset
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    # Get employees from service
    employees_service = EmployeesService(tenant_id)
    employees, total = await employees_service.get_employees(
        offset=offset,
        limit=pagination.size,
        search=search,
        role=role,
        department=department,
        is_active=is_active
    )
    
    return PaginatedResponse.create(
        items=employees,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific employee"""
    
    employees_service = EmployeesService(tenant_id)
    employee = await employees_service.get_employee(employee_id)
    
    if not employee:
        from app.core.errors import NotFoundError
        raise NotFoundError("Employee not found")
    
    return employee
