"""
Social Publisher Task

Publishes scheduled social media posts when their scheduled time arrives.
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any
from asgiref.sync import sync_to_async

from app.db.models import SocialPost, SocialAccount
from app.services.instagram_service import InstagramService
from app.services.rate_limit_manager import RateLimitManager
from app.core.errors import ExternalServiceError

logger = logging.getLogger(__name__)

# Celery availability check
try:
    from celery import shared_task

    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False

    def shared_task(func=None, **kwargs):
        def decorator(f):
            return f

        if func:
            return decorator(func)
        return decorator


class SocialPublisher:
    """
    Handles publishing scheduled social media posts

    Features:
    - Publishes posts when scheduled time arrives
    - Supports multiple platforms
    - Respects rate limits
    - Tracks publish status and errors
    """

    def __init__(self):
        self.rate_limiter = RateLimitManager()

    async def get_posts_to_publish(self) -> List[SocialPost]:
        """Get all posts that need to be published now"""
        now = datetime.utcnow()

        posts = await sync_to_async(list)(
            SocialPost.objects.filter(
                status="scheduled", scheduled_at__lte=now
            ).select_related("account", "account__tenant")
        )

        return posts

    async def publish_post(self, post: SocialPost) -> Dict[str, Any]:
        """
        Publish a single post to its platform

        Args:
            post: SocialPost to publish

        Returns:
            Dict with publish result
        """
        account = post.account
        platform = account.platform
        tenant_id = str(account.tenant_id)

        # Check rate limit
        if not await self.rate_limiter.check_limit(platform, tenant_id):
            return {
                "success": False,
                "error": "Rate limit exceeded",
                "retry_later": True,
            }

        try:
            if platform == "instagram":
                service = InstagramService(tenant_id)

                media_urls = post.media_urls or []

                if len(media_urls) == 0:
                    return {
                        "success": False,
                        "error": "Instagram posts require at least one image",
                    }
                elif len(media_urls) == 1:
                    # Single image post
                    result = await service.publish_image_post(
                        account=account, image_url=media_urls[0], caption=post.content
                    )
                else:
                    # Carousel post
                    result = await service.publish_carousel_post(
                        account=account, media_urls=media_urls, caption=post.content
                    )

                # Update post status
                post.status = "published"
                post.published_at = datetime.utcnow()
                post.platform_post_id = result.get("media_id")
                await sync_to_async(post.save)()

                await self.rate_limiter.record_call(platform, tenant_id)

                return {
                    "success": True,
                    "platform": platform,
                    "platform_post_id": result.get("media_id"),
                }

            elif platform == "facebook":
                # TODO: Implement Facebook publishing
                return {
                    "success": False,
                    "error": "Facebook publishing not yet implemented",
                }

            elif platform == "linkedin":
                # TODO: Implement LinkedIn publishing
                return {
                    "success": False,
                    "error": "LinkedIn publishing not yet implemented",
                }

            elif platform == "youtube":
                # TODO: Implement YouTube publishing
                return {
                    "success": False,
                    "error": "YouTube publishing not yet implemented",
                }

            elif platform == "tiktok":
                # TikTok posting is limited - return appropriate message
                return {
                    "success": False,
                    "error": "TikTok API posting requires verified partner status",
                }

            else:
                return {"success": False, "error": f"Unsupported platform: {platform}"}

        except ExternalServiceError as e:
            # Update post with error
            post.status = "failed"
            post.error_message = str(e)
            await sync_to_async(post.save)()

            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.exception(f"Unexpected error publishing post {post.id}")

            post.status = "failed"
            post.error_message = f"Unexpected error: {str(e)}"
            await sync_to_async(post.save)()

            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    async def run_publish_cycle(self) -> Dict[str, Any]:
        """
        Run a complete publish cycle for scheduled posts

        Returns:
            Summary of publish actions
        """
        logger.info("Starting social publish cycle")

        posts = await self.get_posts_to_publish()
        logger.info(f"Found {len(posts)} posts to publish")

        results = {
            "total_posts": len(posts),
            "successful": 0,
            "failed": 0,
            "rate_limited": 0,
            "details": [],
        }

        for post in posts:
            result = await self.publish_post(post)

            detail = {
                "post_id": str(post.id),
                "platform": post.account.platform,
                **result,
            }
            results["details"].append(detail)

            if result.get("success"):
                results["successful"] += 1
            elif result.get("retry_later"):
                results["rate_limited"] += 1
            else:
                results["failed"] += 1

        logger.info(
            f"Social publish cycle complete: "
            f"{results['successful']} successful, "
            f"{results['failed']} failed, "
            f"{results['rate_limited']} rate limited"
        )

        return results


# Celery task wrapper
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def publish_scheduled_posts(self):
    """
    Celery task: Publish all scheduled posts that are due

    Should be scheduled to run every minute via celery beat.
    """
    try:
        publisher = SocialPublisher()
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(publisher.run_publish_cycle())
        return result
    except Exception as exc:
        logger.exception("Social publish task failed")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def publish_single_post(self, post_id: str):
    """
    Celery task: Publish a specific post immediately

    Args:
        post_id: UUID of the post
    """
    try:

        async def _publish():
            post = await sync_to_async(
                SocialPost.objects.select_related("account", "account__tenant").get
            )(id=post_id)
            publisher = SocialPublisher()
            return await publisher.publish_post(post)

        loop = asyncio.get_event_loop()
        return loop.run_until_complete(_publish())

    except SocialPost.DoesNotExist:
        logger.error(f"Post {post_id} not found")
        return {"success": False, "error": "Post not found"}
    except Exception as exc:
        logger.exception(f"Publish task failed for post {post_id}")
        raise self.retry(exc=exc)


# Async versions for direct use
async def async_publish_scheduled_posts() -> Dict[str, Any]:
    """Async function for publishing scheduled posts"""
    publisher = SocialPublisher()
    return await publisher.run_publish_cycle()


async def async_publish_single_post(post_id: str) -> Dict[str, Any]:
    """Async function to publish a specific post immediately"""
    post = await sync_to_async(
        SocialPost.objects.select_related("account", "account__tenant").get
    )(id=post_id)
    publisher = SocialPublisher()
    return await publisher.publish_post(post)
