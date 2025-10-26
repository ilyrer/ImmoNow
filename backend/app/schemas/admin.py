"""
Admin Schemas for RBAC and Feature Flags
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from enum import Enum


class UserStatus(str, Enum):
    """User status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    INVITED = "invited"
    PENDING = "pending"


class BulkAction(str, Enum):
    """Bulk actions"""
    ACTIVATE = "activate"
    DEACTIVATE = "deactivate"
    DELETE = "delete"
    RESEND_INVITATION = "resend_invitation"


class PermissionResponse(BaseModel):
    """Permission response model"""
    id: int
    name: str
    description: str
    category: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class RoleResponse(BaseModel):
    """Role response model"""
    id: int
    name: str
    description: str
    permissions: List[PermissionResponse]
    is_system: bool
    created_at: datetime
    created_by: str
    
    model_config = ConfigDict(from_attributes=True)


class CreateRoleRequest(BaseModel):
    """Create role request"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    permission_ids: List[int] = Field(default_factory=list)


class UpdateRoleRequest(BaseModel):
    """Update role request"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    permission_ids: Optional[List[int]] = None


class AssignRoleRequest(BaseModel):
    """Assign role to user request"""
    role_ids: List[int] = Field(..., min_items=1)


class FeatureFlagResponse(BaseModel):
    """Feature flag response model"""
    id: int
    name: str
    description: str
    is_enabled: bool
    rollout_percentage: int
    created_at: datetime
    created_by: str
    
    model_config = ConfigDict(from_attributes=True)


class CreateFeatureFlagRequest(BaseModel):
    """Create feature flag request"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    is_enabled: bool = Field(default=False)
    rollout_percentage: int = Field(default=0, ge=0, le=100)


class UpdateFeatureFlagRequest(BaseModel):
    """Update feature flag request"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    is_enabled: Optional[bool] = None
    rollout_percentage: Optional[int] = Field(None, ge=0, le=100)


class UserResponse(BaseModel):
    """User response model for admin"""
    id: str
    email: str
    first_name: str
    last_name: str
    is_active: bool
    status: UserStatus
    roles: List[RoleResponse]
    tenant_name: str
    last_login: Optional[datetime] = None
    created_at: datetime
    employee_number: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    model_config = ConfigDict(from_attributes=True)


class UpdateUserRolesRequest(BaseModel):
    """Update user roles request"""
    role_ids: List[int] = Field(default_factory=list)


class TenantResponse(BaseModel):
    """Tenant response model for admin"""
    id: str
    name: str
    domain: str
    is_active: bool
    user_count: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    """Audit log response model"""
    id: str
    user_id: str
    user_name: str
    action: str
    resource_type: str
    resource_id: str
    description: Optional[str] = None
    ip_address: str
    user_agent: str
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SystemStatsResponse(BaseModel):
    """System statistics response"""
    total_users: int
    total_tenants: int
    active_users: int
    total_properties: int
    total_contacts: int
    total_documents: int
    total_tasks: int
    system_health: Dict[str, Any]
    recent_activity: List[AuditLogResponse]


# User Management Schemas
class InviteUserRequest(BaseModel):
    """Request for inviting a user"""
    email: EmailStr = Field(..., description="E-Mail-Adresse")
    first_name: str = Field(..., min_length=1, max_length=100, description="Vorname")
    last_name: str = Field(..., min_length=1, max_length=100, description="Nachname")
    role: str = Field(default="agent", description="Rolle")
    department: Optional[str] = Field(None, description="Abteilung")
    position: Optional[str] = Field(None, description="Position")
    message: Optional[str] = Field(None, description="Persönliche Nachricht")
    permissions: Dict[str, Any] = Field(default_factory=dict, description="Spezifische Berechtigungen")


class InviteUserResponse(BaseModel):
    """Response for user invitation"""
    invitation_id: str
    email: str
    token: str
    expires_at: datetime
    invitation_url: str
    message: str


class BulkUserActionRequest(BaseModel):
    """Request for bulk user actions"""
    user_ids: List[str] = Field(..., min_items=1, description="Benutzer-IDs")
    action: BulkAction = Field(..., description="Aktion")
    reason: Optional[str] = Field(None, description="Grund")


class BulkUserActionResponse(BaseModel):
    """Response for bulk user actions"""
    successful: List[str]  # User IDs that were processed successfully
    failed: List[Dict[str, Any]]  # User IDs that failed with error messages
    total_processed: int
    total_failed: int


class UserActivationRequest(BaseModel):
    """Request for user activation/deactivation"""
    user_id: str = Field(..., description="Benutzer-ID")
    is_active: bool = Field(..., description="Aktivieren/Deaktivieren")
    reason: Optional[str] = Field(None, description="Grund")


class UserDeletionRequest(BaseModel):
    """Request for user deletion"""
    user_id: str = Field(..., description="Benutzer-ID")
    reason: Optional[str] = Field(None, description="Grund")
    anonymize_data: bool = Field(default=True, description="Daten anonymisieren")


class ResendInvitationRequest(BaseModel):
    """Request for resending invitation"""
    user_id: str = Field(..., description="Benutzer-ID")
    message: Optional[str] = Field(None, description="Neue Nachricht")


class UserListResponse(BaseModel):
    """Response for user list"""
    users: List[UserResponse]
    total: int
    page: int
    size: int
    pages: int


class UserStats(BaseModel):
    """User statistics"""
    total_users: int
    active_users: int
    inactive_users: int
    invited_users: int
    users_by_role: Dict[str, int]
    users_by_department: Dict[str, int]
    recent_registrations: int  # Last 30 days
    users_without_login: int  # Never logged in
