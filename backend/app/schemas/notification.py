"""
Notification Pydantic Schemas
Request und Response Models für Notifications
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, time
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


# Enums
class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    REMINDER = "reminder"


class NotificationCategory(str, Enum):
    SYSTEM = "system"
    PROPERTY = "property"
    CONTACT = "contact"
    TASK = "task"
    APPOINTMENT = "appointment"
    DOCUMENT = "document"
    FINANCIAL = "financial"
    MESSAGE = "message"
    TEAM = "team"
    CIM = "cim"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


# Request Models
class NotificationCreate(BaseModel):
    """Create notification request"""
    user_id: str
    type: NotificationType = NotificationType.INFO
    category: NotificationCategory = NotificationCategory.SYSTEM
    priority: NotificationPriority = NotificationPriority.NORMAL
    title: str = Field(..., max_length=255)
    message: str
    action_url: Optional[str] = Field(None, max_length=500)
    action_label: Optional[str] = Field(None, max_length=100)
    related_entity_type: Optional[str] = Field(None, max_length=50)
    related_entity_id: Optional[str] = Field(None, max_length=100)
    related_entity_title: Optional[str] = Field(None, max_length=255)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    expires_at: Optional[datetime] = None


class NotificationUpdate(BaseModel):
    """Update notification request"""
    read: Optional[bool] = None
    archived: Optional[bool] = None


class NotificationBulkAction(BaseModel):
    """Bulk action request"""
    notification_ids: List[str]
    action: str = Field(..., pattern="^(mark_read|mark_unread|archive|delete)$")


class NotificationMarkAsRead(BaseModel):
    """Mark notification as read"""
    notification_ids: List[str]


# Response Models
class NotificationResponse(BaseModel):
    """Notification response model"""
    id: str
    type: NotificationType
    category: NotificationCategory
    priority: NotificationPriority
    title: str
    message: str
    read: bool
    read_at: Optional[datetime] = None
    archived: bool
    archived_at: Optional[datetime] = None
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    related_entity_title: Optional[str] = None
    metadata: Dict[str, Any]
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class NotificationStats(BaseModel):
    """Notification statistics"""
    total: int
    unread: int
    by_category: Dict[str, int]
    by_priority: Dict[str, int]
    by_type: Dict[str, int]


class NotificationListResponse(BaseModel):
    """Paginated notification list"""
    items: List[NotificationResponse]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool
    stats: Optional[NotificationStats] = None


# Notification Preference Models
class NotificationPreferenceUpdate(BaseModel):
    """Update notification preference"""
    category: NotificationCategory
    enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    min_priority: Optional[NotificationPriority] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None


class NotificationPreferenceResponse(BaseModel):
    """Notification preference response"""
    id: str
    category: NotificationCategory
    enabled: bool
    email_enabled: bool
    push_enabled: bool
    in_app_enabled: bool
    min_priority: NotificationPriority
    quiet_hours_enabled: bool
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NotificationPreferencesBulk(BaseModel):
    """Bulk update notification preferences"""
    preferences: List[NotificationPreferenceUpdate]


# Filter Models
class NotificationFilter(BaseModel):
    """Notification filter options"""
    read: Optional[bool] = None
    archived: Optional[bool] = None
    category: Optional[NotificationCategory] = None
    priority: Optional[NotificationPriority] = None
    type: Optional[NotificationType] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
