"""
Multi-Tenancy Middleware
Isoliert Daten zwischen verschiedenen Tenants basierend auf JWT Claims
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
import jwt

from app.services.auth_service import AuthService, SECRET_KEY, ALGORITHM
from app.core.errors import UnauthorizedError


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract tenant information from JWT token
    and make it available in request state
    """
    
    # Public endpoints that don't require authentication
    PUBLIC_PATHS = [
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
    ]
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request and extract tenant information
        """
        
        # Skip authentication for public paths
        if any(request.url.path.startswith(path) for path in self.PUBLIC_PATHS):
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Authorization header missing"},
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        try:
            # Extract token (format: "Bearer <token>")
            scheme, token = auth_header.split()
            
            if scheme.lower() != "bearer":
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid authentication scheme"},
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Decode token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Store tenant and user information in request state
            request.state.user_id = payload.get("sub")
            request.state.user_email = payload.get("email")
            request.state.tenant_id = payload.get("tenant_id")
            request.state.tenant_slug = payload.get("tenant_slug")
            request.state.user_role = payload.get("role")
            request.state.token_type = payload.get("type")
            
            # Verify it's an access token (not refresh)
            if request.state.token_type != "access":
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid token type. Use access token."},
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Token has expired"},
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.JWTError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid token"},
                headers={"WWW-Authenticate": "Bearer"},
            )
        except ValueError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid Authorization header format"},
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Continue with request
        response = await call_next(request)
        return response


def get_current_tenant_id(request: Request) -> Optional[str]:
    """
    Helper function to get current tenant ID from request state
    """
    return getattr(request.state, "tenant_id", None)


def get_current_user_id(request: Request) -> Optional[str]:
    """
    Helper function to get current user ID from request state
    """
    return getattr(request.state, "user_id", None)


def get_current_user_role(request: Request) -> Optional[str]:
    """
    Helper function to get current user role from request state
    """
    return getattr(request.state, "user_role", None)


def require_role(required_roles: list[str]):
    """
    Decorator to require specific role(s) for an endpoint
    Usage:
        @router.get("/admin-only")
        @require_role(['owner', 'admin'])
        async def admin_endpoint(request: Request):
            ...
    """
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            user_role = get_current_user_role(request)
            
            if not user_role or user_role not in required_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required roles: {', '.join(required_roles)}"
                )
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator
