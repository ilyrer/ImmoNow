"""
Rate Limiting Module
"""
import time
from typing import Dict, Optional
from collections import defaultdict, deque
from threading import Lock

from app.core.settings import settings
from app.core.errors import RateLimitError


class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.lock = Lock()
        self.max_requests = settings.RATE_LIMIT_REQUESTS
        self.window_seconds = settings.RATE_LIMIT_WINDOW
    
    def is_allowed(self, key: str) -> bool:
        """Check if request is allowed for given key"""
        current_time = time.time()
        
        with self.lock:
            # Clean old requests
            while self.requests[key] and self.requests[key][0] <= current_time - self.window_seconds:
                self.requests[key].popleft()
            
            # Check if under limit
            if len(self.requests[key]) < self.max_requests:
                self.requests[key].append(current_time)
                return True
            
            return False
    
    def get_retry_after(self, key: str) -> int:
        """Get retry after seconds for given key"""
        if not self.requests[key]:
            return 0
        
        oldest_request = self.requests[key][0]
        retry_after = int(oldest_request + self.window_seconds - time.time())
        return max(0, retry_after)


# Global rate limiter
rate_limiter = RateLimiter()


def check_rate_limit(key: str) -> None:
    """Check rate limit and raise exception if exceeded"""
    if not rate_limiter.is_allowed(key):
        retry_after = rate_limiter.get_retry_after(key)
        raise RateLimitError(f"Rate limit exceeded. Try again in {retry_after} seconds")
