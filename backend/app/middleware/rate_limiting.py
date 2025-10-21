"""
Rate Limiting Middleware for API Protection
"""
import time
from typing import Dict, Optional
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class RateLimitingMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware to prevent API abuse
    """
    
    # Rate limits per endpoint (requests per minute)
    RATE_LIMITS = {
        'communications': {
            'conversations': 60,  # 60 requests per minute
            'messages': 120,      # 120 requests per minute
            'attachments': 20,    # 20 uploads per minute
            'reactions': 100,     # 100 reactions per minute
        },
        'default': 100,  # Default rate limit
    }
    
    def process_request(self, request):
        """Process incoming request for rate limiting"""
        
        # Skip rate limiting for non-API requests
        if not request.path.startswith('/api/'):
            return None
            
        # Skip rate limiting for OPTIONS requests (CORS)
        if request.method == 'OPTIONS':
            return None
            
        # Get client identifier (IP + User Agent hash for better identification)
        client_id = self._get_client_id(request)
        
        # Get rate limit for this endpoint
        rate_limit = self._get_rate_limit(request.path)
        
        # Check current request count
        current_count = self._get_request_count(client_id, request.path)
        
        if current_count >= rate_limit:
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'message': f'Maximum {rate_limit} requests per minute allowed',
                'retry_after': 60
            }, status=429)
        
        # Increment request count
        self._increment_request_count(client_id, request.path)
        
        return None
    
    def _get_client_id(self, request) -> str:
        """Get unique client identifier"""
        import hashlib
        
        # Get real IP address (considering proxies)
        ip_address = self._get_real_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create hash for better privacy and shorter keys
        client_string = f"{ip_address}:{user_agent}"
        return hashlib.md5(client_string.encode()).hexdigest()[:16]
    
    def _get_real_ip(self, request) -> str:
        """Get real IP address considering proxies and load balancers"""
        # Check for forwarded IP headers
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.META.get('HTTP_X_REAL_IP')
        if real_ip:
            return real_ip.strip()
        
        # Fallback to remote address
        return request.META.get('REMOTE_ADDR', '127.0.0.1')
    
    def _get_rate_limit(self, path: str) -> int:
        """Get rate limit for specific endpoint"""
        
        # Extract endpoint from path
        if '/communications/' in path:
            if '/conversations' in path:
                return self.RATE_LIMITS['communications']['conversations']
            elif '/messages' in path and '/attachments' in path:
                return self.RATE_LIMITS['communications']['attachments']
            elif '/messages' in path and '/reactions' in path:
                return self.RATE_LIMITS['communications']['reactions']
            elif '/messages' in path:
                return self.RATE_LIMITS['communications']['messages']
        
        return self.RATE_LIMITS['default']
    
    def _get_request_count(self, client_id: str, path: str) -> int:
        """Get current request count for client and endpoint"""
        cache_key = f"rate_limit:{client_id}:{self._get_endpoint_key(path)}"
        return cache.get(cache_key, 0)
    
    def _increment_request_count(self, client_id: str, path: str):
        """Increment request count for client and endpoint"""
        cache_key = f"rate_limit:{client_id}:{self._get_endpoint_key(path)}"
        current_count = cache.get(cache_key, 0)
        
        # Set with 60 second expiration
        cache.set(cache_key, current_count + 1, 60)
    
    def _get_endpoint_key(self, path: str) -> str:
        """Get simplified endpoint key for caching"""
        if '/communications/' in path:
            if '/conversations' in path:
                return 'communications_conversations'
            elif '/messages' in path and '/attachments' in path:
                return 'communications_attachments'
            elif '/messages' in path and '/reactions' in path:
                return 'communications_reactions'
            elif '/messages' in path:
                return 'communications_messages'
        
        return 'default'


class TenantRateLimitingMiddleware(MiddlewareMixin):
    """
    Tenant-specific rate limiting middleware
    """
    
    def process_request(self, request):
        """Process request with tenant-specific rate limiting"""
        
        # Skip for non-API requests
        if not request.path.startswith('/api/'):
            return None
            
        # Get tenant ID from request (assuming it's in headers or JWT)
        tenant_id = self._get_tenant_id(request)
        if not tenant_id:
            return None
        
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Create tenant-specific key
        tenant_key = f"tenant_rate_limit:{tenant_id}:{client_id}"
        
        # Check tenant-specific limits
        current_count = cache.get(tenant_key, 0)
        tenant_limit = self._get_tenant_rate_limit(tenant_id)
        
        if current_count >= tenant_limit:
            return JsonResponse({
                'error': 'Tenant rate limit exceeded',
                'message': f'Maximum {tenant_limit} requests per minute for this tenant',
                'retry_after': 60
            }, status=429)
        
        # Increment tenant-specific count
        cache.set(tenant_key, current_count + 1, 60)
        
        return None
    
    def _get_tenant_id(self, request) -> Optional[str]:
        """Extract tenant ID from request"""
        # Try to get from Authorization header (JWT)
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                from app.core.security import decode_token
                payload = decode_token(token)
                return payload.get('tenant_id')
            except Exception:
                pass
        
        # Try to get from custom header
        return request.META.get('HTTP_X_TENANT_ID')
    
    def _get_client_id(self, request) -> str:
        """Get client identifier (same as RateLimitingMiddleware)"""
        import hashlib
        
        ip_address = self._get_real_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        client_string = f"{ip_address}:{user_agent}"
        return hashlib.md5(client_string.encode()).hexdigest()[:16]
    
    def _get_real_ip(self, request) -> str:
        """Get real IP address"""
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.META.get('HTTP_X_REAL_IP')
        if real_ip:
            return real_ip.strip()
        
        return request.META.get('REMOTE_ADDR', '127.0.0.1')
    
    def _get_tenant_rate_limit(self, tenant_id: str) -> int:
        """Get rate limit for specific tenant"""
        # Different limits based on tenant plan/type
        # For now, use a default limit
        return 200  # requests per minute per tenant
