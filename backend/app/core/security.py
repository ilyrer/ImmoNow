"""
Security and Authentication Module
"""
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.core.settings import settings
from app.core.errors import ValidationError, ForbiddenError


class TokenData(BaseModel):
    """Token payload data"""
    user_id: str
    email: str
    role: str
    tenant_id: str
    scopes: list[str]


class SecurityManager:
    """Security and authentication manager"""
    
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.access_token_expire_minutes = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> TokenData:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            role: str = payload.get("role")
            tenant_id: str = payload.get("tenant_id")
            scopes: list[str] = payload.get("scopes", [])
            
            if user_id is None or email is None or role is None or tenant_id is None:
                raise ValidationError("Invalid token payload")
            
            return TokenData(
                user_id=user_id,
                email=email,
                role=role,
                tenant_id=tenant_id,
                scopes=scopes
            )
        except jwt.ExpiredSignatureError:
            raise ValidationError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValidationError("Invalid token")


# Global security manager
security_manager = SecurityManager()

# HTTP Bearer scheme
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Get current authenticated user from JWT token"""
    try:
        token_data = security_manager.verify_token(credentials.credentials)
        return token_data
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_scope(required_scope: str):
    """Dependency to require specific scope"""
    def scope_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if required_scope not in current_user.scopes:
            raise ForbiddenError(f"Insufficient permissions. Required scope: {required_scope}")
        return current_user
    return scope_checker


def require_role(required_role: str):
    """Dependency to require specific role"""
    def role_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.role != required_role and current_user.role != "admin":
            raise ForbiddenError(f"Insufficient permissions. Required role: {required_role}")
        return current_user
    return role_checker


def get_tenant_id(current_user: TokenData = Depends(get_current_user)) -> str:
    """Get tenant ID from authenticated user"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant ID found in token")
    
    # Debug: Print the actual tenant_id value
    print(f"DEBUG: get_tenant_id called, tenant_id={current_user.tenant_id}")
    
    # Validate that tenant_id is a valid UUID
    try:
        import uuid
        uuid.UUID(current_user.tenant_id)
        print(f"DEBUG: tenant_id is valid UUID: {current_user.tenant_id}")
    except ValueError:
        print(f"ERROR: Invalid tenant_id format: {current_user.tenant_id}")
        raise HTTPException(status_code=400, detail=f"Invalid tenant ID format: {current_user.tenant_id}")
    
    return current_user.tenant_id
