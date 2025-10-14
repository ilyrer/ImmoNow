"""
User Models mit Multi-Tenancy Support
Jeder User gehört zu mindestens einem Tenant und hat dort spezifische Rollen
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone
import uuid


class UserManager(BaseUserManager):
    """Custom User Manager"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user"""
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    """
    Custom User Model
    Kann zu mehreren Tenants gehören mit unterschiedlichen Rollen
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    
    # Personal Info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=50, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    
    # Auth Settings
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Preferences
    language = models.CharField(max_length=10, default='de')
    timezone = models.CharField(max_length=50, default='Europe/Berlin')
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Return full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        """Return short name"""
        return self.first_name
    
    # Django Admin required methods
    def has_perm(self, perm, obj=None):
        """Return True if the user has the specified permission."""
        if self.is_active and self.is_superuser:
            return True
        return False
    
    def has_module_perms(self, app_label):
        """Return True if the user has any permissions in the given app label."""
        if self.is_active and self.is_superuser:
            return True
        return False
    
    @property
    def is_authenticated(self):
        """Always return True for authenticated users."""
        return True
    
    @property
    def is_anonymous(self):
        """Always return False for authenticated users."""
        return False
    
    def get_primary_tenant(self):
        """Get the primary tenant for this user"""
        try:
            return self.tenant_memberships.filter(is_active=True).first().tenant
        except AttributeError:
            return None
    
    def assign_to_tenant(self, tenant, role='agent', **permissions):
        """Assign user to a tenant with specific role and permissions"""
        from .tenant import TenantUser
        
        tenant_user, created = TenantUser.objects.get_or_create(
            user=self,
            tenant=tenant,
            defaults={
                'role': role,
                'can_manage_properties': permissions.get('can_manage_properties', True),
                'can_manage_documents': permissions.get('can_manage_documents', True),
                'can_manage_users': permissions.get('can_manage_users', False),
                'can_view_analytics': permissions.get('can_view_analytics', True),
                'can_export_data': permissions.get('can_export_data', False),
                'is_active': True,
                'joined_at': timezone.now()
            }
        )
        return tenant_user, created


class TenantUser(models.Model):
    """
    Many-to-Many Beziehung zwischen User und Tenant mit zusätzlichen Feldern
    Definiert die Rolle eines Users in einem spezifischen Tenant
    """
    
    ROLE_CHOICES = [
        ('owner', 'Owner'),           # Vollzugriff, kann alles verwalten
        ('admin', 'Administrator'),   # Fast vollzugriff, kann User verwalten
        ('manager', 'Manager'),       # Kann Properties und Tasks verwalten
        ('agent', 'Agent'),           # Standard Immobilienmakler
        ('viewer', 'Viewer'),         # Nur Lese-Zugriff
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='tenant_memberships')
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='user_memberships')
    
    # Role in diesem Tenant
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='agent')
    
    # Permissions
    can_manage_properties = models.BooleanField(default=True)
    can_manage_documents = models.BooleanField(default=True)
    can_manage_users = models.BooleanField(default=False)
    can_view_analytics = models.BooleanField(default=True)
    can_export_data = models.BooleanField(default=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    invited_at = models.DateTimeField(auto_now_add=True)
    joined_at = models.DateTimeField(null=True, blank=True)
    invited_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invited_users'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tenant_users'
        unique_together = ['user', 'tenant']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'tenant']),
            models.Index(fields=['tenant', 'role']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.tenant.name} ({self.role})"
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission"""
        permission_map = {
            'manage_properties': self.can_manage_properties,
            'manage_documents': self.can_manage_documents,
            'manage_users': self.can_manage_users,
            'view_analytics': self.can_view_analytics,
            'export_data': self.can_export_data,
        }
        return permission_map.get(permission, False)
    
    def is_owner_or_admin(self) -> bool:
        """Check if user is owner or admin"""
        return self.role in ['owner', 'admin']
