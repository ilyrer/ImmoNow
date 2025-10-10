"""
Authentication and Authorization Module
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.security import TokenData


class UserResponse(BaseModel):
    """User response model"""
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    avatar: Optional[str] = None
    is_active: bool
    tenant_id: str
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    """Login request model"""
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    """Login response model"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Refresh token request model"""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Change password request model"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    """Forgot password request model"""
    email: str = Field(..., min_length=1, max_length=255)


class ResetPasswordRequest(BaseModel):
    """Reset password request model"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
