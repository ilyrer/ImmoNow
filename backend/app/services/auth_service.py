"""
Authentication Service
Handles JWT token generation, password hashing, and user verification
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
import re
from django.contrib.auth.hashers import make_password, check_password
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from asgiref.sync import sync_to_async

from app.db.models import User, Tenant, TenantUser


def slugify(text: str) -> str:
    """Simple slugify function"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = re.sub(r'^-+|-+$', '', text)
    return text
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    LoginResponse,
    RegisterResponse,
    TenantInfo,
    UserResponse,
    TenantUserInfo,
    TokenPayload
)
from app.core.errors import UnauthorizedError, ConflictError, NotFoundError


# JWT Settings
SECRET_KEY = getattr(settings, 'SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour
REFRESH_TOKEN_EXPIRE_DAYS = 30  # 30 days


class AuthService:
    """Authentication Service"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using Django's password hashers"""
        return make_password(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash using Django's password hashers"""
        return check_password(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(
        user_id: str,
        email: str,
        tenant_id: str,
        tenant_slug: str,
        role: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token"""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = {
            "sub": str(user_id),
            "email": email,
            "tenant_id": str(tenant_id),
            "tenant_slug": tenant_slug,
            "role": role,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(
        user_id: str,
        email: str,
        tenant_id: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT refresh token"""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        payload = {
            "sub": str(user_id),
            "email": email,
            "tenant_id": str(tenant_id),
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> TokenPayload:
        """Decode and verify JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return TokenPayload(**payload)
        except jwt.ExpiredSignatureError:
            raise UnauthorizedError("Token has expired")
        except jwt.JWTError:
            raise UnauthorizedError("Invalid token")
    
    @staticmethod
    @sync_to_async
    @transaction.atomic
    def register_user(request: RegisterRequest) -> RegisterResponse:
        """
        Register a new user and create a tenant
        Creates both the user and tenant in a transaction
        """
        
        # Check if user already exists
        if User.objects.filter(email=request.email).exists():
            raise ConflictError(f"User with email {request.email} already exists")
        
        # Create tenant
        tenant_slug = slugify(request.tenant_name)
        
        # Ensure unique slug
        base_slug = tenant_slug
        counter = 1
        while Tenant.objects.filter(slug=tenant_slug).exists():
            tenant_slug = f"{base_slug}-{counter}"
            counter += 1
        
        tenant = Tenant.objects.create(
            name=request.tenant_name,
            slug=tenant_slug,
            email=request.company_email or request.email,
            phone=request.company_phone,
            plan=request.plan,
            billing_cycle=request.billing_cycle,
            subscription_status='active',
            is_active=True,
            subscription_start_date=timezone.now()
        )
        
        # Set limits based on plan
        plan_limits = {
            'free': {'max_users': 2, 'max_properties': 5, 'storage_limit_gb': 1},
            'basic': {'max_users': 5, 'max_properties': 25, 'storage_limit_gb': 10},
            'professional': {'max_users': 20, 'max_properties': 100, 'storage_limit_gb': 50},
            'enterprise': {'max_users': 100, 'max_properties': 1000, 'storage_limit_gb': 500},
        }
        limits = plan_limits.get(request.plan, plan_limits['free'])
        tenant.max_users = limits['max_users']
        tenant.max_properties = limits['max_properties']
        tenant.storage_limit_gb = limits['storage_limit_gb']
        tenant.save()
        
        # Create user
        user = User.objects.create(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            is_active=True,
            email_verified=False,  # TODO: Send verification email
            password=AuthService.hash_password(request.password)  # Use bcrypt hashing
        )
        user.save()
        
        # Create tenant-user relationship (owner role)
        tenant_user = TenantUser.objects.create(
            user=user,
            tenant=tenant,
            role='owner',
            can_manage_properties=True,
            can_manage_documents=True,
            can_manage_users=True,
            can_view_analytics=True,
            can_export_data=True,
            is_active=True,
            joined_at=timezone.now()
        )
        
        # Generate tokens
        access_token = AuthService.create_access_token(
            user_id=str(user.id),
            email=user.email,
            tenant_id=str(tenant.id),
            tenant_slug=tenant.slug,
            role=tenant_user.role
        )
        
        refresh_token = AuthService.create_refresh_token(
            user_id=str(user.id),
            email=user.email,
            tenant_id=str(tenant.id)
        )
        
        # Update last login
        user.last_login = timezone.now()
        user.save()
        
        return RegisterResponse(
            message=f"Registration successful! Welcome to {tenant.name}",
            user=UserResponse.from_orm(user),
            tenant=TenantInfo.from_orm(tenant),
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    @staticmethod
    @sync_to_async
    def login_user(request: LoginRequest) -> LoginResponse:
        """
        Authenticate user and return tokens
        """
        
        # Find user
        try:
            user = User.objects.get(email=request.email)
        except User.DoesNotExist:
            raise UnauthorizedError("Invalid email or password")
        
        # Verify password
        if not AuthService.verify_password(request.password, user.password):
            raise UnauthorizedError("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            raise UnauthorizedError("User account is inactive")
        
        # Get user's tenant memberships
        tenant_memberships = TenantUser.objects.filter(
            user=user,
            is_active=True,
            tenant__is_active=True
        ).select_related('tenant')
        
        if not tenant_memberships.exists():
            raise UnauthorizedError("User has no active tenant memberships")
        
        # Select tenant (either specified or first available)
        if request.tenant_id:
            tenant_membership = tenant_memberships.filter(tenant__id=request.tenant_id).first()
            if not tenant_membership:
                raise NotFoundError(f"User not found in tenant {request.tenant_id}")
        else:
            tenant_membership = tenant_memberships.first()
        
        tenant = tenant_membership.tenant
        
        # Check tenant subscription
        if not tenant.is_subscription_active():
            raise UnauthorizedError("Tenant subscription is not active")
        
        # Generate tokens
        access_token = AuthService.create_access_token(
            user_id=str(user.id),
            email=user.email,
            tenant_id=str(tenant.id),
            tenant_slug=tenant.slug,
            role=tenant_membership.role
        )
        
        refresh_token = AuthService.create_refresh_token(
            user_id=str(user.id),
            email=user.email,
            tenant_id=str(tenant.id)
        )
        
        # Update last login
        user.last_login = timezone.now()
        user.save()
        
        # Get all available tenants
        available_tenants = [
            TenantUserInfo(
                tenant_id=str(tm.tenant.id),
                tenant_name=tm.tenant.name,
                role=tm.role,
                can_manage_properties=tm.can_manage_properties,
                can_manage_documents=tm.can_manage_documents,
                can_manage_users=tm.can_manage_users,
                can_view_analytics=tm.can_view_analytics,
                can_export_data=tm.can_export_data,
                is_active=tm.is_active
            )
            for tm in tenant_memberships
        ]
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(user),
            tenant=TenantInfo.from_orm(tenant),
            tenant_role=TenantUserInfo(
                tenant_id=str(tenant.id),
                tenant_name=tenant.name,
                role=tenant_membership.role,
                can_manage_properties=tenant_membership.can_manage_properties,
                can_manage_documents=tenant_membership.can_manage_documents,
                can_manage_users=tenant_membership.can_manage_users,
                can_view_analytics=tenant_membership.can_view_analytics,
                can_export_data=tenant_membership.can_export_data,
                is_active=tenant_membership.is_active
            ),
            available_tenants=available_tenants
        )
    
    @staticmethod
    @sync_to_async
    def get_current_user(token: str) -> User:
        """Get current user from token"""
        payload = AuthService.decode_token(token)
        
        try:
            user = User.objects.get(id=payload.sub, is_active=True)
            return user
        except User.DoesNotExist:
            raise UnauthorizedError("User not found")
    
    @staticmethod
    @sync_to_async
    def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        payload = AuthService.decode_token(refresh_token)
        
        if payload.type != "refresh":
            raise UnauthorizedError("Invalid token type")
        
        # Get user and tenant membership
        try:
            user = User.objects.get(id=payload.sub, is_active=True)
            tenant_membership = TenantUser.objects.get(
                user=user,
                tenant__id=payload.tenant_id,
                is_active=True
            )
        except (User.DoesNotExist, TenantUser.DoesNotExist):
            raise UnauthorizedError("Invalid refresh token")
        
        tenant = tenant_membership.tenant
        
        # Generate new tokens
        new_access_token = AuthService.create_access_token(
            user_id=str(user.id),
            email=user.email,
            tenant_id=str(tenant.id),
            tenant_slug=tenant.slug,
            role=tenant_membership.role
        )
        
        new_refresh_token = AuthService.create_refresh_token(
            user_id=str(user.id),
            email=user.email,
            tenant_id=str(tenant.id)
        )
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
