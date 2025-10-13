"""
Social Hub Pydantic Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

from app.schemas.common import PaginatedResponse


class SocialPlatform(str, Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"


class PostStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PostType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    CAROUSEL = "carousel"
    STORY = "story"
    REEL = "reel"


class SocialAccountResponse(BaseModel):
    """Social media account response"""
    id: str
    platform: SocialPlatform
    account_name: str
    account_id: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    is_active: bool
    last_sync: Optional[datetime] = None
    follower_count: Optional[int] = None
    following_count: Optional[int] = None
    post_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SocialPostResponse(BaseModel):
    """Social media post response"""
    id: str
    account_id: str
    platform: SocialPlatform
    content: str
    post_type: PostType
    media_urls: List[str] = Field(default_factory=list)
    status: PostStatus
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    engagement_metrics: Optional[Dict[str, Any]] = None
    hashtags: List[str] = Field(default_factory=list)
    mentions: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CreatePostRequest(BaseModel):
    """Create social media post request"""
    account_ids: List[str]
    content: str
    post_type: PostType = PostType.TEXT
    media_urls: List[str] = Field(default_factory=list)
    scheduled_at: Optional[datetime] = None
    hashtags: List[str] = Field(default_factory=list)
    mentions: List[str] = Field(default_factory=list)


class UpdatePostRequest(BaseModel):
    """Update social media post request"""
    content: Optional[str] = None
    post_type: Optional[PostType] = None
    media_urls: Optional[List[str]] = None
    scheduled_at: Optional[datetime] = None
    hashtags: Optional[List[str]] = None
    mentions: Optional[List[str]] = None


class SocialAnalyticsResponse(BaseModel):
    """Social media analytics response"""
    total_posts: int
    posts_by_platform: Dict[str, int]
    posts_by_status: Dict[str, int]
    total_engagement: int
    average_engagement_rate: float
    top_performing_posts: List[SocialPostResponse]
    engagement_trend: List[Dict[str, Any]]
    follower_growth: List[Dict[str, Any]]
    best_posting_times: Dict[str, List[int]]
    
    model_config = ConfigDict(from_attributes=True)


class PostAnalyticsResponse(BaseModel):
    """Individual post analytics response"""
    post_id: str
    platform: SocialPlatform
    impressions: int
    reach: int
    likes: int
    comments: int
    shares: int
    saves: int
    clicks: int
    engagement_rate: float
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SocialQueueResponse(BaseModel):
    """Social media queue response"""
    scheduled_posts: List[SocialPostResponse]
    failed_posts: List[SocialPostResponse]
    next_post: Optional[SocialPostResponse] = None
    queue_length: int
    
    model_config = ConfigDict(from_attributes=True)
