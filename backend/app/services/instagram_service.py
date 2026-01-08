"""
Instagram Service - Meta Graph API integration for Instagram
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx
from asgiref.sync import sync_to_async
from cryptography.fernet import Fernet

from communications.models import SocialAccount, SocialPost
from app.core.errors import ValidationError, ExternalServiceError
from app.services.rate_limit_manager import RateLimitManager

logger = logging.getLogger(__name__)


class InstagramService:
    """
    Service for Instagram API integration via Meta Graph API

    Supports:
    - Publishing posts (images, carousels, reels)
    - Fetching insights/analytics
    - Managing comments
    - Getting account info
    """

    GRAPH_API_BASE = "https://graph.instagram.com"
    GRAPH_API_VERSION = "v18.0"

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.rate_limiter = RateLimitManager()

        # Initialize encryption
        encryption_key = os.getenv("SOCIAL_ENCRYPTION_KEY")
        if not encryption_key:
            encryption_key = Fernet.generate_key().decode()
            logger.warning("SOCIAL_ENCRYPTION_KEY not set, using generated key")

        self.cipher = Fernet(
            encryption_key.encode()
            if isinstance(encryption_key, str)
            else encryption_key
        )

    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt stored access token"""
        return self.cipher.decrypt(encrypted_token.encode()).decode()

    async def _get_access_token(self, account: SocialAccount) -> str:
        """Get decrypted access token, refreshing if needed"""
        # Check if token is expired
        if account.token_expires_at and account.token_expires_at < datetime.utcnow():
            # Token needs refresh
            from app.services.oauth_service import OAuthService

            oauth_service = OAuthService(self.tenant_id)
            account = await oauth_service.refresh_token(account)

        return self._decrypt_token(account.access_token)

    async def get_account_insights(
        self, account: SocialAccount, metrics: List[str] = None, period: str = "day"
    ) -> Dict[str, Any]:
        """
        Get Instagram account insights

        Args:
            account: SocialAccount instance
            metrics: List of metrics to fetch (default: common metrics)
            period: Time period ('day', 'week', 'days_28', 'lifetime')

        Returns:
            Dict with insights data
        """
        if metrics is None:
            metrics = [
                "impressions",
                "reach",
                "profile_views",
                "follower_count",
                "email_contacts",
                "website_clicks",
            ]

        # Check rate limit
        if not await self.rate_limiter.check_limit("instagram", self.tenant_id):
            raise ExternalServiceError(
                "Instagram API rate limit exceeded. Please try again later."
            )

        access_token = await self._get_access_token(account)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.GRAPH_API_BASE}/{account.account_id}/insights",
                params={
                    "metric": ",".join(metrics),
                    "period": period,
                    "access_token": access_token,
                },
            )

            # Record API call for rate limiting
            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                logger.error(f"Instagram insights fetch failed: {response.text}")
                raise ExternalServiceError(
                    f"Failed to fetch Instagram insights: {response.text}"
                )

            data = response.json()

            # Parse insights into readable format
            insights = {}
            for item in data.get("data", []):
                name = item.get("name")
                values = item.get("values", [])
                if values:
                    insights[name] = values[-1].get("value", 0)

            return insights

    async def get_media_insights(
        self, account: SocialAccount, media_id: str
    ) -> Dict[str, Any]:
        """Get insights for a specific media post"""
        if not await self.rate_limiter.check_limit("instagram", self.tenant_id):
            raise ExternalServiceError("Instagram API rate limit exceeded")

        access_token = await self._get_access_token(account)

        metrics = [
            "engagement",
            "impressions",
            "reach",
            "saved",
            "likes",
            "comments",
            "shares",
        ]

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.GRAPH_API_BASE}/{media_id}/insights",
                params={
                    "metric": ",".join(metrics),
                    "access_token": access_token,
                },
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                logger.error(f"Media insights fetch failed: {response.text}")
                return {}

            data = response.json()
            insights = {}
            for item in data.get("data", []):
                insights[item.get("name")] = item.get("values", [{}])[0].get("value", 0)

            return insights

    async def publish_image_post(
        self,
        account: SocialAccount,
        image_url: str,
        caption: str,
        location_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Publish a single image post to Instagram

        Args:
            account: SocialAccount instance
            image_url: Public URL of the image
            caption: Post caption (including hashtags)
            location_id: Optional Facebook location ID

        Returns:
            Dict with created media info
        """
        if not await self.rate_limiter.check_limit("instagram", self.tenant_id):
            raise ExternalServiceError("Instagram API rate limit exceeded")

        access_token = await self._get_access_token(account)

        async with httpx.AsyncClient() as client:
            # Step 1: Create media container
            container_params = {
                "image_url": image_url,
                "caption": caption,
                "access_token": access_token,
            }
            if location_id:
                container_params["location_id"] = location_id

            response = await client.post(
                f"{self.GRAPH_API_BASE}/{account.account_id}/media",
                data=container_params,
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                logger.error(f"Instagram container creation failed: {response.text}")
                raise ExternalServiceError(
                    f"Failed to create media container: {response.text}"
                )

            container_data = response.json()
            container_id = container_data.get("id")

            # Step 2: Publish the container
            response = await client.post(
                f"{self.GRAPH_API_BASE}/{account.account_id}/media_publish",
                data={
                    "creation_id": container_id,
                    "access_token": access_token,
                },
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                logger.error(f"Instagram publish failed: {response.text}")
                raise ExternalServiceError(f"Failed to publish post: {response.text}")

            publish_data = response.json()

            return {
                "media_id": publish_data.get("id"),
                "container_id": container_id,
                "status": "published",
            }

    async def publish_carousel_post(
        self,
        account: SocialAccount,
        media_urls: List[str],
        caption: str,
        location_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Publish a carousel post with multiple images

        Args:
            account: SocialAccount instance
            media_urls: List of public image URLs (2-10 items)
            caption: Post caption
            location_id: Optional location ID

        Returns:
            Dict with created media info
        """
        if len(media_urls) < 2 or len(media_urls) > 10:
            raise ValidationError("Carousel must have between 2 and 10 images")

        if not await self.rate_limiter.check_limit("instagram", self.tenant_id):
            raise ExternalServiceError("Instagram API rate limit exceeded")

        access_token = await self._get_access_token(account)

        async with httpx.AsyncClient() as client:
            # Step 1: Create container for each image
            children_ids = []
            for url in media_urls:
                response = await client.post(
                    f"{self.GRAPH_API_BASE}/{account.account_id}/media",
                    data={
                        "image_url": url,
                        "is_carousel_item": "true",
                        "access_token": access_token,
                    },
                )

                await self.rate_limiter.record_call("instagram", self.tenant_id)

                if response.status_code != 200:
                    logger.error(f"Carousel item creation failed: {response.text}")
                    raise ExternalServiceError(
                        f"Failed to create carousel item: {response.text}"
                    )

                children_ids.append(response.json().get("id"))

            # Step 2: Create carousel container
            carousel_params = {
                "media_type": "CAROUSEL",
                "children": ",".join(children_ids),
                "caption": caption,
                "access_token": access_token,
            }
            if location_id:
                carousel_params["location_id"] = location_id

            response = await client.post(
                f"{self.GRAPH_API_BASE}/{account.account_id}/media",
                data=carousel_params,
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                logger.error(f"Carousel container creation failed: {response.text}")
                raise ExternalServiceError(
                    f"Failed to create carousel container: {response.text}"
                )

            container_id = response.json().get("id")

            # Step 3: Publish the carousel
            response = await client.post(
                f"{self.GRAPH_API_BASE}/{account.account_id}/media_publish",
                data={
                    "creation_id": container_id,
                    "access_token": access_token,
                },
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                logger.error(f"Carousel publish failed: {response.text}")
                raise ExternalServiceError(
                    f"Failed to publish carousel: {response.text}"
                )

            return {
                "media_id": response.json().get("id"),
                "container_id": container_id,
                "children_count": len(children_ids),
                "status": "published",
            }

    async def publish_reel(
        self,
        account: SocialAccount,
        video_url: str,
        caption: str,
        cover_url: Optional[str] = None,
        share_to_feed: bool = True,
    ) -> Dict[str, Any]:
        """
        Publish a Reel to Instagram

        Args:
            account: SocialAccount instance
            video_url: Public URL of the video
            caption: Reel caption
            cover_url: Optional cover image URL
            share_to_feed: Whether to share to main feed

        Returns:
            Dict with created media info
        """
        if not await self.rate_limiter.check_limit("instagram", self.tenant_id):
            raise ExternalServiceError("Instagram API rate limit exceeded")

        access_token = await self._get_access_token(account)

        async with httpx.AsyncClient(timeout=120.0) as client:
            # Step 1: Create reel container
            container_params = {
                "media_type": "REELS",
                "video_url": video_url,
                "caption": caption,
                "share_to_feed": str(share_to_feed).lower(),
                "access_token": access_token,
            }
            if cover_url:
                container_params["cover_url"] = cover_url

            response = await client.post(
                f"{self.GRAPH_API_BASE}/{account.account_id}/media",
                data=container_params,
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                logger.error(f"Reel container creation failed: {response.text}")
                raise ExternalServiceError(
                    f"Failed to create reel container: {response.text}"
                )

            container_id = response.json().get("id")

            # Step 2: Wait for video processing (poll status)
            status = "IN_PROGRESS"
            max_attempts = 30
            attempts = 0

            while status == "IN_PROGRESS" and attempts < max_attempts:
                import asyncio

                await asyncio.sleep(5)

                response = await client.get(
                    f"{self.GRAPH_API_BASE}/{container_id}",
                    params={
                        "fields": "status_code",
                        "access_token": access_token,
                    },
                )

                if response.status_code == 200:
                    status = response.json().get("status_code", "FINISHED")

                attempts += 1

            if status != "FINISHED":
                raise ExternalServiceError(
                    f"Video processing failed with status: {status}"
                )

            # Step 3: Publish the reel
            response = await client.post(
                f"{self.GRAPH_API_BASE}/{account.account_id}/media_publish",
                data={
                    "creation_id": container_id,
                    "access_token": access_token,
                },
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                logger.error(f"Reel publish failed: {response.text}")
                raise ExternalServiceError(f"Failed to publish reel: {response.text}")

            return {
                "media_id": response.json().get("id"),
                "container_id": container_id,
                "type": "reel",
                "status": "published",
            }

    async def get_recent_media(
        self, account: SocialAccount, limit: int = 25
    ) -> List[Dict[str, Any]]:
        """Get recent media posts from account"""
        if not await self.rate_limiter.check_limit("instagram", self.tenant_id):
            raise ExternalServiceError("Instagram API rate limit exceeded")

        access_token = await self._get_access_token(account)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.GRAPH_API_BASE}/{account.account_id}/media",
                params={
                    "fields": "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
                    "limit": limit,
                    "access_token": access_token,
                },
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                logger.error(f"Failed to fetch recent media: {response.text}")
                return []

            return response.json().get("data", [])

    async def get_hashtag_search(
        self, account: SocialAccount, hashtag: str
    ) -> Dict[str, Any]:
        """Search for hashtag and get top/recent media"""
        if not await self.rate_limiter.check_limit("instagram", self.tenant_id):
            raise ExternalServiceError("Instagram API rate limit exceeded")

        access_token = await self._get_access_token(account)

        async with httpx.AsyncClient() as client:
            # First, get hashtag ID
            response = await client.get(
                f"{self.GRAPH_API_BASE}/ig_hashtag_search",
                params={
                    "user_id": account.account_id,
                    "q": hashtag.lstrip("#"),
                    "access_token": access_token,
                },
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            if response.status_code != 200:
                return {"hashtag": hashtag, "top_media": [], "recent_media": []}

            hashtag_data = response.json().get("data", [])
            if not hashtag_data:
                return {"hashtag": hashtag, "top_media": [], "recent_media": []}

            hashtag_id = hashtag_data[0].get("id")

            # Get top media for hashtag
            response = await client.get(
                f"{self.GRAPH_API_BASE}/{hashtag_id}/top_media",
                params={
                    "user_id": account.account_id,
                    "fields": "id,caption,media_type,permalink",
                    "access_token": access_token,
                },
            )

            await self.rate_limiter.record_call("instagram", self.tenant_id)

            top_media = (
                response.json().get("data", []) if response.status_code == 200 else []
            )

            return {
                "hashtag": hashtag,
                "hashtag_id": hashtag_id,
                "top_media": top_media,
            }

    async def update_social_post_metrics(
        self, post: SocialPost, account: SocialAccount
    ) -> SocialPost:
        """Update metrics for a social post from Instagram API"""
        if not post.platform_post_id:
            return post

        insights = await self.get_media_insights(account, post.platform_post_id)

        post.metrics = {
            "likes": insights.get("likes", 0),
            "comments": insights.get("comments", 0),
            "shares": insights.get("shares", 0),
            "saves": insights.get("saved", 0),
            "reach": insights.get("reach", 0),
            "impressions": insights.get("impressions", 0),
            "engagement": insights.get("engagement", 0),
            "last_updated": datetime.utcnow().isoformat(),
        }

        await sync_to_async(post.save)()

        return post
