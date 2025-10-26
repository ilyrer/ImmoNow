"""
Task Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import (
    TaskPriority, TaskStatus, UserResponse, PropertyResponse,
    PaginatedResponse, PageResponse
)


class TaskAssignee(BaseModel):
    """Task assignee model"""
    id: str
    name: str
    avatar: str
    role: Optional[str] = None
    email: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class TaskLabel(BaseModel):
    """Task label model"""
    id: str
    name: str
    color: str
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class Subtask(BaseModel):
    """Subtask model"""
    id: str
    title: str
    completed: bool
    order: int
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class TaskComment(BaseModel):
    """Task comment model"""
    id: str
    author: TaskAssignee
    text: str
    timestamp: datetime
    parent_id: Optional[str] = None
    is_edited: bool = False
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class CreateTaskCommentRequest(BaseModel):
    """Request model for creating task comment"""
    text: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[str] = None


class UpdateTaskCommentRequest(BaseModel):
    """Request model for updating task comment"""
    text: str = Field(..., min_length=1, max_length=2000)


class ActivityLogEntry(BaseModel):
    """Activity log entry model"""
    id: str
    action: str
    description: str
    user: TaskAssignee
    timestamp: datetime
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class BulkUpdateTasksRequest(BaseModel):
    """Request model for bulk updating tasks"""
    task_ids: List[str] = Field(..., min_items=1, max_items=50)
    updates: Dict[str, Any] = Field(..., min_items=1)


class BulkMoveTasksRequest(BaseModel):
    """Request model for bulk moving tasks"""
    task_ids: List[str] = Field(..., min_items=1, max_items=50)
    new_status: str
    position: Optional[int] = None
    parent_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class TaskDocument(BaseModel):
    """Task document model"""
    id: str
    name: str
    url: str
    size: int
    mime_type: str
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class PropertyInfo(BaseModel):
    """Property info model"""
    id: str
    title: str
    address: str
    price: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class FinancingStatus(BaseModel):
    """Financing status model"""
    status: str
    amount: Optional[float] = None
    interest_rate: Optional[float] = None
    term: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class ActivityLogEntry(BaseModel):
    """Activity log entry model"""
    id: str
    action: str
    user: TaskAssignee
    timestamp: datetime
    description: str
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class BlockedInfo(BaseModel):
    """Blocked info model"""
    reason: str
    blocked_by: Optional[str] = None
    blocked_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class TaskResponse(BaseModel):
    """Task response model"""
    id: str
    title: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    assignee: Optional[TaskAssignee] = None
    due_date: datetime
    start_date: Optional[datetime] = None
    progress: int = Field(0, ge=0, le=100)
    estimated_hours: int
    actual_hours: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    labels: List[TaskLabel] = Field(default_factory=list)
    subtasks: List[Subtask] = Field(default_factory=list)
    comments: List[TaskComment] = Field(default_factory=list)
    attachments: List[TaskDocument] = Field(default_factory=list)
    property: Optional[PropertyInfo] = None
    financing_status: Optional[FinancingStatus] = None
    activity_log: List[ActivityLogEntry] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    created_by: TaskAssignee
    archived: bool = False
    blocked: Optional[BlockedInfo] = None
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class CreateTaskRequest(BaseModel):
    """Create task request model"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=2000)
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus
    assignee_id: Optional[str] = None
    due_date: datetime
    start_date: Optional[datetime] = None
    estimated_hours: int = Field(1, ge=1, le=1000)
    tags: List[str] = Field(default_factory=list)
    property_id: Optional[str] = None
    financing_status: Optional[FinancingStatus] = None
    # New Kanban fields
    label_ids: List[str] = Field(default_factory=list)
    watcher_ids: List[str] = Field(default_factory=list)
    story_points: Optional[int] = Field(None, ge=0, le=100)
    sprint_id: Optional[str] = None
    issue_type: str = 'task'
    epic_link: Optional[str] = None


class UpdateTaskRequest(BaseModel):
    """Update task request model"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    estimated_hours: Optional[int] = Field(None, ge=1, le=1000)
    actual_hours: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    property_id: Optional[str] = None
    financing_status: Optional[FinancingStatus] = None
    archived: Optional[bool] = None
    # New Kanban fields
    label_ids: Optional[List[str]] = None
    watcher_ids: Optional[List[str]] = None
    story_points: Optional[int] = Field(None, ge=0, le=100)
    sprint_id: Optional[str] = None
    issue_type: Optional[str] = None
    epic_link: Optional[str] = None
    blocked_reason: Optional[str] = None
    position: Optional[int] = Field(None, ge=0)
    blocked_by_task_id: Optional[str] = None


class MoveTaskRequest(BaseModel):
    """Move task request model"""
    column_id: Optional[int] = None
    position: Optional[int] = None
    new_status: Optional[TaskStatus] = None


class EmployeeResponse(BaseModel):
    """Employee response model"""
    id: str
    name: str
    email: str
    avatar: str
    role: str
    department: Optional[str] = None
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class TaskStatisticsResponse(BaseModel):
    """Task statistics response model"""
    total_tasks: int
    active_tasks: int
    completed_tasks: int
    blocked_tasks: int
    overdue_tasks: int
    total_estimated_hours: int
    total_actual_hours: int
    completion_rate: float
    tasks_by_priority: Dict[TaskPriority, int] = Field(default_factory=dict)
    tasks_by_status: Dict[TaskStatus, int] = Field(default_factory=dict)
    tasks_by_assignee: Dict[str, int] = Field(default_factory=dict)
    upcoming_deadlines: List[TaskResponse] = Field(default_factory=list)
    recent_activity: List[ActivityLogEntry] = Field(default_factory=list)


# New Kanban schemas
class CreateSubtaskRequest(BaseModel):
    """Create subtask request model"""
    title: str = Field(..., min_length=1, max_length=200)
    assignee_id: Optional[str] = None


class UpdateSubtaskRequest(BaseModel):
    """Update subtask request model"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    completed: Optional[bool] = None
    assignee_id: Optional[str] = None


class CreateLabelRequest(BaseModel):
    """Create label request model"""
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    description: str = ""


class UpdateLabelRequest(BaseModel):
    """Update label request model"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    description: Optional[str] = None


class UploadAttachmentRequest(BaseModel):
    """Upload attachment request model"""
    name: str
    file_url: str
    file_size: int
    mime_type: str


class CreateSprintRequest(BaseModel):
    """Create sprint request model"""
    name: str = Field(..., min_length=1, max_length=100)
    goal: str = ""
    start_date: datetime
    end_date: datetime


class UpdateSprintRequest(BaseModel):
    """Update sprint request model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None


class BoardConfigRequest(BaseModel):
    """Board configuration request model"""
    wip_limits: Dict[str, int] = Field(default_factory=dict)
    swimlane_type: str = 'none'  # none, assignee, priority, epic
    columns: List[Dict[str, Any]] = Field(default_factory=list)


# Response models for Kanban features
class TaskLabel(BaseModel):
    """Task label response model"""
    id: str
    name: str
    color: str
    description: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class TaskSubtask(BaseModel):
    """Task subtask response model"""
    id: str
    title: str
    completed: bool
    order: int
    assignee_id: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class TaskAttachment(BaseModel):
    """Task attachment response model"""
    id: str
    name: str
    file_url: str
    file_size: int
    mime_type: str
    uploaded_by_id: str
    uploaded_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class Sprint(BaseModel):
    """Sprint response model"""
    id: str
    name: str
    goal: str
    start_date: datetime
    end_date: datetime
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class SprintResponse(BaseModel):
    """Sprint response model"""
    id: str
    name: str
    goal: str
    start_date: datetime
    end_date: datetime
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class CreateTaskCommentRequest(BaseModel):
    """Create task comment request"""
    text: str
    parent_id: Optional[str] = None


class UpdateTaskCommentRequest(BaseModel):
    """Update task comment request"""
    text: str


class ActivityLogEntry(BaseModel):
    """Activity log entry"""
    id: str
    user: str
    action: str
    timestamp: datetime
    details: str
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })


class TaskDocument(BaseModel):
    """Task document/attachment"""
    id: str
    name: str
    file_url: str
    file_size: int
    mime_type: str
    uploaded_by: TaskAssignee
    uploaded_at: datetime
    
    model_config = ConfigDict(from_attributes=True, json_encoders={
        datetime: lambda v: v.isoformat() if v else None
    })
