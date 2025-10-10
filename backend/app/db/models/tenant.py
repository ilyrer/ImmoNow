"""
Multi-Tenancy Models für die CIM Plattform
Jeder Tenant ist eine separate Organisation mit eigenen Benutzern und Daten
"""

from django.db import models
from django.utils import timezone
import uuid


class Tenant(models.Model):
    """
    Tenant Model - Repräsentiert eine Organisation/Firma
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Name der Organisation")
    slug = models.SlugField(max_length=100, unique=True, help_text="URL-freundlicher Identifier")
    
    # Kontakt Info
    email = models.EmailField(unique=True, help_text="Hauptkontakt-Email")
    phone = models.CharField(max_length=50, blank=True, null=True)
    
    # Adresse
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, default="Deutschland")
    
    # Subscription Info
    plan = models.CharField(
        max_length=50,
        choices=[
            ('free', 'Free'),
            ('basic', 'Basic'),
            ('professional', 'Professional'),
            ('enterprise', 'Enterprise'),
        ],
        default='free'
    )
    billing_cycle = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('yearly', 'Yearly'),
        ],
        default='monthly'
    )
    subscription_status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('inactive', 'Inactive'),
            ('suspended', 'Suspended'),
            ('cancelled', 'Cancelled'),
        ],
        default='active'
    )
    
    # Limits basierend auf Plan
    max_users = models.IntegerField(default=5)
    max_properties = models.IntegerField(default=10)
    storage_limit_gb = models.IntegerField(default=5)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    subscription_start_date = models.DateTimeField(default=timezone.now)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'tenants'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.slug})"
    
    def is_subscription_active(self):
        """Check if tenant subscription is active"""
        if not self.is_active:
            return False
        if self.subscription_status != 'active':
            return False
        if self.subscription_end_date and self.subscription_end_date < timezone.now():
            return False
        return True
