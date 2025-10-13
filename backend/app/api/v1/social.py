"""
Social Hub API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import (
    require_read_scope, require_write_scope, require_delete_scope,
    get_tenant_id
)
from app.core.security import TokenData
from app.core.errors import NotFoundError, ValidationError
from app.schemas.social import (
    SocialAccountResponse, SocialPostResponse, SocialAnalyticsResponse,
    PostAnalyticsResponse, SocialQueueResponse, CreatePostRequest,
    UpdatePostRequest
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
