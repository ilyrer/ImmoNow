"""
Authentication API Endpoints
Handles user registration, login, token refresh, and user info
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from asgiref.sync import sync_to_async

from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    TokenRefreshResponse,
    UserResponse,
    MessageResponse,
    TenantUserInfo
)
from app.services.auth_service import AuthService
from app.core.errors import UnauthorizedError, ConflictError, NotFoundError
from app.db.models import User, TenantUser


router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Dependency to get current authenticated user from JWT token
    """
    try:
        token = credentials.credentials
        user = await AuthService.get_current_user(token)
        return user
    except UnauthorizedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_tenant_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TenantUser:
    """
    Dependency to get current user's tenant membership from JWT token
    """
    try:
        token = credentials.credentials
        payload = AuthService.decode_token(token)
        
        # Get tenant membership with sync_to_async
        @sync_to_async
        def get_tenant_membership():
            return TenantUser.objects.select_related('user', 'tenant').get(
                user__id=payload.sub,
                tenant__id=payload.tenant_id,
                is_active=True
            )
        
        tenant_user = await get_tenant_membership()
        return tenant_user
    except TenantUser.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tenant membership not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except UnauthorizedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user and create tenant",
    description="""
    Register a new user and automatically create a tenant (organization).
    The user will be assigned the 'owner' role in the newly created tenant.
    Returns access and refresh tokens for immediate login.
    """
)
async def register(request: RegisterRequest):
    """
    Register a new user and create a tenant
    """
    try:
        response = await AuthService.register_user(request)
        return response
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login user",
    description="""
    Authenticate user with email and password.
    Returns JWT access token, refresh token, and user information.
    If user belongs to multiple tenants, returns list of available tenants.
    """
)
async def login(request: LoginRequest):
    """
    Authenticate user and return tokens
    """
    try:
        response = await AuthService.login_user(request)
        return response
    except UnauthorizedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post(
    "/refresh",
    response_model=TokenRefreshResponse,
    summary="Refresh access token",
    description="""
    Use a refresh token to get a new access token and refresh token.
    """
)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    """
    try:
        response = await AuthService.refresh_access_token(request.refresh_token)
        return response
    except UnauthorizedError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="""
    Get information about the currently authenticated user.
    Requires valid JWT access token in Authorization header.
    """
)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return UserResponse.from_orm(current_user)


@router.get(
    "/me/tenant",
    response_model=TenantUserInfo,
    summary="Get current user's tenant info",
    description="""
    Get information about the current user's role and permissions in the current tenant.
    Requires valid JWT access token in Authorization header.
    """
)
async def get_me_tenant(tenant_user: TenantUser = Depends(get_current_tenant_user)):
    """
    Get current user's tenant membership information
    """
    return TenantUserInfo(
        tenant_id=str(tenant_user.tenant.id),
        tenant_name=tenant_user.tenant.name,
        role=tenant_user.role,
        can_manage_properties=tenant_user.can_manage_properties,
        can_manage_documents=tenant_user.can_manage_documents,
        can_manage_users=tenant_user.can_manage_users,
        can_view_analytics=tenant_user.can_view_analytics,
        can_export_data=tenant_user.can_export_data,
        is_active=tenant_user.is_active
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout user",
    description="""
    Logout current user. In the current implementation, this is handled client-side
    by removing tokens. Server-side token blacklisting can be added later.
    """
)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout user (client should remove tokens)
    """
    return MessageResponse(
        message="Logout successful. Please remove tokens from client.",
        success=True
    )


@router.get(
    "/verify-token",
    response_model=MessageResponse,
    summary="Verify token validity",
    description="""
    Verify if the provided JWT token is valid and not expired.
    Useful for checking authentication status without fetching user data.
    """
)
async def verify_token(current_user: User = Depends(get_current_user)):
    """
    Verify if token is valid
    """
    return MessageResponse(
        message="Token is valid",
        success=True
    )
