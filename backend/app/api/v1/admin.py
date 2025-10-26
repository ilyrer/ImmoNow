"""
Admin API Endpoints for RBAC and System Management
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import require_read_scope, require_write_scope, require_admin_scope, get_tenant_id
from app.core.security import TokenData
from app.schemas.admin import (
    PermissionResponse, RoleResponse, CreateRoleRequest, UpdateRoleRequest,
    FeatureFlagResponse, CreateFeatureFlagRequest, UpdateFeatureFlagRequest,
    UserResponse, TenantResponse, AuditLogResponse, SystemStatsResponse,
    AssignRoleRequest, InviteUserRequest, InviteUserResponse, BulkUserActionRequest,
    BulkUserActionResponse, UserActivationRequest, UserDeletionRequest,
    ResendInvitationRequest, UserListResponse, UserStats
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset
from app.services.admin_service import AdminService

router = APIRouter()


@router.get("/permissions", response_model=List[PermissionResponse])
async def get_permissions(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all permissions"""
    
    admin_service = AdminService(tenant_id)
    permissions = await admin_service.get_permissions()
    
    return permissions


@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all roles for tenant"""
    
    admin_service = AdminService(tenant_id)
    roles = await admin_service.get_roles()
    
    return roles


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: CreateRoleRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new role"""
    
    admin_service = AdminService(tenant_id)
    role = await admin_service.create_role(role_data, current_user.user_id)
    
    return role


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_data: UpdateRoleRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a role"""
    
    admin_service = AdminService(tenant_id)
    role = await admin_service.update_role(role_id, role_data, current_user.user_id)
    
    return role


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a role"""
    
    admin_service = AdminService(tenant_id)
    await admin_service.delete_role(role_id, current_user.user_id)


# This endpoint is replaced by the paginated version below


@router.put("/users/{user_id}/roles", response_model=UserResponse)
async def update_user_roles(
    user_id: str,
    role_data: AssignRoleRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update user roles"""
    
    admin_service = AdminService(tenant_id)
    user = await admin_service.update_user_roles(user_id, role_data.role_ids, current_user.user_id)
    
    return user


@router.get("/feature-flags", response_model=List[FeatureFlagResponse])
async def get_feature_flags(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get feature flags for tenant"""
    
    admin_service = AdminService(tenant_id)
    flags = await admin_service.get_feature_flags()
    
    return flags


@router.post("/feature-flags", response_model=FeatureFlagResponse, status_code=status.HTTP_201_CREATED)
async def create_feature_flag(
    flag_data: CreateFeatureFlagRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a feature flag"""
    
    admin_service = AdminService(tenant_id)
    flag = await admin_service.create_feature_flag(flag_data, current_user.user_id)
    
    return flag


@router.put("/feature-flags/{flag_id}", response_model=FeatureFlagResponse)
async def update_feature_flag(
    flag_id: int,
    flag_data: UpdateFeatureFlagRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a feature flag"""
    
    admin_service = AdminService(tenant_id)
    flag = await admin_service.update_feature_flag(flag_id, flag_data, current_user.user_id)
    
    return flag


@router.get("/audit-logs", response_model=PaginatedResponse[AuditLogResponse])
async def get_audit_logs(
    pagination: PaginationParams = Depends(),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get audit logs"""
    
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    admin_service = AdminService(tenant_id)
    logs, total = await admin_service.get_audit_logs(
        limit=pagination.size,
        offset=offset,
        resource_type=resource_type,
        user_id=user_id
    )
    
    return PaginatedResponse.create(
        items=logs,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get system statistics"""
    
    admin_service = AdminService(tenant_id)
    stats = await admin_service.get_system_stats()
    
    return stats


@router.get("/tenants", response_model=List[TenantResponse])
async def get_tenants(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get tenants list (super admin only)"""
    
    # For now, return current tenant only
    # In a multi-tenant system, this would return all tenants
    admin_service = AdminService(tenant_id)
    
    # Mock tenant data
    tenants = [
        TenantResponse(
            id=tenant_id,
            name="ImmoNow Demo",
            domain="demo.immonow.com",
            is_active=True,
            user_count=25,
            created_at="2024-01-01T00:00:00Z"
        )
    ]
    
    return tenants


# User Management Endpoints
@router.post("/users/invite", response_model=InviteUserResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    invite_request: InviteUserRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Invite a new user"""
    
    admin_service = AdminService(tenant_id)
    result = await admin_service.invite_user(invite_request, current_user.user_id)
    
    return result


@router.post("/users/{user_id}/activate", status_code=status.HTTP_200_OK)
async def activate_user(
    user_id: str,
    activation_request: UserActivationRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Activate or deactivate a user"""
    
    admin_service = AdminService(tenant_id)
    await admin_service.activate_user(activation_request, current_user.user_id)
    
    return {"message": "User status updated successfully"}


@router.post("/users/{user_id}/deactivate", status_code=status.HTTP_200_OK)
async def deactivate_user(
    user_id: str,
    activation_request: UserActivationRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Deactivate a user"""
    
    admin_service = AdminService(tenant_id)
    activation_request.is_active = False
    await admin_service.activate_user(activation_request, current_user.user_id)
    
    return {"message": "User deactivated successfully"}


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: str,
    deletion_request: UserDeletionRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a user"""
    
    admin_service = AdminService(tenant_id)
    await admin_service.delete_user(deletion_request, current_user.user_id)
    
    return {"message": "User deleted successfully"}


@router.post("/users/bulk-action", response_model=BulkUserActionResponse, status_code=status.HTTP_200_OK)
async def bulk_user_action(
    bulk_request: BulkUserActionRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Perform bulk actions on users"""
    
    admin_service = AdminService(tenant_id)
    result = await admin_service.bulk_user_action(bulk_request, current_user.user_id)
    
    return result


@router.post("/users/{user_id}/resend-invitation", status_code=status.HTTP_200_OK)
async def resend_invitation(
    user_id: str,
    resend_request: ResendInvitationRequest,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Resend invitation to a user"""
    
    admin_service = AdminService(tenant_id)
    await admin_service.resend_invitation(resend_request, current_user.user_id)
    
    return {"message": "Invitation resent successfully"}


@router.get("/users", response_model=UserListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    role: Optional[str] = Query(None),
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get users with filtering and pagination"""
    
    admin_service = AdminService(tenant_id)
    result = await admin_service.get_users(page, size, search, is_active, role)
    
    return result


@router.get("/users/stats", response_model=UserStats)
async def get_user_stats(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get user statistics"""
    
    admin_service = AdminService(tenant_id)
    stats = await admin_service.get_user_stats()
    
    return stats
