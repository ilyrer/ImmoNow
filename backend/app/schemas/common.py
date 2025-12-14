"""
Common Pydantic Schemas
"""

from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

from app.core.pagination import PaginatedResponse, PageResponse


class ErrorResponse(BaseModel):
    """Standard error response envelope"""

    detail: Union[str, List[Dict[str, Any]]]
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Enums
class DocumentType(str, Enum):
    CONTRACT = "contract"
    EXPOSE = "expose"
    ENERGY_CERTIFICATE = "energy_certificate"
    FLOOR_PLAN = "floor_plan"
    PHOTO = "photo"
    VIDEO = "video"
    DOCUMENT = "document"
    PRESENTATION = "presentation"
    SPREADSHEET = "spreadsheet"
    PDF = "pdf"
    OTHER = "other"


class DocumentCategory(str, Enum):
    LEGAL = "legal"
    MARKETING = "marketing"
    TECHNICAL = "technical"
    FINANCIAL = "financial"
    ADMINISTRATIVE = "administrative"
    OTHER = "other"


class DocumentStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class DocumentVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    RESTRICTED = "restricted"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    BACKLOG = "backlog"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"


class PropertyType(str, Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    COMMERCIAL = "commercial"
    LAND = "land"
    OFFICE = "office"
    RETAIL = "retail"
    INDUSTRIAL = "industrial"


class AppointmentType(str, Enum):
    VIEWING = "viewing"
    CALL = "call"
    MEETING = "meeting"
    CONSULTATION = "consultation"
    SIGNING = "signing"
    INSPECTION = "inspection"


class AppointmentStatus(str, Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class UserRole(str, Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"
    CUSTOMER = "customer"


# Common Response Models
class UserResponse(BaseModel):
    """User response model"""

    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    avatar: Optional[str] = None
    is_active: bool
    tenant_id: str
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ContactResponse(BaseModel):
    """Contact response model"""

    id: str
    name: str
    email: str
    phone: str
    company: Optional[str] = None
    category: Optional[str] = None
    status: str
    priority: Optional[str] = None
    location: Optional[str] = None
    avatar: Optional[str] = None

    # Main budget field (potential_value)
    budget: Optional[float] = None
    budget_currency: str

    # Legacy fields for backward compatibility
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None

    preferences: Dict[str, Any]
    additional_info: Dict[str, Any] = {}
    address: Dict[str, Any] = {}
    notes: Optional[str] = None
    lead_score: int
    last_contact: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PropertyResponse(BaseModel):
    """Property response model"""

    id: str
    title: str
    description: str
    status: str
    property_type: PropertyType
    price: Optional[float] = None
    location: str
    living_area: Optional[int] = None
    rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    year_built: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by: str

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    """Notification response model"""

    id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime
    action_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TagResponse(BaseModel):
    """Tag response model"""

    id: str
    name: str
    color: str
    usage_count: int

    model_config = ConfigDict(from_attributes=True)


class CommentResponse(BaseModel):
    """Comment response model"""

    id: str
    author: UserResponse
    text: str
    timestamp: datetime
    parent_id: Optional[str] = None
    mentions: List[str] = Field(default_factory=list)
    reactions: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    """Audit log response model"""

    id: str
    timestamp: datetime
    user: UserResponse
    action: str
    resource_type: str
    resource_id: str
    old_values: Dict[str, Any]
    new_values: Dict[str, Any]
    description: str

    model_config = ConfigDict(from_attributes=True)
