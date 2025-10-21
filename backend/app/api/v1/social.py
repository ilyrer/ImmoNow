"""
Social Hub API Endpoints
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status, Request, UploadFile, File
import os
import uuid
from pathlib import Path

from app.api.deps import (
    require_read_scope, require_write_scope, require_delete_scope,
    get_tenant_id
)
from app.core.security import TokenData
from app.core.errors import NotFoundError, ValidationError
from app.schemas.social import (
    SocialAccountResponse, SocialPostResponse, SocialAnalyticsResponse,
    PostAnalyticsResponse, SocialQueueResponse, CreatePostRequest,
    UpdatePostRequest, SocialTemplateResponse, CreateTemplateRequest,
    UpdateTemplateRequest
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset
from app.services.social_service import SocialService

router = APIRouter()


@router.get("/accounts", response_model=List[SocialAccountResponse])
async def get_social_accounts(
    platform: Optional[str] = Query(None, description="Platform filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get social media accounts"""
    
    social_service = SocialService(tenant_id)
    accounts = await social_service.get_accounts(platform=platform)
    
    return accounts


@router.post("/accounts", response_model=SocialAccountResponse, status_code=status.HTTP_201_CREATED)
async def connect_social_account(
    platform: str,
    access_token: str,
    account_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Connect a social media account"""
    
    social_service = SocialService(tenant_id)
    account = await social_service.connect_account(
        platform, access_token, account_id, current_user.user_id
    )
    
    return account


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_social_account(
    account_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Disconnect a social media account"""
    
    social_service = SocialService(tenant_id)
    await social_service.disconnect_account(account_id, current_user.user_id)


@router.get("/posts", response_model=PaginatedResponse[SocialPostResponse])
async def get_social_posts(
    pagination: PaginationParams = Depends(),
    platform: Optional[str] = Query(None, description="Platform filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    account_id: Optional[str] = Query(None, description="Account ID filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get social media posts"""
    
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    social_service = SocialService(tenant_id)
    posts, total = await social_service.get_posts(
        offset=offset,
        limit=pagination.size,
        platform=platform,
        status=status,
        account_id=account_id
    )
    
    return PaginatedResponse.create(
        items=posts,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("/posts", response_model=SocialPostResponse, status_code=status.HTTP_201_CREATED)
async def create_social_post(
    post_data: CreatePostRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a social media post"""
    
    social_service = SocialService(tenant_id)
    post = await social_service.create_post(post_data, current_user.user_id)
    
    return post


@router.get("/posts/{post_id}", response_model=SocialPostResponse)
async def get_social_post(
    post_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific social media post"""
    
    social_service = SocialService(tenant_id)
    post = await social_service.get_post(post_id)
    
    if not post:
        raise NotFoundError("Post not found")
    
    return post


@router.put("/posts/{post_id}", response_model=SocialPostResponse)
async def update_social_post(
    post_id: str,
    post_data: UpdatePostRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a social media post"""
    
    social_service = SocialService(tenant_id)
    post = await social_service.update_post(post_id, post_data, current_user.user_id)
    
    if not post:
        raise NotFoundError("Post not found")
    
    return post


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_social_post(
    post_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a social media post"""
    
    social_service = SocialService(tenant_id)
    await social_service.delete_post(post_id, current_user.user_id)


@router.get("/analytics", response_model=SocialAnalyticsResponse)
async def get_social_analytics(
    start_date: Optional[str] = Query(None, description="Start date"),
    end_date: Optional[str] = Query(None, description="End date"),
    platform: Optional[str] = Query(None, description="Platform filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get social media analytics"""
    
    social_service = SocialService(tenant_id)
    analytics = await social_service.get_analytics(
        start_date=start_date,
        end_date=end_date,
        platform=platform
    )
    
    return analytics


@router.get("/posts/{post_id}/analytics", response_model=PostAnalyticsResponse)
async def get_post_analytics(
    post_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get analytics for a specific post"""
    
    social_service = SocialService(tenant_id)
    analytics = await social_service.get_post_analytics(post_id)
    
    if not analytics:
        raise NotFoundError("Post analytics not found")
    
    return analytics


@router.get("/queue", response_model=SocialQueueResponse)
async def get_social_queue(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get social media posting queue"""
    
    social_service = SocialService(tenant_id)
    queue = await social_service.get_queue()
    
    return queue


# Template Endpoints
@router.get("/templates", response_model=List[SocialTemplateResponse])
async def get_social_templates(
    template_type: Optional[str] = Query(None, description="Template type filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get social media templates"""
    
    social_service = SocialService(tenant_id)
    templates = await social_service.get_templates(template_type=template_type)
    
    return templates


@router.post("/templates", response_model=SocialTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_social_template(
    template_data: CreateTemplateRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a social media template"""
    
    social_service = SocialService(tenant_id)
    template = await social_service.create_template(template_data, current_user.user_id)
    
    return template


@router.get("/templates/{template_id}", response_model=SocialTemplateResponse)
async def get_social_template(
    template_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific social media template"""
    
    social_service = SocialService(tenant_id)
    template = await social_service.get_template(template_id)
    
    if not template:
        raise NotFoundError("Template not found")
    
    return template


@router.put("/templates/{template_id}", response_model=SocialTemplateResponse)
async def update_social_template(
    template_id: str,
    template_data: UpdateTemplateRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a social media template"""
    
    social_service = SocialService(tenant_id)
    template = await social_service.update_template(template_id, template_data, current_user.user_id)
    
    if not template:
        raise NotFoundError("Template not found")
    
    return template


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_social_template(
    template_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a social media template"""
    
    social_service = SocialService(tenant_id)
    await social_service.delete_template(template_id, current_user.user_id)


# Post Actions
@router.post("/posts/{post_id}/publish", response_model=SocialPostResponse)
async def publish_social_post(
    post_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Publish a social media post immediately"""
    
    social_service = SocialService(tenant_id)
    post = await social_service.publish_post(post_id, current_user.user_id)
    
    if not post:
        raise NotFoundError("Post not found")
    
    return post


@router.post("/posts/{post_id}/schedule", response_model=SocialPostResponse)
async def schedule_social_post(
    post_id: str,
    scheduled_at: datetime,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Schedule a social media post"""
    
    social_service = SocialService(tenant_id)
    post = await social_service.schedule_post(post_id, scheduled_at, current_user.user_id)
    
    if not post:
        raise NotFoundError("Post not found")
    
    return post


# OAuth Endpoints
@router.post("/oauth/{platform}/authorize")
async def start_oauth_flow(
    platform: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Start OAuth flow for social media platform"""
    
    if platform not in ['facebook', 'instagram', 'linkedin', 'twitter']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid platform. Must be one of: facebook, instagram, linkedin, twitter"
        )
    
    social_service = SocialService(tenant_id)
    auth_url = await social_service.get_oauth_url(platform)
    
    return {"auth_url": auth_url}


@router.get("/oauth/{platform}/callback")
async def oauth_callback(
    platform: str,
    code: str = Query(..., description="OAuth authorization code"),
    state: Optional[str] = Query(None, description="OAuth state parameter"),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Handle OAuth callback"""
    
    social_service = SocialService(tenant_id)
    account = await social_service.handle_oauth_callback(platform, code, state, current_user.user_id)
    
    return account


@router.post("/oauth/{platform}/refresh")
async def refresh_oauth_token(
    platform: str,
    account_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Refresh OAuth token for social media account"""
    
    social_service = SocialService(tenant_id)
    result = await social_service.refresh_token(platform, account_id, current_user.user_id)
    
    return result


# Webhook Endpoints
@router.post("/webhooks/{platform}")
async def handle_platform_webhook(
    platform: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_id)
):
    """Handle platform webhooks for real-time updates"""
    
    social_service = SocialService(tenant_id)
    await social_service.handle_webhook(platform, request)
    
    return {"status": "success"}


# Social Activities Endpoint
@router.get("/activities", response_model=List[dict])
async def get_social_activities(
    limit: int = Query(10, description="Number of activities to return"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get recent social media activities for the tenant"""
    
    social_service = SocialService(tenant_id)
    activities = await social_service.get_recent_activities(limit=limit)
    
    return activities


# Media Upload Endpoint
@router.post("/media")
async def upload_media(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Upload media file for social media posts"""
    
    # Validate file type
    allowed_types = {
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/avi', 'video/mov', 'video/webm'
    }
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 50MB)
    max_size = 50 * 1024 * 1024  # 50MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 50MB limit"
        )
    
    # Create media directory if it doesn't exist
    media_dir = Path("media/social")
    media_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix if file.filename else '.jpg'
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = media_dir / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Return file URL
        file_url = f"/media/social/{unique_filename}"
        
        return {
            "url": file_url,
            "filename": unique_filename,
            "original_filename": file.filename,
            "content_type": file.content_type,
            "size": len(content)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
