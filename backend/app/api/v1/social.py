"""
Social Hub API Endpoints

Provides endpoints for:
- OAuth2 authentication flows for social platforms
- Social media account management
- Post creation, scheduling, and publishing
- Analytics and insights
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
import os

from app.api.deps import (
    require_read_scope,
    require_write_scope,
    require_delete_scope,
    get_tenant_id,
)
from app.core.security import TokenData
from app.core.errors import NotFoundError, ValidationError as AppValidationError
from app.core.settings import settings
from app.schemas.social import (
    SocialAccountResponse,
    SocialPostResponse,
    SocialAnalyticsResponse,
    PostAnalyticsResponse,
    SocialQueueResponse,
    CreatePostRequest,
    UpdatePostRequest,
    SocialPlatform,
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset
from app.services.social_service import SocialService
from app.services.oauth_service import OAuthService, OAuthConfig
from app.services.rate_limit_manager import RateLimitManager, get_rate_limit_status

router = APIRouter()


# ============================================================================
# OAuth Request/Response Models
# ============================================================================


class OAuthInitRequest(BaseModel):
    """Request to initiate OAuth flow"""

    redirect_uri: Optional[str] = Field(
        None, description="Custom redirect URI (defaults to frontend callback)"
    )
    account_label: Optional[str] = Field(
        None, description="Optional label for the account (for multi-account support)"
    )


class OAuthInitResponse(BaseModel):
    """Response with OAuth authorization URL"""

    authorization_url: str
    state: str
    platform: str


class OAuthCallbackRequest(BaseModel):
    """Request for OAuth callback processing"""

    code: str = Field(..., description="Authorization code from OAuth provider")
    state: str = Field(..., description="State token for validation")


class OAuthCallbackResponse(BaseModel):
    """Response after successful OAuth callback"""

    success: bool
    account_id: str
    platform: str
    account_name: str
    message: str


class RateLimitStatusResponse(BaseModel):
    """Rate limit status for a platform"""

    platform: str
    hourly_limit: int
    daily_limit: int
    hourly_used: int
    daily_used: int
    is_limited: bool
    available_tokens: float


# ============================================================================
# OAuth Endpoints
# ============================================================================


@router.get("/oauth/{platform}/init", response_model=OAuthInitResponse)
async def init_oauth(
    platform: str,
    redirect_uri: Optional[str] = Query(None, description="Custom redirect URI"),
    account_label: Optional[str] = Query(
        None, description="Account label for multi-account"
    ),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Initialize OAuth flow for a social media platform

    Returns an authorization URL that the frontend should redirect the user to.
    The user will authenticate with the platform and be redirected back to
    the callback URL with an authorization code.

    Supported platforms: instagram, facebook, linkedin, youtube, tiktok, immoscout24, immowelt
    """
    # Validate platform
    valid_platforms = [
        "instagram",
        "facebook",
        "linkedin",
        "youtube",
        "tiktok",
        "immoscout24",
        "immowelt",
    ]
    if platform.lower() not in valid_platforms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid platform. Supported: {', '.join(valid_platforms)}",
        )

    # Use default redirect URI if not provided
    if not redirect_uri:
        frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
        redirect_uri = f"{frontend_url}/oauth/callback"

    try:
        oauth_service = OAuthService(tenant_id)
        result = oauth_service.generate_oauth_url(
            platform=platform.lower(),
            redirect_uri=redirect_uri,
            user_id=current_user.user_id,
            account_label=account_label,
        )

        return OAuthInitResponse(
            authorization_url=result["url"],
            state=result["state"],
            platform=platform.lower(),
        )

    except AppValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize OAuth: {str(e)}",
        )


@router.post("/oauth/callback", response_model=OAuthCallbackResponse)
async def oauth_callback(
    request: OAuthCallbackRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Handle OAuth callback and exchange code for tokens

    This endpoint should be called by the frontend after receiving
    the OAuth callback from the platform. It will:
    1. Validate the state token
    2. Exchange the authorization code for access tokens
    3. Fetch account information from the platform
    4. Save the connected account to the database
    """
    oauth_service = OAuthService(tenant_id)

    try:
        # Validate state and get metadata
        state_data = oauth_service.validate_state(request.state)
        platform = state_data["platform"]
        redirect_uri = state_data["redirect_uri"]
        account_label = state_data.get("account_label")

        # Exchange code for token
        token_data = await oauth_service.exchange_code_for_token(
            platform=platform, code=request.code, redirect_uri=redirect_uri
        )

        # For Instagram, get long-lived token
        if platform == "instagram":
            token_data = await oauth_service.get_instagram_long_lived_token(
                token_data["access_token"]
            )
            token_data["user_id"] = (
                await oauth_service.get_account_info(
                    "instagram", token_data["access_token"]
                )
            ).get("account_id")

        # Get account info from platform
        account_info = await oauth_service.get_account_info(
            platform=platform, access_token=token_data["access_token"]
        )

        # For Facebook, use page token if available
        if platform == "facebook" and account_info.get("access_token"):
            token_data["access_token"] = account_info["access_token"]

        # Save connected account
        account = await oauth_service.save_connected_account(
            platform=platform,
            token_data=token_data,
            account_info=account_info,
            user_id=current_user.user_id,
            account_label=account_label,
        )

        return OAuthCallbackResponse(
            success=True,
            account_id=str(account.id),
            platform=platform,
            account_name=account.account_name,
            message=f"Successfully connected {platform} account: {account.account_name}",
        )

    except AppValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}",
        )


@router.get("/oauth/platforms")
async def get_available_platforms(
    current_user: TokenData = Depends(require_read_scope),
):
    """
    Get list of available OAuth platforms and their configuration status
    """
    platforms = []

    for platform, config in OAuthConfig.PLATFORMS.items():
        client_id = os.getenv(config["client_id_env"])
        is_configured = bool(client_id)

        platforms.append(
            {
                "platform": platform,
                "display_name": platform.replace("_", " ").title(),
                "is_configured": is_configured,
                "scopes": config["scopes"],
                "category": (
                    "real_estate"
                    if platform in ["immoscout24", "immowelt"]
                    else "social_media"
                ),
            }
        )

    return {
        "platforms": platforms,
        "configured_count": sum(1 for p in platforms if p["is_configured"]),
        "total_count": len(platforms),
    }


# ============================================================================
# Rate Limit Endpoints
# ============================================================================


@router.get("/rate-limits", response_model=List[RateLimitStatusResponse])
async def get_rate_limits(
    platform: Optional[str] = Query(None, description="Filter by platform"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Get current rate limit status for all platforms or a specific platform
    """
    rate_limiter = RateLimitManager()

    if platform:
        status_data = rate_limiter.get_status(platform.lower(), tenant_id)
        return [
            RateLimitStatusResponse(
                platform=status_data["platform"],
                hourly_limit=status_data["limits"]["requests_per_hour"],
                daily_limit=status_data["limits"]["requests_per_day"],
                hourly_used=status_data["current_usage"]["hourly"],
                daily_used=status_data["current_usage"]["daily"],
                is_limited=status_data["is_limited"],
                available_tokens=status_data["available_tokens"],
            )
        ]

    # Get all platforms
    all_status = rate_limiter.get_all_status(tenant_id)
    return [
        RateLimitStatusResponse(
            platform=data["platform"],
            hourly_limit=data["limits"]["requests_per_hour"],
            daily_limit=data["limits"]["requests_per_day"],
            hourly_used=data["current_usage"]["hourly"],
            daily_used=data["current_usage"]["daily"],
            is_limited=data["is_limited"],
            available_tokens=data["available_tokens"],
        )
        for data in all_status.values()
    ]


# ============================================================================
# Account Management Endpoints (existing, updated)
# ============================================================================


@router.get("/accounts", response_model=List[SocialAccountResponse])
async def get_social_accounts(
    platform: Optional[str] = Query(None, description="Platform filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Get social media accounts"""

    social_service = SocialService(tenant_id)
    accounts = await social_service.get_accounts(platform=platform)

    return accounts


@router.post(
    "/accounts",
    response_model=SocialAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def connect_social_account(
    platform: str,
    access_token: str,
    account_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
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
    tenant_id: str = Depends(get_tenant_id),
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
    tenant_id: str = Depends(get_tenant_id),
):
    """Get social media posts"""

    offset = get_pagination_offset(pagination.page, pagination.size)

    social_service = SocialService(tenant_id)
    posts, total = await social_service.get_posts(
        offset=offset,
        limit=pagination.size,
        platform=platform,
        status=status,
        account_id=account_id,
    )

    return PaginatedResponse.create(
        items=posts, total=total, page=pagination.page, size=pagination.size
    )


@router.post(
    "/posts", response_model=SocialPostResponse, status_code=status.HTTP_201_CREATED
)
async def create_social_post(
    post_data: CreatePostRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Create a social media post"""

    social_service = SocialService(tenant_id)
    post = await social_service.create_post(post_data, current_user.user_id)

    return post


@router.get("/posts/{post_id}", response_model=SocialPostResponse)
async def get_social_post(
    post_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
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
    tenant_id: str = Depends(get_tenant_id),
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
    tenant_id: str = Depends(get_tenant_id),
):
    """Delete a social media post"""

    social_service = SocialService(tenant_id)
    await social_service.delete_post(post_id, current_user.user_id)


# ============================================================================
# Dashboard Stats Endpoint
# ============================================================================


class DashboardStatsResponse(BaseModel):
    """Dashboard statistics for SocialHub overview"""

    connected_accounts: int = Field(
        default=0, description="Number of connected social accounts"
    )
    published_posts: int = Field(
        default=0, description="Number of published posts this month"
    )
    scheduled_posts: int = Field(default=0, description="Number of scheduled posts")
    pending_posts: int = Field(
        default=0, description="Number of posts pending in queue"
    )
    total_reach: int = Field(default=0, description="Total reach this month")
    engagement_rate: float = Field(
        default=0.0, description="Average engagement rate percentage"
    )
    reach_change: float = Field(
        default=0.0, description="Reach change percentage vs last month"
    )
    posts_change: float = Field(
        default=0.0, description="Posts change percentage vs last month"
    )
    engagement_change: float = Field(
        default=0.0, description="Engagement change percentage vs last month"
    )


class RecentActivityItem(BaseModel):
    """Single recent activity item"""

    type: str = Field(
        ...,
        description="Activity type: post_published, post_scheduled, account_connected",
    )
    title: str
    description: str
    time: str
    platform: Optional[str] = None


class DashboardResponse(BaseModel):
    """Complete dashboard response"""

    stats: DashboardStatsResponse
    recent_activities: List[RecentActivityItem] = []


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard_stats(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Get dashboard statistics for SocialHub overview.
    Returns connected accounts, post counts, engagement metrics, and recent activities.
    """
    from datetime import datetime, timedelta
    from communications.models import SocialAccount, SocialPost
    from django.db.models import Count, Avg
    from django.utils import timezone

    now = timezone.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_last_month = (start_of_month - timedelta(days=1)).replace(day=1)

    # Get connected accounts count
    connected_accounts = await SocialAccount.objects.filter(
        tenant_id=tenant_id, is_active=True
    ).acount()

    # Get published posts this month
    published_posts = await SocialPost.objects.filter(
        tenant_id=tenant_id, status="published", published_at__gte=start_of_month
    ).acount()

    # Get published posts last month for comparison
    published_last_month = await SocialPost.objects.filter(
        tenant_id=tenant_id,
        status="published",
        published_at__gte=start_of_last_month,
        published_at__lt=start_of_month,
    ).acount()

    # Get scheduled posts
    scheduled_posts = await SocialPost.objects.filter(
        tenant_id=tenant_id, status="scheduled", scheduled_at__gte=now
    ).acount()

    # Get pending posts in queue
    pending_posts = await SocialPost.objects.filter(
        tenant_id=tenant_id, status__in=["draft", "pending"]
    ).acount()

    # Calculate changes
    posts_change = 0.0
    if published_last_month > 0:
        posts_change = (
            (published_posts - published_last_month) / published_last_month
        ) * 100

    # Get analytics for reach and engagement
    social_service = SocialService(tenant_id)
    try:
        analytics = await social_service.get_analytics(
            start_date=start_of_month.isoformat(), end_date=now.isoformat()
        )
        total_reach = getattr(analytics, "total_reach", 0) or 0
        engagement_rate = getattr(analytics, "engagement_rate", 0.0) or 0.0

        # Get last month analytics for comparison
        last_month_analytics = await social_service.get_analytics(
            start_date=start_of_last_month.isoformat(),
            end_date=start_of_month.isoformat(),
        )
        last_reach = getattr(last_month_analytics, "total_reach", 0) or 0
        last_engagement = getattr(last_month_analytics, "engagement_rate", 0.0) or 0.0

        reach_change = 0.0
        if last_reach > 0:
            reach_change = ((total_reach - last_reach) / last_reach) * 100

        engagement_change = 0.0
        if last_engagement > 0:
            engagement_change = (
                (engagement_rate - last_engagement) / last_engagement
            ) * 100
    except Exception:
        total_reach = 0
        engagement_rate = 0.0
        reach_change = 0.0
        engagement_change = 0.0

    # Get recent activities
    recent_activities = []

    # Get recent published posts
    recent_published = SocialPost.objects.filter(
        tenant_id=tenant_id, status="published"
    ).order_by("-published_at")[:3]
    async for post in recent_published:
        time_diff = now - post.published_at if post.published_at else timedelta(0)
        time_str = _format_time_ago(time_diff)
        recent_activities.append(
            RecentActivityItem(
                type="post_published",
                title="Beitrag veröffentlicht",
                description=f'{post.platform.title() if post.platform else "Social Media"} Post "{post.content[:30]}..." wurde veröffentlicht',
                time=time_str,
                platform=post.platform,
            )
        )

    # Get recent scheduled posts
    recent_scheduled = SocialPost.objects.filter(
        tenant_id=tenant_id, status="scheduled"
    ).order_by("-created_at")[:2]
    async for post in recent_scheduled:
        time_diff = now - post.created_at if post.created_at else timedelta(0)
        time_str = _format_time_ago(time_diff)
        scheduled_time = (
            post.scheduled_at.strftime("%d.%m. um %H:%M")
            if post.scheduled_at
            else "bald"
        )
        recent_activities.append(
            RecentActivityItem(
                type="post_scheduled",
                title="Beitrag geplant",
                description=f'{post.platform.title() if post.platform else "Social Media"} Post für {scheduled_time} geplant',
                time=time_str,
                platform=post.platform,
            )
        )

    # Get recently connected accounts
    recent_accounts = SocialAccount.objects.filter(
        tenant_id=tenant_id, is_active=True
    ).order_by("-connected_at")[:2]
    async for account in recent_accounts:
        time_diff = now - account.connected_at if account.connected_at else timedelta(0)
        time_str = _format_time_ago(time_diff)
        recent_activities.append(
            RecentActivityItem(
                type="account_connected",
                title="Konto verbunden",
                description=f"{account.platform.title()}-Konto erfolgreich verbunden",
                time=time_str,
                platform=account.platform,
            )
        )

    # Sort by most recent
    recent_activities = sorted(recent_activities, key=lambda x: x.time, reverse=False)[
        :5
    ]

    return DashboardResponse(
        stats=DashboardStatsResponse(
            connected_accounts=connected_accounts,
            published_posts=published_posts,
            scheduled_posts=scheduled_posts,
            pending_posts=pending_posts,
            total_reach=total_reach,
            engagement_rate=round(engagement_rate, 1),
            reach_change=round(reach_change, 1),
            posts_change=round(posts_change, 1),
            engagement_change=round(engagement_change, 1),
        ),
        recent_activities=recent_activities,
    )


def _format_time_ago(time_diff: timedelta) -> str:
    """Format a timedelta as a human-readable 'time ago' string"""
    seconds = time_diff.total_seconds()

    if seconds < 60:
        return "gerade eben"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"vor {minutes} Minute{'n' if minutes != 1 else ''}"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"vor {hours} Stunde{'n' if hours != 1 else ''}"
    elif seconds < 604800:
        days = int(seconds / 86400)
        if days == 1:
            return "gestern"
        return f"vor {days} Tagen"
    else:
        weeks = int(seconds / 604800)
        return f"vor {weeks} Woche{'n' if weeks != 1 else ''}"


@router.get("/analytics", response_model=SocialAnalyticsResponse)
async def get_social_analytics(
    period: Optional[str] = Query(None, description="Period: 7d, 30d, 90d, 1y"),
    platform: Optional[str] = Query(None, description="Platform filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Get social media analytics"""
    from datetime import datetime, timedelta
    from django.utils import timezone

    # Calculate date range from period
    now = timezone.now()
    period_days = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
    }
    days = period_days.get(period, 30)
    start_date = (now - timedelta(days=days)).isoformat()
    end_date = now.isoformat()

    social_service = SocialService(tenant_id)
    analytics = await social_service.get_analytics(
        start_date=start_date, end_date=end_date, platform=platform
    )

    return analytics


# ============================================================================
# Scheduled Posts & Queue Endpoints
# ============================================================================


class ScheduledPostResponse(BaseModel):
    """Response for scheduled post"""

    id: str
    content: str
    platforms: List[str]
    scheduled_at: str
    status: str
    media_urls: Optional[List[str]] = []
    created_at: str


class QueueItemResponse(BaseModel):
    """Response for queue item"""

    id: str
    content: str
    platforms: List[str]
    scheduled_at: str
    status: str
    priority: Optional[str] = "medium"
    retry_count: int = 0
    error: Optional[str] = None
    created_at: str


@router.get("/posts/scheduled", response_model=List[ScheduledPostResponse])
async def get_scheduled_posts(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Get all scheduled posts"""
    from communications.models import SocialPost
    from django.utils import timezone

    now = timezone.now()

    scheduled_posts = SocialPost.objects.filter(
        tenant_id=tenant_id,
        status__in=["scheduled", "published", "failed"],
        scheduled_at__isnull=False,
    ).order_by("scheduled_at")

    results = []
    async for post in scheduled_posts:
        # Parse platforms - it might be stored as a JSON string or list
        platforms = []
        if post.platform:
            if isinstance(post.platform, list):
                platforms = post.platform
            elif isinstance(post.platform, str):
                # Could be JSON array or single platform
                if post.platform.startswith("["):
                    import json

                    try:
                        platforms = json.loads(post.platform)
                    except:
                        platforms = [post.platform]
                else:
                    platforms = [post.platform]

        results.append(
            ScheduledPostResponse(
                id=str(post.id),
                content=post.content or "",
                platforms=platforms,
                scheduled_at=post.scheduled_at.isoformat() if post.scheduled_at else "",
                status=post.status or "scheduled",
                media_urls=post.media_urls or [],
                created_at=post.created_at.isoformat() if post.created_at else "",
            )
        )

    return results


@router.get("/posts/queue", response_model=List[QueueItemResponse])
async def get_post_queue(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Get post queue with status"""
    from communications.models import SocialPost
    from django.utils import timezone

    # Get posts in queue (scheduled for future or in processing)
    queue_posts = SocialPost.objects.filter(
        tenant_id=tenant_id,
        status__in=["scheduled", "processing", "failed", "pending"],
    ).order_by("scheduled_at", "-priority", "-created_at")

    results = []
    async for post in queue_posts:
        # Parse platforms
        platforms = []
        if post.platform:
            if isinstance(post.platform, list):
                platforms = post.platform
            elif isinstance(post.platform, str):
                if post.platform.startswith("["):
                    import json

                    try:
                        platforms = json.loads(post.platform)
                    except:
                        platforms = [post.platform]
                else:
                    platforms = [post.platform]

        # Map status to queue status
        queue_status = post.status
        if post.status == "pending":
            queue_status = "queued"

        results.append(
            QueueItemResponse(
                id=str(post.id),
                content=post.content or "",
                platforms=platforms,
                scheduled_at=(
                    post.scheduled_at.isoformat()
                    if post.scheduled_at
                    else (post.created_at.isoformat() if post.created_at else "")
                ),
                status=queue_status,
                priority=getattr(post, "priority", "medium") or "medium",
                retry_count=getattr(post, "retry_count", 0) or 0,
                error=getattr(post, "error_message", None),
                created_at=post.created_at.isoformat() if post.created_at else "",
            )
        )

    return results


@router.get("/posts/{post_id}/analytics", response_model=PostAnalyticsResponse)
async def get_post_analytics(
    post_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
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
    tenant_id: str = Depends(get_tenant_id),
):
    """Get social media posting queue"""

    social_service = SocialService(tenant_id)
    queue = await social_service.get_queue()

    return queue
