"""
Portal OAuth API Endpoints
Handles OAuth authentication for ImmoScout24 and Immowelt
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.core.errors import ServiceError, ValidationError
from app.services.immoscout_oauth_service import ImmoScout24OAuthService
from app.services.immowelt_oauth_service import ImmoweltOAuthService
from app.db.models import IntegrationSettings, User
from asgiref.sync import sync_to_async

router = APIRouter()

# Request/Response Models
class OAuthAuthorizeRequest(BaseModel):
    """Request model for OAuth authorization"""
    platform: str = Field(..., description="Platform name (immoscout24, immowelt)")
    user_id: str = Field(..., description="User ID")

class OAuthAuthorizeResponse(BaseModel):
    """Response model for OAuth authorization"""
    authorization_url: str
    state: str
    platform: str

class OAuthCallbackRequest(BaseModel):
    """Request model for OAuth callback"""
    code: str = Field(..., description="Authorization code")
    state: str = Field(..., description="State parameter")
    platform: str = Field(..., description="Platform name")

class OAuthCallbackResponse(BaseModel):
    """Response model for OAuth callback"""
    success: bool
    message: str
    access_token: Optional[str] = None
    expires_at: Optional[datetime] = None

class OAuthRefreshRequest(BaseModel):
    """Request model for token refresh"""
    platform: str = Field(..., description="Platform name")
    refresh_token: str = Field(..., description="Refresh token")

class OAuthRefreshResponse(BaseModel):
    """Response model for token refresh"""
    success: bool
    message: str
    access_token: Optional[str] = None
    expires_at: Optional[datetime] = None

class OAuthTestRequest(BaseModel):
    """Request model for connection test"""
    platform: str = Field(..., description="Platform name")
    access_token: str = Field(..., description="Access token")

class OAuthTestResponse(BaseModel):
    """Response model for connection test"""
    success: bool
    message: str
    user_info: Optional[Dict[str, Any]] = None

# ImmoScout24 OAuth Endpoints
@router.post("/immoscout24/oauth/authorize", response_model=OAuthAuthorizeResponse)
async def immoscout24_authorize(
    request: OAuthAuthorizeRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Start ImmoScout24 OAuth flow"""
    
    try:
        oauth_service = ImmoScout24OAuthService(tenant_id)
        state = oauth_service._generate_state(request.user_id)
        auth_url = oauth_service.generate_authorization_url(request.user_id, state)
        
        return OAuthAuthorizeResponse(
            authorization_url=auth_url,
            state=state,
            platform="immoscout24"
        )
        
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {str(e)}"
        )

@router.post("/immoscout24/oauth/callback", response_model=OAuthCallbackResponse)
async def immoscout24_callback(
    request: OAuthCallbackRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Handle ImmoScout24 OAuth callback"""
    
    try:
        oauth_service = ImmoScout24OAuthService(tenant_id)
        token_data = await oauth_service.exchange_code_for_token(request.code, request.state)
        
        # Save tokens to database
        @sync_to_async
        def save_tokens():
            settings, created = IntegrationSettings.objects.get_or_create(
                tenant_id=tenant_id,
                defaults={'created_by_id': current_user.user_id}
            )
            settings.immoscout_access_token = token_data['access_token']
            settings.immoscout_refresh_token = token_data.get('refresh_token')
            settings.immoscout_token_expires_at = token_data['expires_at']
            settings.save()
            return settings
        
        await save_tokens()
        
        return OAuthCallbackResponse(
            success=True,
            message="OAuth authentication successful",
            access_token=token_data['access_token'],
            expires_at=token_data['expires_at']
        )
        
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process OAuth callback: {str(e)}"
        )

@router.post("/immoscout24/oauth/refresh", response_model=OAuthRefreshResponse)
async def immoscout24_refresh(
    request: OAuthRefreshRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Refresh ImmoScout24 access token"""
    
    try:
        oauth_service = ImmoScout24OAuthService(tenant_id)
        token_data = await oauth_service.refresh_access_token(request.refresh_token)
        
        # Update tokens in database
        @sync_to_async
        def update_tokens():
            try:
                settings = IntegrationSettings.objects.get(tenant_id=tenant_id)
                settings.immoscout_access_token = token_data['access_token']
                settings.immoscout_refresh_token = token_data.get('refresh_token')
                settings.immoscout_token_expires_at = token_data['expires_at']
                settings.save()
                return settings
            except IntegrationSettings.DoesNotExist:
                raise ServiceError("Integration settings not found")
        
        await update_tokens()
        
        return OAuthRefreshResponse(
            success=True,
            message="Token refreshed successfully",
            access_token=token_data['access_token'],
            expires_at=token_data['expires_at']
        )
        
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh token: {str(e)}"
        )

@router.post("/immoscout24/test", response_model=OAuthTestResponse)
async def immoscout24_test(
    request: OAuthTestRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Test ImmoScout24 connection"""
    
    try:
        oauth_service = ImmoScout24OAuthService(tenant_id)
        result = await oauth_service.test_connection(request.access_token)
        
        return OAuthTestResponse(
            success=result['success'],
            message=result['message'],
            user_info={
                'user_id': result.get('user_id'),
                'username': result.get('username'),
                'email': result.get('email')
            } if result['success'] else None
        )
        
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test connection: {str(e)}"
        )

# Immowelt OAuth Endpoints
@router.post("/immowelt/oauth/authorize", response_model=OAuthAuthorizeResponse)
async def immowelt_authorize(
    request: OAuthAuthorizeRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Start Immowelt OAuth flow"""
    
    try:
        oauth_service = ImmoweltOAuthService(tenant_id)
        state = oauth_service._generate_state(request.user_id)
        auth_url = oauth_service.generate_authorization_url(request.user_id, state)
        
        return OAuthAuthorizeResponse(
            authorization_url=auth_url,
            state=state,
            platform="immowelt"
        )
        
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {str(e)}"
        )

@router.post("/immowelt/oauth/callback", response_model=OAuthCallbackResponse)
async def immowelt_callback(
    request: OAuthCallbackRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Handle Immowelt OAuth callback"""
    
    try:
        oauth_service = ImmoweltOAuthService(tenant_id)
        token_data = await oauth_service.exchange_code_for_token(request.code, request.state)
        
        # Save tokens to database
        @sync_to_async
        def save_tokens():
            settings, created = IntegrationSettings.objects.get_or_create(
                tenant_id=tenant_id,
                defaults={'created_by_id': current_user.user_id}
            )
            # Note: We'll need to add immowelt fields to IntegrationSettings model
            # For now, we'll store in immowelt_api_key field as JSON
            import json
            settings.immowelt_api_key = json.dumps({
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token'),
                'expires_at': token_data['expires_at'].isoformat()
            })
            settings.save()
            return settings
        
        await save_tokens()
        
        return OAuthCallbackResponse(
            success=True,
            message="OAuth authentication successful",
            access_token=token_data['access_token'],
            expires_at=token_data['expires_at']
        )
        
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process OAuth callback: {str(e)}"
        )

@router.post("/immowelt/oauth/refresh", response_model=OAuthRefreshResponse)
async def immowelt_refresh(
    request: OAuthRefreshRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Refresh Immowelt access token"""
    
    try:
        oauth_service = ImmoweltOAuthService(tenant_id)
        token_data = await oauth_service.refresh_access_token(request.refresh_token)
        
        # Update tokens in database
        @sync_to_async
        def update_tokens():
            try:
                settings = IntegrationSettings.objects.get(tenant_id=tenant_id)
                import json
                settings.immowelt_api_key = json.dumps({
                    'access_token': token_data['access_token'],
                    'refresh_token': token_data.get('refresh_token'),
                    'expires_at': token_data['expires_at'].isoformat()
                })
                settings.save()
                return settings
            except IntegrationSettings.DoesNotExist:
                raise ServiceError("Integration settings not found")
        
        await update_tokens()
        
        return OAuthRefreshResponse(
            success=True,
            message="Token refreshed successfully",
            access_token=token_data['access_token'],
            expires_at=token_data['expires_at']
        )
        
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh token: {str(e)}"
        )

@router.post("/immowelt/test", response_model=OAuthTestResponse)
async def immowelt_test(
    request: OAuthTestRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Test Immowelt connection"""
    
    try:
        oauth_service = ImmoweltOAuthService(tenant_id)
        result = await oauth_service.test_connection(request.access_token)
        
        return OAuthTestResponse(
            success=result['success'],
            message=result['message'],
            user_info={
                'user_id': result.get('user_id'),
                'username': result.get('username'),
                'email': result.get('email')
            } if result['success'] else None
        )
        
    except ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test connection: {str(e)}"
        )
