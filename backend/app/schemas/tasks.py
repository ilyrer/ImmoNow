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
    
    model_config = ConfigDict(from_attributes=True)


class TaskLabel(BaseModel):
    """Task label model"""
    id: str
    name: str
    color: str
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class Subtask(BaseModel):
    """Subtask model"""
    id: str
    title: str
    completed: bool
    order: int
    
    model_config = ConfigDict(from_attributes=True)


class TaskComment(BaseModel):
    """Task comment model"""
    id: str
    author: TaskAssignee
    text: str
    timestamp: datetime
    parent_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class TaskDocument(BaseModel):
    """Task document model"""
    id: str
    name: str
    url: str
    size: int
    mime_type: str
    
    model_config = ConfigDict(from_attributes=True)


class PropertyInfo(BaseModel):
    """Property info model"""
    id: str
    title: str
    address: str
    price: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class FinancingStatus(BaseModel):
    """Financing status model"""
    status: str
    amount: Optional[float] = None
    interest_rate: Optional[float] = None
    term: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class ActivityLogEntry(BaseModel):
    """Activity log entry model"""
    id: str
    action: str
    user: TaskAssignee
    timestamp: datetime
    description: str
    
    model_config = ConfigDict(from_attributes=True)


class BlockedInfo(BaseModel):
    """Blocked info model"""
    reason: str
    blocked_by: Optional[str] = None
    blocked_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ProjectSummary(BaseModel):
    """Projekt/Team Kurzinfo"""
    id: str
    name: str
    color: str

    model_config = ConfigDict(from_attributes=True)


class BoardStatus(BaseModel):
    """Konfigurierter Board-Status"""
    id: str
    key: str
    title: str
    color: str
    order: int
    wip_limit: Optional[int] = None
    is_terminal: bool = False
    allow_from: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class BoardResponse(BaseModel):
    """Board mit Status-Konfiguration"""
    id: str
    name: str
    description: Optional[str] = None
    team: Optional[str] = None
    project_id: Optional[str] = None
    wip_limit: Optional[int] = None
    statuses: List[BoardStatus] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(BaseModel):
    """Task response model"""
    id: str
    project_id: Optional[str] = None
    board_id: Optional[str] = None
    title: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    assignee: TaskAssignee
    due_date: datetime
    start_date: Optional[datetime] = None
    progress: int = Field(0, ge=0, le=100)
    estimated_hours: int
    actual_hours: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    labels: List[TaskLabel] = Field(default_factory=list)
    story_points: Optional[int] = None
    ai_score: Optional[float] = None
    impact_score: Optional[float] = None
    effort_score: Optional[float] = None
    complexity: Optional[str] = None
    dependencies: List[str] = Field(default_factory=list)
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
    
    model_config = ConfigDict(from_attributes=True)


class CreateTaskRequest(BaseModel):
    """Create task request model"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=2000)
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    project_id: Optional[str] = None
    board_id: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: datetime
    start_date: Optional[datetime] = None
    estimated_hours: int = Field(1, ge=1, le=1000)
    tags: List[str] = Field(default_factory=list)
    label_ids: List[str] = Field(default_factory=list)
    story_points: Optional[int] = Field(None, ge=0, le=200)
    impact_score: Optional[float] = None
    effort_score: Optional[float] = None
    complexity: Optional[str] = None
    property_id: Optional[str] = None
    financing_status: Optional[FinancingStatus] = None
    dependencies: List[str] = Field(default_factory=list)
    subtasks: List[Subtask] = Field(default_factory=list)


class UpdateTaskRequest(BaseModel):
    """Update task request model"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    project_id: Optional[str] = None
    board_id: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    estimated_hours: Optional[int] = Field(None, ge=1, le=1000)
    actual_hours: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    label_ids: Optional[List[str]] = None
    story_points: Optional[int] = Field(None, ge=0, le=200)
    impact_score: Optional[float] = None
    effort_score: Optional[float] = None
    complexity: Optional[str] = None
    property_id: Optional[str] = None
    financing_status: Optional[FinancingStatus] = None
    archived: Optional[bool] = None
    dependencies: Optional[List[str]] = None
    subtasks: Optional[List[Subtask]] = None


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
    
    model_config = ConfigDict(from_attributes=True)


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


class AiGeneratedTask(BaseModel):
    """KI-generierter Task-Vorschlag"""
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime
    labels: List[str] = Field(default_factory=list)
    suggested_tags: List[str] = Field(default_factory=list)
    suggested_story_points: Optional[int] = None


class AiPrioritySuggestion(BaseModel):
    """KI-Priorisierung/Score"""
    task_id: str
    score: float
    rationale: str
    suggested_priority: TaskPriority


class AiAssigneeSuggestion(BaseModel):
    """KI-Assignee-Empfehlung"""
    task_id: str
    assignee_id: str
    reason: str


class BoardSummaryResponse(BaseModel):
    """KI-Zusammenfassung eines Boards"""
    board_id: str
    summary: str
    highlights: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    blockers: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
