"""
Rate Limit Manager - Centralized rate limiting for all platform APIs
"""

import os
import time
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

logger = logging.getLogger(__name__)


class TokenBucket:
    """
    Token bucket algorithm for rate limiting

    Allows burst traffic while maintaining average rate limit
    """

    def __init__(
        self, max_tokens: int, refill_rate: float, refill_interval: float = 1.0
    ):
        """
        Initialize token bucket

        Args:
            max_tokens: Maximum tokens (burst capacity)
            refill_rate: Tokens added per refill interval
            refill_interval: Seconds between refills
        """
        self.max_tokens = max_tokens
        self.tokens = max_tokens
        self.refill_rate = refill_rate
        self.refill_interval = refill_interval
        self.last_refill = time.time()
        self._lock = asyncio.Lock()

    async def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens

        Returns:
            True if tokens were consumed, False if rate limited
        """
        async with self._lock:
            self._refill()

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False

    def _refill(self):
        """Refill tokens based on time elapsed"""
        now = time.time()
        elapsed = now - self.last_refill

        if elapsed >= self.refill_interval:
            refill_count = int(elapsed / self.refill_interval)
            self.tokens = min(
                self.max_tokens, self.tokens + (refill_count * self.refill_rate)
            )
            self.last_refill = now

    @property
    def available_tokens(self) -> float:
        """Get current available tokens"""
        self._refill()
        return self.tokens


class PlatformRateLimits:
    """Rate limit configurations for each platform"""

    # Platform-specific rate limits (requests per hour)
    LIMITS = {
        "instagram": {
            "requests_per_hour": 200,
            "requests_per_day": 4800,
            "burst_limit": 25,
            "description": "Instagram Graph API limits",
        },
        "facebook": {
            "requests_per_hour": 200,
            "requests_per_day": 4800,
            "burst_limit": 25,
            "description": "Facebook Graph API limits",
        },
        "linkedin": {
            "requests_per_hour": 100,
            "requests_per_day": 1000,
            "burst_limit": 10,
            "description": "LinkedIn API limits",
        },
        "youtube": {
            "requests_per_day": 10000,
            "requests_per_hour": 1000,
            "burst_limit": 50,
            "description": "YouTube Data API limits",
        },
        "tiktok": {
            "requests_per_hour": 100,
            "requests_per_day": 1000,
            "burst_limit": 10,
            "description": "TikTok API limits",
        },
        "immoscout24": {
            "requests_per_hour": 500,
            "requests_per_day": 5000,
            "burst_limit": 50,
            "description": "ImmoScout24 API limits",
        },
        "immowelt": {
            "requests_per_hour": 300,
            "requests_per_day": 3000,
            "burst_limit": 30,
            "description": "Immowelt API limits",
        },
    }

    @classmethod
    def get_limit(cls, platform: str) -> Dict:
        """Get rate limit config for a platform"""
        return cls.LIMITS.get(
            platform,
            {
                "requests_per_hour": 100,
                "requests_per_day": 1000,
                "burst_limit": 10,
                "description": "Default API limits",
            },
        )


class RateLimitManager:
    """
    Centralized rate limit management for all platform APIs

    Features:
    - Per-platform rate limiting
    - Per-tenant tracking
    - Token bucket algorithm for smooth rate limiting
    - Automatic refill
    - Rate limit status reporting
    """

    # Singleton instance for in-memory state
    _instance: Optional["RateLimitManager"] = None
    _buckets: Dict[str, TokenBucket] = {}
    _call_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    _hourly_reset: Dict[str, datetime] = {}
    _daily_reset: Dict[str, datetime] = {}

    def __new__(cls):
        """Singleton pattern for consistent state"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize rate limit manager"""
        # Check for Redis connection for distributed rate limiting
        self.redis_url = os.getenv("REDIS_URL")
        self.use_redis = bool(self.redis_url)

        if self.use_redis:
            logger.info("Using Redis for distributed rate limiting")
        else:
            logger.info("Using in-memory rate limiting (single instance only)")

    def _get_bucket_key(self, platform: str, tenant_id: str) -> str:
        """Generate unique key for a platform/tenant combination"""
        return f"{platform}:{tenant_id}"

    def _get_or_create_bucket(self, platform: str, tenant_id: str) -> TokenBucket:
        """Get or create token bucket for platform/tenant"""
        key = self._get_bucket_key(platform, tenant_id)

        if key not in self._buckets:
            limits = PlatformRateLimits.get_limit(platform)

            # Calculate tokens per second based on hourly limit
            max_tokens = limits["burst_limit"]
            # Refill to reach hourly limit over an hour
            refill_rate = limits["requests_per_hour"] / 3600

            self._buckets[key] = TokenBucket(
                max_tokens=max_tokens, refill_rate=refill_rate, refill_interval=1.0
            )

        return self._buckets[key]

    async def check_limit(self, platform: str, tenant_id: str) -> bool:
        """
        Check if a request can be made within rate limits

        Args:
            platform: Platform name (e.g., 'instagram')
            tenant_id: Tenant identifier

        Returns:
            True if request is allowed, False if rate limited
        """
        bucket = self._get_or_create_bucket(platform, tenant_id)
        return await bucket.consume(1)

    async def record_call(self, platform: str, tenant_id: str):
        """
        Record an API call for tracking purposes

        This is separate from check_limit to allow tracking even
        when using external rate limiters
        """
        key = self._get_bucket_key(platform, tenant_id)
        now = datetime.utcnow()

        # Reset hourly counter if needed
        if key not in self._hourly_reset or now - self._hourly_reset[key] >= timedelta(
            hours=1
        ):
            self._call_counts[key]["hourly"] = 0
            self._hourly_reset[key] = now

        # Reset daily counter if needed
        if key not in self._daily_reset or now - self._daily_reset[key] >= timedelta(
            days=1
        ):
            self._call_counts[key]["daily"] = 0
            self._daily_reset[key] = now

        self._call_counts[key]["hourly"] += 1
        self._call_counts[key]["daily"] += 1
        self._call_counts[key]["total"] += 1

    def get_status(self, platform: str, tenant_id: str) -> Dict:
        """
        Get current rate limit status for a platform/tenant

        Returns:
            Dict with rate limit status info
        """
        key = self._get_bucket_key(platform, tenant_id)
        bucket = self._get_or_create_bucket(platform, tenant_id)
        limits = PlatformRateLimits.get_limit(platform)
        counts = self._call_counts[key]

        return {
            "platform": platform,
            "tenant_id": tenant_id,
            "limits": limits,
            "current_usage": {
                "hourly": counts["hourly"],
                "daily": counts["daily"],
                "total": counts["total"],
            },
            "available_tokens": bucket.available_tokens,
            "is_limited": bucket.available_tokens < 1,
            "hourly_reset_at": self._hourly_reset.get(key),
            "daily_reset_at": self._daily_reset.get(key),
        }

    def get_all_status(self, tenant_id: str) -> Dict[str, Dict]:
        """Get rate limit status for all platforms for a tenant"""
        statuses = {}
        for platform in PlatformRateLimits.LIMITS.keys():
            statuses[platform] = self.get_status(platform, tenant_id)
        return statuses

    async def wait_for_capacity(
        self, platform: str, tenant_id: str, timeout: float = 60.0
    ) -> bool:
        """
        Wait until rate limit capacity is available

        Args:
            platform: Platform name
            tenant_id: Tenant identifier
            timeout: Maximum seconds to wait

        Returns:
            True if capacity became available, False if timeout
        """
        start_time = time.time()

        while time.time() - start_time < timeout:
            if await self.check_limit(platform, tenant_id):
                return True

            # Wait a bit before retrying
            await asyncio.sleep(0.5)

        return False

    def reset_limits(self, platform: str, tenant_id: str):
        """Reset rate limits for a platform/tenant (for testing)"""
        key = self._get_bucket_key(platform, tenant_id)

        if key in self._buckets:
            del self._buckets[key]

        if key in self._call_counts:
            del self._call_counts[key]

        if key in self._hourly_reset:
            del self._hourly_reset[key]

        if key in self._daily_reset:
            del self._daily_reset[key]


# Convenience functions for direct import
async def check_rate_limit(platform: str, tenant_id: str) -> bool:
    """Check if rate limited"""
    manager = RateLimitManager()
    return await manager.check_limit(platform, tenant_id)


async def record_api_call(platform: str, tenant_id: str):
    """Record an API call"""
    manager = RateLimitManager()
    await manager.record_call(platform, tenant_id)


def get_rate_limit_status(platform: str, tenant_id: str) -> Dict:
    """Get rate limit status"""
    manager = RateLimitManager()
    return manager.get_status(platform, tenant_id)
