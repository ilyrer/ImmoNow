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
    EmployeeResponse, TaskStatisticsResponse, TaskComment as TaskCommentSchema,
    CreateTaskCommentRequest, UpdateTaskCommentRequest, ActivityLogEntry,
    BulkUpdateTasksRequest, BulkMoveTasksRequest,
    # New Kanban schemas
    CreateSubtaskRequest, UpdateSubtaskRequest, CreateLabelRequest, UpdateLabelRequest,
    UploadAttachmentRequest, CreateSprintRequest, UpdateSprintRequest, SprintResponse,
    BoardConfigRequest, TaskLabel, TaskSubtask, TaskAttachment, Sprint
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
    
    try:
        print(f"DEBUG: API create_task called with tenant_id={tenant_id}")
        print(f"DEBUG: task_data: {task_data}")
        print(f"DEBUG: current_user.user_id: {current_user.user_id}")
        
        tasks_service = TasksService(tenant_id)
        task = await tasks_service.create_task(task_data, current_user.user_id)
        
        print(f"DEBUG: Task created successfully: {task.id}")
        return task
    except Exception as e:
        print(f"ERROR in create_task API: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise e


# ============================================================================
# SPECIFIC ROUTES (MUST BE BEFORE /{task_id})
# ============================================================================

@router.get("/statistics", response_model=TaskStatisticsResponse)
async def get_task_statistics(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get task statistics"""
    
    tasks_service = TasksService(tenant_id)
    statistics = await tasks_service.get_statistics()
    
    return statistics


@router.put("/sprints/{sprint_id}", response_model=SprintResponse)
async def update_sprint(
    sprint_id: str,
    sprint_data: UpdateSprintRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a sprint"""
    tasks_service = TasksService(tenant_id)
    return await tasks_service.update_sprint(sprint_id, sprint_data)


@router.post("/sprints/{sprint_id}/start", response_model=SprintResponse)
async def start_sprint(
    sprint_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Start a sprint by changing its status to active"""
    tasks_service = TasksService(tenant_id)
    sprint_data = UpdateSprintRequest(status='active')
    return await tasks_service.update_sprint(sprint_id, sprint_data)


@router.delete("/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sprint(
    sprint_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a sprint"""
    tasks_service = TasksService(tenant_id)
    await tasks_service.delete_sprint(sprint_id)


# ============================================================================
# LABEL ENDPOINTS  
# ============================================================================
async def create_label(
    label_data: CreateLabelRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new task label"""
    tasks_service = TasksService(tenant_id)
    return await tasks_service.create_label(label_data)


@router.get("/labels", response_model=List[TaskLabel])
async def get_labels(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all task labels"""
    tasks_service = TasksService(tenant_id)
    return await tasks_service.get_labels()


# Sprints endpoints
@router.post("/sprints", response_model=SprintResponse)
async def create_sprint(
    sprint_data: CreateSprintRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new sprint"""
    tasks_service = TasksService(tenant_id)
    return await tasks_service.create_sprint(sprint_data)


@router.get("/sprints", response_model=List[SprintResponse])
async def get_sprints(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all sprints"""
    try:
        print(f"DEBUG: API get_sprints called with tenant_id={tenant_id}")
        
        tasks_service = TasksService(tenant_id)
        result = await tasks_service.get_sprints(None)  # Kein status Parameter
        print(f"DEBUG: API get_sprints result: {result}")
        return result
    except Exception as e:
        print(f"ERROR in API get_sprints: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ============================================================================
# TASK-SPECIFIC ROUTES (WITH {task_id})
# ============================================================================

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
    
    try:
        print(f"DEBUG: Update task {task_id} with data: {task_data.model_dump(exclude_unset=True)}")
        print(f"DEBUG: current_user: {current_user.user_id}, tenant_id: {tenant_id}")
        
        tasks_service = TasksService(tenant_id)
        task = await tasks_service.update_task(task_id, task_data, current_user.user_id)
        
        if not task:
            raise NotFoundError("Task not found")
        
        print(f"DEBUG: Task updated successfully: {task.id}")
        return task
    except Exception as e:
        print(f"ERROR in update_task API: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise e


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


# ============================================================================
# TASK COMMENTS ENDPOINTS
# ============================================================================

@router.post("/{task_id}/comments", response_model=TaskCommentSchema, status_code=status.HTTP_201_CREATED)
async def add_task_comment(
    task_id: str,
    comment_data: CreateTaskCommentRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Add a comment to a task"""
    
    tasks_service = TasksService(tenant_id)
    comment = await tasks_service.add_task_comment(task_id, comment_data, current_user.user_id)
    
    if not comment:
        raise NotFoundError("Task not found")
    
    return comment


@router.get("/{task_id}/comments", response_model=List[TaskCommentSchema])
async def get_task_comments(
    task_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all comments for a task"""
    
    tasks_service = TasksService(tenant_id)
    comments = await tasks_service.get_task_comments(task_id)
    
    if comments is None:
        raise NotFoundError("Task not found")
    
    return comments


@router.put("/{task_id}/comments/{comment_id}", response_model=TaskCommentSchema)
async def update_task_comment(
    task_id: str,
    comment_id: str,
    comment_data: UpdateTaskCommentRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a task comment"""
    
    tasks_service = TasksService(tenant_id)
    comment = await tasks_service.update_task_comment(
        task_id, comment_id, comment_data, current_user.user_id
    )
    
    if not comment:
        raise NotFoundError("Comment not found")
    
    return comment


@router.delete("/{task_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_comment(
    task_id: str,
    comment_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a task comment"""
    
    tasks_service = TasksService(tenant_id)
    success = await tasks_service.delete_task_comment(
        task_id, comment_id, current_user.user_id
    )
    
    if not success:
        raise NotFoundError("Comment not found")


# ============================================================================
# TASK ACTIVITY LOG ENDPOINTS
# ============================================================================

@router.get("/{task_id}/activity", response_model=List[ActivityLogEntry])
async def get_task_activity(
    task_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get activity log for a task"""
    
    tasks_service = TasksService(tenant_id)
    activity_log = await tasks_service.get_task_activity(task_id)
    
    if activity_log is None:
        raise NotFoundError("Task not found")
    
    return activity_log


# ============================================================================
# BULK OPERATIONS ENDPOINTS
# ============================================================================

@router.patch("/bulk", response_model=List[TaskResponse])
async def bulk_update_tasks(
    bulk_data: BulkUpdateTasksRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Bulk update multiple tasks"""
    
    tasks_service = TasksService(tenant_id)
    updated_tasks = await tasks_service.bulk_update_tasks(
        bulk_data, current_user.user_id
    )
    
    return updated_tasks


@router.delete("/bulk", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_tasks(
    task_ids: List[str],
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Bulk delete multiple tasks"""
    
    tasks_service = TasksService(tenant_id)
    await tasks_service.bulk_delete_tasks(task_ids, current_user.user_id)


@router.patch("/bulk/move", response_model=List[TaskResponse])
async def bulk_move_tasks(
    bulk_move_data: BulkMoveTasksRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Bulk move multiple tasks to different status"""
    
    tasks_service = TasksService(tenant_id)
    moved_tasks = await tasks_service.bulk_move_tasks(
        bulk_move_data, current_user.user_id
    )
    
    return moved_tasks


# ============================================================================
# SUBTASK ENDPOINTS
# ============================================================================

# Subtasks endpoints
@router.post("/{task_id}/subtasks", response_model=TaskSubtask)
async def create_subtask(
    task_id: str,
    subtask_data: CreateSubtaskRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a subtask"""
    tasks_service = TasksService(tenant_id)
    return await tasks_service.create_subtask(task_id, subtask_data)


@router.put("/subtasks/{subtask_id}", response_model=TaskSubtask)
async def update_subtask(
    subtask_id: str,
    subtask_data: UpdateSubtaskRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a subtask"""
    tasks_service = TasksService(tenant_id)
    return await tasks_service.update_subtask(subtask_id, subtask_data)


@router.delete("/subtasks/{subtask_id}")
async def delete_subtask(
    subtask_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a subtask"""
    tasks_service = TasksService(tenant_id)
    await tasks_service.delete_subtask(subtask_id)
    return {"message": "Subtask deleted successfully"}


# ============================================================================
# ATTACHMENT ENDPOINTS
# ============================================================================

# Attachments endpoints
@router.post("/{task_id}/attachments", response_model=TaskAttachment)
async def upload_attachment(
    task_id: str,
    attachment_data: UploadAttachmentRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Upload an attachment"""
    tasks_service = TasksService(tenant_id)
    return await tasks_service.add_attachment(task_id, attachment_data, current_user.user_id)


@router.delete("/attachments/{attachment_id}")
async def delete_attachment(
    attachment_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete an attachment"""
    tasks_service = TasksService(tenant_id)
    await tasks_service.delete_attachment(attachment_id)
    return {"message": "Attachment deleted successfully"}


# ============================================================================
# WATCHER ENDPOINTS
# ============================================================================

# Watchers endpoints
@router.post("/{task_id}/watchers/{user_id}")
async def add_watcher(
    task_id: str,
    user_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Add a watcher to a task"""
    tasks_service = TasksService(tenant_id)
    await tasks_service.add_watcher(task_id, user_id)
    return {"message": "Watcher added successfully"}


@router.delete("/{task_id}/watchers/{user_id}")
async def remove_watcher(
    task_id: str,
    user_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Remove a watcher from a task"""
    tasks_service = TasksService(tenant_id)
    await tasks_service.remove_watcher(task_id, user_id)
    return {"message": "Watcher removed successfully"}


# ============================================================================
# SPRINT ENDPOINTS - REMOVED DUPLICATES
# ============================================================================
# Note: Sprint endpoints are already defined above before /{task_id} routes