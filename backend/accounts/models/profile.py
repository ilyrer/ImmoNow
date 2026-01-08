"""
User Profile and RBAC Models
"""

from django.db import models
import uuid
from .user import User
from .tenant import Tenant


class UserProfile(models.Model):
    """Extended user profile"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="users")
    role = models.CharField(
        max_length=20,
        choices=[
            ("admin", "Admin"),
            ("employee", "Employee"),
            ("customer", "Customer"),
        ],
    )
    roles = models.ManyToManyField(
        "Role", related_name="users", blank=True
    )  # RBAC roles
    avatar = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_profiles"
        indexes = [
            models.Index(fields=["tenant", "role"]),
            models.Index(fields=["tenant", "is_active"]),
        ]
        app_label = 'accounts'

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.tenant.name})"


class Permission(models.Model):
    """Permission model for RBAC"""

    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=100, unique=True
    )  # e.g. 'properties:read', 'contacts:write'
    description = models.TextField()
    category = models.CharField(
        max_length=50
    )  # 'properties', 'contacts', 'documents', etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "permissions"
        indexes = [
            models.Index(fields=["category"]),
        ]
        app_label = 'accounts'

    def __str__(self):
        return self.name


class Role(models.Model):
    """Role model for RBAC"""

    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="roles")
    name = models.CharField(max_length=100)
    description = models.TextField()
    permissions = models.ManyToManyField(Permission, related_name="roles")
    is_system = models.BooleanField(default=False)  # Admin, Manager, User
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        db_table = "roles"
        indexes = [
            models.Index(fields=["tenant", "is_system"]),
        ]
        unique_together = ["tenant", "name"]
        app_label = 'accounts'

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class FeatureFlag(models.Model):
    """Feature flag model"""

    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="feature_flags",
        blank=True,
        null=True,
    )  # Null = global
    name = models.CharField(max_length=100)
    description = models.TextField()
    is_enabled = models.BooleanField(default=False)
    rollout_percentage = models.IntegerField(default=0)  # 0-100
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        db_table = "feature_flags"
        indexes = [
            models.Index(fields=["tenant", "is_enabled"]),
        ]
        unique_together = ["tenant", "name"]
        app_label = 'accounts'

    def __str__(self):
        return f"{self.name} ({self.tenant.name if self.tenant else 'Global'})"
