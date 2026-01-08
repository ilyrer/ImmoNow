"""
Social Service
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from asgiref.sync import sync_to_async
from cryptography.fernet import Fernet
import httpx

from communications.models import SocialAccount, SocialPost
from accounts.models import Tenant, User
from app.schemas.social import (
    SocialAccountResponse, SocialPostResponse, SocialAnalyticsResponse,
    PostAnalyticsResponse, SocialQueueResponse, CreatePostRequest,
    UpdatePostRequest
)
from app.core.errors import NotFoundError, ValidationError
from app.services.audit import AuditService

logger = logging.getLogger(__name__)


class SocialService:
    """Service for managing social media accounts and posts"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.audit_service = AuditService(tenant_id)
        
        # Initialize encryption
        encryption_key = os.getenv('SOCIAL_ENCRYPTION_KEY')
        if not encryption_key:
            # Generate a new key if not set (for development)
            encryption_key = Fernet.generate_key().decode()
            logger.warning("SOCIAL_ENCRYPTION_KEY not set, using generated key")
        
        self.cipher = Fernet(encryption_key.encode())
    
    def _encrypt_token(self, token: str) -> str:
        """Encrypt social media token"""
        return self.cipher.encrypt(token.encode()).decode()
    
    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt social media token"""
        return self.cipher.decrypt(encrypted_token.encode()).decode()
    
    async def get_accounts(
        self,
        platform: Optional[str] = None
    ) -> List[SocialAccountResponse]:
        """Get social media accounts"""
        
        queryset = SocialAccount.objects.filter(tenant_id=self.tenant_id, is_active=True)
        
        if platform:
            queryset = queryset.filter(platform=platform)
        
        accounts = await sync_to_async(list)(queryset)
        
        account_responses = []
        for account in accounts:
            account_responses.append(SocialAccountResponse(
                id=str(account.id),
                platform=account.platform,
                account_name=account.account_name,
                account_id=account.account_id,
                is_active=account.is_active,
                last_sync=account.last_sync_at,
                follower_count=None,  # Would be fetched from platform API
                following_count=None,
                post_count=None,
                created_at=account.created_at,
                updated_at=account.created_at  # Would use updated_at field
            ))
        
        return account_responses
    
    async def connect_account(
        self,
        platform: str,
        access_token: str,
        account_id: str,
        user_id: str
    ) -> SocialAccountResponse:
        """Connect a social media account"""
        
        # Encrypt tokens
        encrypted_access_token = self._encrypt_token(access_token)
        
        # Get account info from platform API (stub)
        account_name = await self._get_account_name_from_platform(platform, access_token, account_id)
        
        # Create account in database
        account = await sync_to_async(SocialAccount.objects.create)(
            tenant_id=self.tenant_id,
            platform=platform,
            account_id=account_id,
            account_name=account_name,
            access_token=encrypted_access_token,
            created_by_id=user_id,
            is_active=True
        )
        
        # Log account connection
        await self.audit_service.audit_action(
            user_id=user_id,
            action='connect_social_account',
            resource_type='social_account',
            resource_id=str(account.id),
            description=f'Connected {platform} account'
        )
        
        return SocialAccountResponse(
            id=str(account.id),
            platform=account.platform,
            account_name=account.account_name,
            account_id=account.account_id,
            is_active=account.is_active,
            last_sync=account.last_sync_at,
            follower_count=None,
            following_count=None,
            post_count=None,
            created_at=account.created_at,
            updated_at=account.created_at
        )
    
    async def disconnect_account(
        self,
        account_id: str,
        user_id: str
    ) -> None:
        """Disconnect a social media account"""
        
        try:
            account = await sync_to_async(SocialAccount.objects.get)(
                id=account_id,
                tenant_id=self.tenant_id
            )
            
            # Deactivate instead of delete to preserve history
            await sync_to_async(account.__setattr__)('is_active', False)
            await sync_to_async(account.save)()
            
            # Log account disconnection
            await self.audit_service.audit_action(
                user_id=user_id,
                action='disconnect_social_account',
                resource_type='social_account',
                resource_id=str(account.id),
                description=f'Disconnected {account.platform} account'
            )
            
        except SocialAccount.DoesNotExist:
            raise NotFoundError("Social account not found")
    
    async def _get_account_name_from_platform(
        self,
        platform: str,
        access_token: str,
        account_id: str
    ) -> str:
        """Get account name from platform API (stub implementation)"""
        
        # In a real implementation, this would call the platform's API
        # For now, return a generic name
        platform_names = {
            'facebook': 'Facebook Page',
            'instagram': 'Instagram Account',
            'linkedin': 'LinkedIn Page',
            'twitter': 'Twitter Account'
        }
        
        return platform_names.get(platform, f"{platform.title()} Account")
    
    async def create_post(
        self,
        post_data: CreatePostRequest,
        user_id: str
    ) -> SocialPostResponse:
        """Create a social media post"""
        
        # Get accounts
        accounts = await sync_to_async(list)(
            SocialAccount.objects.filter(
                id__in=post_data.account_ids,
                tenant_id=self.tenant_id,
                is_active=True
            )
        )
        
        if not accounts:
            raise ValidationError("No valid accounts found")
        
        # Create post for each account
        posts = []
        for account in accounts:
            post = await sync_to_async(SocialPost.objects.create)(
                tenant_id=self.tenant_id,
                account=account,
                content=post_data.content,
                media_urls=post_data.media_urls,
                status='draft',
                scheduled_at=post_data.scheduled_at,
                created_by_id=user_id
            )
            posts.append(post)
        
        # Log post creation
        await self.audit_service.audit_action(
            user_id=user_id,
            action='create_social_post',
            resource_type='social_post',
            resource_id=str(posts[0].id),
            description=f'Created post for {len(accounts)} accounts'
        )
        
        # Return first post (in real app, might return all posts)
        first_post = posts[0]
        return SocialPostResponse(
            id=str(first_post.id),
            account_id=str(first_post.account.id),
            platform=first_post.account.platform,
            content=first_post.content,
            post_type='text',  # Would be determined from media_urls
            media_urls=first_post.media_urls,
            status=first_post.status,
            scheduled_at=first_post.scheduled_at,
            published_at=first_post.published_at,
            engagement_metrics=first_post.metrics,
            hashtags=[],  # Would be extracted from content
            mentions=[],  # Would be extracted from content
            created_at=first_post.created_at,
            updated_at=first_post.updated_at
        )
    
    async def get_posts(
        self,
        offset: int = 0,
        limit: int = 20,
        platform: Optional[str] = None,
        status: Optional[str] = None,
        account_id: Optional[str] = None
    ) -> tuple[List[SocialPostResponse], int]:
        """Get social media posts"""
        
        queryset = SocialPost.objects.filter(tenant_id=self.tenant_id)
        
        if platform:
            queryset = queryset.filter(account__platform=platform)
        
        if status:
            queryset = queryset.filter(status=status)
        
        if account_id:
            queryset = queryset.filter(account_id=account_id)
        
        total = await sync_to_async(queryset.count)()
        
        posts = await sync_to_async(list)(
            queryset.order_by('-created_at')[offset:offset + limit]
        )
        
        post_responses = []
        for post in posts:
            post_responses.append(SocialPostResponse(
                id=str(post.id),
                account_id=str(post.account.id),
                platform=post.account.platform,
                content=post.content,
                post_type='text',
                media_urls=post.media_urls,
                status=post.status,
                scheduled_at=post.scheduled_at,
                published_at=post.published_at,
                engagement_metrics=post.metrics,
                hashtags=[],
                mentions=[],
                created_at=post.created_at,
                updated_at=post.updated_at
            ))
        
        return post_responses, total
    
    async def get_post(self, post_id: str) -> Optional[SocialPostResponse]:
        """Get a specific social media post"""
        
        try:
            post = await sync_to_async(SocialPost.objects.get)(
                id=post_id,
                tenant_id=self.tenant_id
            )
            
            return SocialPostResponse(
                id=str(post.id),
                account_id=str(post.account.id),
                platform=post.account.platform,
                content=post.content,
                post_type='text',
                media_urls=post.media_urls,
                status=post.status,
                scheduled_at=post.scheduled_at,
                published_at=post.published_at,
                engagement_metrics=post.metrics,
                hashtags=[],
                mentions=[],
                created_at=post.created_at,
                updated_at=post.updated_at
            )
        except SocialPost.DoesNotExist:
            return None
    
    async def update_post(
        self,
        post_id: str,
        post_data: UpdatePostRequest,
        user_id: str
    ) -> Optional[SocialPostResponse]:
        """Update a social media post"""
        
        try:
            post = await sync_to_async(SocialPost.objects.get)(
                id=post_id,
                tenant_id=self.tenant_id
            )
            
            # Update fields
            if post_data.content is not None:
                await sync_to_async(post.__setattr__)('content', post_data.content)
            
            if post_data.media_urls is not None:
                await sync_to_async(post.__setattr__)('media_urls', post_data.media_urls)
            
            if post_data.scheduled_at is not None:
                await sync_to_async(post.__setattr__)('scheduled_at', post_data.scheduled_at)
            
            await sync_to_async(post.save)()
            
            # Log post update
            await self.audit_service.audit_action(
                user_id=user_id,
                action='update_social_post',
                resource_type='social_post',
                resource_id=str(post.id),
                description='Updated social media post'
            )
            
            return SocialPostResponse(
                id=str(post.id),
                account_id=str(post.account.id),
                platform=post.account.platform,
                content=post.content,
                post_type='text',
                media_urls=post.media_urls,
                status=post.status,
                scheduled_at=post.scheduled_at,
                published_at=post.published_at,
                engagement_metrics=post.metrics,
                hashtags=[],
                mentions=[],
                created_at=post.created_at,
                updated_at=post.updated_at
            )
            
        except SocialPost.DoesNotExist:
            return None
    
    async def delete_post(self, post_id: str, user_id: str) -> None:
        """Delete a social media post"""
        
        try:
            post = await sync_to_async(SocialPost.objects.get)(
                id=post_id,
                tenant_id=self.tenant_id
            )
            
            await sync_to_async(post.delete)()
            
            # Log post deletion
            await self.audit_service.audit_action(
                user_id=user_id,
                action='delete_social_post',
                resource_type='social_post',
                resource_id=str(post.id),
                description='Deleted social media post'
            )
            
        except SocialPost.DoesNotExist:
            raise NotFoundError("Social post not found")
    
    async def get_analytics(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        platform: Optional[str] = None
    ) -> SocialAnalyticsResponse:
        """Get social media analytics"""
        
        queryset = SocialPost.objects.filter(tenant_id=self.tenant_id)
        
        if platform:
            queryset = queryset.filter(account__platform=platform)
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        total_posts = await sync_to_async(queryset.count)()
        
        # Mock analytics data - in real app would calculate from actual metrics
        return SocialAnalyticsResponse(
            total_posts=total_posts,
            total_reach=15000,
            total_engagement=2500,
            engagement_rate=16.7,
            top_posts=[],
            platform_breakdown={
                "facebook": {"posts": 10, "reach": 5000, "engagement": 800},
                "instagram": {"posts": 15, "reach": 7000, "engagement": 1200},
                "linkedin": {"posts": 8, "reach": 3000, "engagement": 500}
            },
            engagement_trend=[],
            reach_trend=[]
        )
    
    async def get_post_analytics(self, post_id: str) -> Optional[PostAnalyticsResponse]:
        """Get analytics for a specific post"""
        
        try:
            post = await sync_to_async(SocialPost.objects.get)(
                id=post_id,
                tenant_id=self.tenant_id
            )
            
            # Mock analytics - in real app would fetch from platform API
            return PostAnalyticsResponse(
                post_id=str(post.id),
                platform=post.account.platform,
                reach=1500,
                impressions=2000,
                engagement=250,
                likes=180,
                comments=45,
                shares=25,
                clicks=120,
                engagement_rate=16.7,
                created_at=post.created_at,
                updated_at=post.updated_at
            )
            
        except SocialPost.DoesNotExist:
            return None
    
    async def get_queue(self) -> SocialQueueResponse:
        """Get social media posting queue"""
        
        # Get scheduled posts
        scheduled_posts = await sync_to_async(list)(
            SocialPost.objects.filter(
                tenant_id=self.tenant_id,
                status='scheduled',
                scheduled_at__isnull=False
            ).order_by('scheduled_at')
        )
        
        queue_items = []
        for post in scheduled_posts:
            queue_items.append({
                "id": str(post.id),
                "content": post.content[:100] + "..." if len(post.content) > 100 else post.content,
                "platform": post.account.platform,
                "account_name": post.account.account_name,
                "scheduled_at": post.scheduled_at,
                "status": post.status
            })
        
        return SocialQueueResponse(
            total_scheduled=len(queue_items),
            next_post_at=scheduled_posts[0].scheduled_at if scheduled_posts else None,
            queue_items=queue_items
        )