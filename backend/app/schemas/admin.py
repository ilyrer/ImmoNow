"""
Admin Schemas for RBAC and Feature Flags
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


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
    roles: List[RoleResponse]
    tenant_name: str
    last_login: Optional[datetime] = None
    created_at: datetime
    
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
