"""
Tasks API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps import (
    require_read_scope, require_write_scope, require_delete_scope,
    get_tenant_id, apply_rate_limit
)
from app.core.security import TokenData
from app.core.errors import ValidationError, NotFoundError
from app.schemas.tasks import (
    TaskResponse, CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest,
    EmployeeResponse, TaskStatisticsResponse
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset, validate_sort_field
from app.services.tasks_service import TasksService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[TaskResponse])
async def get_tasks(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search term"),
    status: Optional[str] = Query(None, description="Status filter"),
    priority: Optional[str] = Query(None, description="Priority filter"),
    assignee_id: Optional[str] = Query(None, description="Assignee ID filter"),
    property_id: Optional[str] = Query(None, description="Property ID filter"),
    tags: Optional[List[str]] = Query(None, description="Tags filter"),
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get paginated list of tasks with filters"""
    
    # Validate sort field
    allowed_sort_fields = ["created_at", "title", "due_date", "priority", "status"]
    sort_by = validate_sort_field(allowed_sort_fields, sort_by)
    
    # Calculate pagination offset
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    # Get tasks from service
    tasks_service = TasksService(tenant_id)
    tasks, total = await tasks_service.get_tasks(
        offset=offset,
        limit=pagination.size,
        search=search,
        status=status,
        priority=priority,
        assignee_id=assignee_id,
        property_id=property_id,
        tags=tags,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return PaginatedResponse.create(
        items=tasks,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: CreateTaskRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new task"""
    
    tasks_service = TasksService(tenant_id)
    task = await tasks_service.create_task(task_data, current_user.user_id)
    
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific task"""
    
    tasks_service = TasksService(tenant_id)
    task = await tasks_service.get_task(task_id)
    
    if not task:
        raise NotFoundError("Task not found")
    
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: UpdateTaskRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a task"""
    
    tasks_service = TasksService(tenant_id)
    task = await tasks_service.update_task(task_id, task_data, current_user.user_id)
    
    if not task:
        raise NotFoundError("Task not found")
    
    return task


@router.patch("/{task_id}/move", response_model=TaskResponse)
async def move_task(
    task_id: str,
    move_data: MoveTaskRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Move a task to different column/status"""
    
    tasks_service = TasksService(tenant_id)
    task = await tasks_service.move_task(task_id, move_data, current_user.user_id)
    
    if not task:
        raise NotFoundError("Task not found")
    
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a task"""
    
    tasks_service = TasksService(tenant_id)
    await tasks_service.delete_task(task_id, current_user.user_id)


@router.get("/statistics", response_model=TaskStatisticsResponse)
async def get_task_statistics(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get task statistics"""
    
    tasks_service = TasksService(tenant_id)
    statistics = await tasks_service.get_statistics()
    
    return statistics
