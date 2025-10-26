"""
User Schemas
Pydantic models for user-related operations
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles"""
    ADMIN = "admin"
    AGENT = "agent"
    VIEWER = "viewer"


class UserResponse(BaseModel):
    """Response model for user data"""
    id: str = Field(..., description="User ID")
    email: EmailStr = Field(..., description="User email")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    is_active: bool = Field(..., description="Whether user is active")
    email_verified: bool = Field(..., description="Whether email is verified")
    created_at: datetime = Field(..., description="Creation timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")


class UserCreateRequest(BaseModel):
    """Request model for creating a user"""
    email: EmailStr = Field(..., description="User email")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    role: UserRole = Field(default=UserRole.AGENT, description="User role")
    send_invitation: bool = Field(default=True, description="Send invitation email")


class UserUpdateRequest(BaseModel):
    """Request model for updating a user"""
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    role: Optional[UserRole] = Field(None, description="User role")
    is_active: Optional[bool] = Field(None, description="Whether user is active")


class UserInviteRequest(BaseModel):
    """Request model for inviting a user"""
    email: EmailStr = Field(..., description="User email")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    role: UserRole = Field(default=UserRole.AGENT, description="User role")
    message: Optional[str] = Field(None, description="Invitation message")


class UserInviteResponse(BaseModel):
    """Response model for user invitation"""
    message: str = Field(..., description="Response message")
    user_id: Optional[str] = Field(None, description="Created user ID")
    invitation_sent: bool = Field(..., description="Whether invitation was sent")
    invitation_token: Optional[str] = Field(None, description="Invitation token")


class UserListResponse(BaseModel):
    """Response model for user list"""
    users: List[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Users per page")


class UserProfileResponse(BaseModel):
    """Response model for user profile"""
    id: str = Field(..., description="User ID")
    email: EmailStr = Field(..., description="User email")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    is_active: bool = Field(..., description="Whether user is active")
    email_verified: bool = Field(..., description="Whether email is verified")
    role: UserRole = Field(..., description="User role")
    permissions: List[str] = Field(..., description="User permissions")
    created_at: datetime = Field(..., description="Creation timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")


class UserPasswordChangeRequest(BaseModel):
    """Request model for password change"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Confirm new password")


class UserPasswordResetRequest(BaseModel):
    """Request model for password reset"""
    email: EmailStr = Field(..., description="User email")


class UserPasswordResetConfirmRequest(BaseModel):
    """Request model for password reset confirmation"""
    token: str = Field(..., description="Reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Confirm new password")
