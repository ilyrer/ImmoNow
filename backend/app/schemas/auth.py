"""
Authentication Schemas für Login, Registration und Token Management
"""

from pydantic import BaseModel, EmailStr, Field, validator, field_serializer
from typing import Optional, List
from datetime import datetime
import uuid


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class RegisterRequest(BaseModel):
    """Schema für User Registration"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    
    # Tenant Information (für neue Tenant Registration)
    tenant_name: str = Field(..., min_length=2, description="Organization name")
    company_email: Optional[EmailStr] = None
    company_phone: Optional[str] = None
    
    # Plan selection
    plan: str = Field(default='free', description="Subscription plan")
    billing_cycle: str = Field(default='monthly', description="Billing cycle")
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v
    
    @validator('plan')
    def validate_plan(cls, v):
        """Validate plan is valid"""
        valid_plans = ['free', 'basic', 'professional', 'enterprise']
        if v not in valid_plans:
            raise ValueError(f'Plan must be one of: {", ".join(valid_plans)}')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123",
                "first_name": "Max",
                "last_name": "Mustermann",
                "phone": "+49 123 456789",
                "tenant_name": "Mustermann Immobilien GmbH",
                "company_email": "info@mustermann-immobilien.de",
                "plan": "professional",
                "billing_cycle": "yearly"
            }
        }


class LoginRequest(BaseModel):
    """Schema für User Login"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    tenant_id: Optional[str] = Field(None, description="Optional: Specific tenant to login to")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123"
            }
        }


class InviteUserRequest(BaseModel):
    """Schema für User Invitation"""
    email: EmailStr = Field(..., description="Email of user to invite")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., description="Role in tenant")
    
    # Permissions
    can_manage_properties: bool = Field(default=True)
    can_manage_documents: bool = Field(default=True)
    can_manage_users: bool = Field(default=False)
    can_view_analytics: bool = Field(default=True)
    can_export_data: bool = Field(default=False)
    
    @validator('role')
    def validate_role(cls, v):
        """Validate role is valid"""
        valid_roles = ['owner', 'admin', 'manager', 'agent', 'viewer']
        if v not in valid_roles:
            raise ValueError(f'Role must be one of: {", ".join(valid_roles)}')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "newagent@example.com",
                "first_name": "Maria",
                "last_name": "Schmidt",
                "role": "agent",
                "can_manage_properties": True,
                "can_manage_documents": True,
                "can_manage_users": False
            }
        }


class PasswordResetRequest(BaseModel):
    """Schema für Password Reset Request"""
    email: EmailStr = Field(..., description="User email address")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class PasswordResetConfirm(BaseModel):
    """Schema für Password Reset Confirmation"""
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v


class RefreshTokenRequest(BaseModel):
    """Schema für Token Refresh"""
    refresh_token: str = Field(..., description="Refresh token")


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class TenantInfo(BaseModel):
    """Tenant Information in Token Response"""
    id: str
    name: str
    slug: str
    plan: str
    is_active: bool
    logo_url: Optional[str] = None
    
    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to handle UUID conversion"""
        return cls(
            id=str(obj.id),
            name=obj.name,
            slug=obj.slug,
            plan=obj.plan,
            is_active=obj.is_active,
            logo_url=obj.logo_url if hasattr(obj, 'logo_url') else None
        )
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User Information Response"""
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool
    email_verified: bool
    language: str
    timezone: str
    created_at: datetime
    last_login: Optional[datetime] = None
    
    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to handle UUID conversion"""
        return cls(
            id=str(obj.id),
            email=obj.email,
            first_name=obj.first_name,
            last_name=obj.last_name,
            phone=obj.phone,
            avatar=obj.avatar,
            is_active=obj.is_active,
            email_verified=obj.email_verified,
            language=obj.language,
            timezone=obj.timezone,
            created_at=obj.created_at,
            last_login=obj.last_login
        )
    
    class Config:
        from_attributes = True


class TenantUserInfo(BaseModel):
    """User's role and permissions in a tenant"""
    tenant_id: str
    tenant_name: str
    role: str
    can_manage_properties: bool
    can_manage_documents: bool
    can_manage_users: bool
    can_view_analytics: bool
    can_export_data: bool
    is_active: bool
    
    @field_serializer('tenant_id')
    def serialize_tenant_id(self, value):
        """Ensure tenant_id is always a string"""
        return str(value) if value else None
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Response after successful login"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")
    
    user: UserResponse
    tenant: TenantInfo
    tenant_role: TenantUserInfo
    
    # All tenants user has access to
    available_tenants: List[TenantUserInfo] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600,
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "user@example.com",
                    "first_name": "Max",
                    "last_name": "Mustermann",
                    "is_active": True,
                    "email_verified": True
                },
                "tenant": {
                    "id": "tenant-123",
                    "name": "Mustermann Immobilien",
                    "plan": "professional"
                },
                "tenant_role": {
                    "role": "admin",
                    "can_manage_properties": True,
                    "can_manage_users": True
                }
            }
        }


class RegisterResponse(BaseModel):
    """Response after successful registration"""
    message: str = "Registration successful"
    user: UserResponse
    tenant: TenantInfo
    
    # Auto-login tokens
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Registration successful. Welcome!",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "newuser@example.com",
                    "first_name": "Max",
                    "last_name": "Mustermann"
                },
                "tenant": {
                    "id": "tenant-123",
                    "name": "Mustermann Immobilien",
                    "plan": "free"
                },
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600
            }
        }


class TokenRefreshResponse(BaseModel):
    """Response after token refresh"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation completed successfully",
                "success": True
            }
        }


# ============================================================================
# JWT TOKEN PAYLOAD
# ============================================================================

class TokenPayload(BaseModel):
    """JWT Token Payload"""
    sub: str  # user_id
    email: str
    tenant_id: str
    tenant_slug: str
    role: str
    exp: int
    iat: int
    type: str  # 'access' or 'refresh'
    scopes: list[str] = []  # Permissions scopes
    
    class Config:
        json_schema_extra = {
            "example": {
                "sub": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "tenant_id": "tenant-123",
                "tenant_slug": "mustermann-immobilien",
                "role": "admin",
                "exp": 1699999999,
                "iat": 1699996399,
                "type": "access"
            }
        }
