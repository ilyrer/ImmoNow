"""
User Management API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.api.deps import require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.core.billing_guard import BillingGuard
from app.core.errors import NotFoundError, ValidationError
from app.schemas.user import UserResponse
from app.services.user_service import UserService


router = APIRouter()


class InviteUserRequest(BaseModel):
    """Request model for inviting a user to the tenant"""
    email: EmailStr
    first_name: str
    last_name: str
    role: str = "agent"  # Default role
    phone: Optional[str] = None
    department: Optional[str] = None


class InviteUserResponse(BaseModel):
    """Response model for user invitation"""
    message: str
    user: UserResponse
    invitation_sent: bool


@router.post(
    "/invite",
    response_model=InviteUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite user to tenant",
    description="""
    Invite a new user to the current tenant.
    Checks seat limits before creating the user.
    Sends invitation email if email service is configured.
    """
)
async def invite_user(
    request: InviteUserRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Invite a new user to the tenant
    """
    try:
        # Check seat limit BEFORE creating user
        await BillingGuard.check_limit(
            tenant_id=tenant_id,
            resource='users',
            action='create',
            additional_count=1
        )
        
        # Create user service
        user_service = UserService(tenant_id)
        
        # Invite user
        result = await user_service.invite_user(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            role=request.role,
            phone=request.phone,
            department=request.department,
            invited_by=current_user.user_id
        )
        
        return InviteUserResponse(
            message=f"User {request.email} has been invited to the tenant",
            user=result['user'],
            invitation_sent=result['invitation_sent']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to invite user: {str(e)}"
        )


@router.get(
    "",
    response_model=List[UserResponse],
    summary="Get tenant users",
    description="Get list of all users in the current tenant"
)
async def get_tenant_users(
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Get all users in the tenant
    """
    try:
        user_service = UserService(tenant_id)
        users = await user_service.get_tenant_users()
        return users
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users: {str(e)}"
        )


@router.put(
    "/{user_id}/role",
    summary="Update user role",
    description="Update the role of a user in the tenant"
)
async def update_user_role(
    user_id: str,
    role: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Update user role in tenant
    """
    try:
        user_service = UserService(tenant_id)
        await user_service.update_user_role(user_id, role)
        
        return {"message": f"User role updated to {role}"}
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user role: {str(e)}"
        )


@router.delete(
    "/{user_id}",
    summary="Remove user from tenant",
    description="Remove a user from the tenant (soft delete)"
)
async def remove_user(
    user_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Remove user from tenant
    """
    try:
        user_service = UserService(tenant_id)
        await user_service.remove_user(user_id)
        
        return {"message": "User removed from tenant"}
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove user: {str(e)}"
        )
