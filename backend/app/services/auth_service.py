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
from app.core.billing_config import PLAN_LIMITS


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


# JWT Settings - aus Pydantic Settings holen
from app.core.settings import settings
SECRET_KEY = settings.JWT_SECRET_KEY  # Verwende JWT_SECRET_KEY statt SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
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
            "type": "access",
            "scopes": ["read", "write", "delete"] if role in ["owner", "admin"] else ["read"]
        }
        
        print(f"🔍 AuthService: Creating token with payload: {payload}")
        print(f"🔍 AuthService: Using JWT_SECRET_KEY: {SECRET_KEY[:20]}...")
        print(f"🔍 AuthService: Using ALGORITHM: {ALGORITHM}")
        print(f"🔍 AuthService: JWT_SECRET_KEY length: {len(SECRET_KEY)}")
        print(f"🔍 AuthService: JWT_SECRET_KEY type: {type(SECRET_KEY)}")
        
        encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        print(f"✅ AuthService: Token created: {encoded_jwt[:50]}...")
        print(f"✅ AuthService: Token length: {len(encoded_jwt)}")
        print(f"✅ AuthService: Token parts: {encoded_jwt.count('.')}")
        
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
            print(f"🔍 AuthService: Decoding token: {token[:20]}...")
            print(f"🔍 AuthService: Using JWT_SECRET_KEY: {SECRET_KEY[:20]}...")
            print(f"🔍 AuthService: Using ALGORITHM: {ALGORITHM}")
            print(f"🔍 AuthService: Token length: {len(token)}")
            print(f"🔍 AuthService: Token parts: {token.count('.')}")
            print(f"🔍 AuthService: JWT_SECRET_KEY length: {len(SECRET_KEY)}")
            print(f"🔍 AuthService: JWT_SECRET_KEY type: {type(SECRET_KEY)}")
            
            # Prüfe Token-Format
            if token.count('.') != 2:
                print(f"❌ AuthService: Invalid token format - expected 3 parts, got {token.count('.') + 1}")
                raise UnauthorizedError("Invalid token format")
            
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            print(f"✅ AuthService: Token decoded successfully: {payload}")
            
            return TokenPayload(**payload)
        except jwt.ExpiredSignatureError:
            print("❌ AuthService: Token has expired")
            raise UnauthorizedError("Token has expired")
        except jwt.PyJWTError as e:
            print(f"❌ AuthService: Invalid token - {str(e)}")
            print(f"❌ AuthService: Error type: {type(e).__name__}")
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
        
        # Find or create tenant using company info
        # This prevents duplicate tenants with the same name or email
        tenant, tenant_created = Tenant.get_or_create_by_company_info(
            company_name=request.tenant_name,
            company_email=request.company_email or request.email,
            phone=request.phone if not request.company_phone else request.company_phone,
            plan='free',  # Alle neuen Registrierungen starten mit Free Trial
            billing_cycle=request.billing_cycle,
            subscription_status='trialing',  # Startet im Trial-Modus
            is_active=True,
            subscription_start_date=timezone.now()
        )
        
        # Set limits based on plan (only if tenant was newly created)
        if tenant_created:
            # Verwende die neuen PLAN_LIMITS aus billing_config
            limits = PLAN_LIMITS.get('free', PLAN_LIMITS['free'])
            tenant.max_users = limits['users']
            tenant.max_properties = limits['properties']
            tenant.storage_limit_gb = limits['storage_gb']
            tenant.save()
            
            # HINWEIS: Keine automatische BillingAccount-Erstellung mehr
            # BillingAccount wird nur noch via /registration/complete erstellt (nach Payment)
            print(f"✅ AuthService: Tenant created without BillingAccount (Payment-First Flow)")
        
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
            scopes=['read', 'write', 'delete'],
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
        
        # Create appropriate welcome message
        if tenant_created:
            message = f"Registration successful! Welcome to your new organization: {tenant.name}"
        else:
            message = f"Registration successful! You have been added to {tenant.name}"
        
        return RegisterResponse(
            message=message,
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
    
    @staticmethod
    async def get_user_by_google_id(google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        try:
            user = await sync_to_async(User.objects.get)(google_id=google_id)
            return user
        except User.DoesNotExist:
            return None
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email"""
        try:
            user = await sync_to_async(User.objects.get)(email=email)
            return user
        except User.DoesNotExist:
            return None
    
    @staticmethod
    async def link_google_account(user_id: str, google_id: str) -> bool:
        """Link Google account to existing user"""
        try:
            user = await sync_to_async(User.objects.get)(id=user_id)
            user.google_id = google_id
            await sync_to_async(user.save)()
            return True
        except User.DoesNotExist:
            return False
