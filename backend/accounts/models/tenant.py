"""
Multi-Tenancy Models für die CIM Plattform
Jeder Tenant ist eine separate Organisation mit eigenen Benutzern und Daten
"""

from django.db import models
from django.utils import timezone as django_timezone
import uuid


class Tenant(models.Model):
    """
    Tenant Model - Repräsentiert eine Organisation/Firma
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True, help_text="Name der Organisation")
    slug = models.SlugField(max_length=100, unique=True, help_text="URL-freundlicher Identifier")
    
    # Kontakt Info
    email = models.EmailField(unique=True, help_text="Hauptkontakt-Email")
    phone = models.CharField(max_length=50, blank=True, null=True)
    
    # Branding
    logo_url = models.URLField(max_length=500, blank=True, null=True, help_text="URL zum Firmenlogo")
    primary_color = models.CharField(max_length=7, default="#3B82F6", help_text="Primary brand color (hex)")
    secondary_color = models.CharField(max_length=7, default="#1E40AF", help_text="Secondary brand color (hex)")
    
    # Company Information
    tax_id = models.CharField(max_length=50, blank=True, null=True, help_text="Steuernummer / VAT")
    registration_number = models.CharField(max_length=100, blank=True, null=True, help_text="Handelsregisternummer")
    website = models.URLField(max_length=255, blank=True, null=True, help_text="Firmen-Website")
    
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
            ('starter', 'Starter'),
            ('pro', 'Pro'),
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
    
    # Default Settings
    currency = models.CharField(max_length=3, default="EUR", help_text="Default currency (ISO code)")
    timezone = models.CharField(max_length=50, default="Europe/Berlin", help_text="Default timezone")
    language = models.CharField(max_length=10, default="de", help_text="Default language code")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    subscription_start_date = models.DateTimeField(default=django_timezone.now)
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
        app_label = 'accounts'
    
    def __str__(self):
        return f"{self.name} ({self.slug})"
    
    def is_subscription_active(self):
        """Check if tenant subscription is active"""
        if not self.is_active:
            return False
        if self.subscription_status != 'active':
            return False
        if self.subscription_end_date and self.subscription_end_date < django_timezone.now():
            return False
        return True
    
    @classmethod
    def get_or_create_by_company_info(cls, company_name, company_email, **extra_fields):
        """
        Finde oder erstelle einen Tenant basierend auf Firmenname und Email
        Verhindert Duplikate durch unique constraints
        """
        try:
            # Versuche zuerst nach Name zu finden
            tenant = cls.objects.get(name=company_name)
            return tenant, False
        except cls.DoesNotExist:
            try:
                # Falls nicht gefunden, versuche nach Email zu finden
                tenant = cls.objects.get(email=company_email)
                return tenant, False
            except cls.DoesNotExist:
                # Erstelle neuen Tenant
                from django.utils.text import slugify
                slug = slugify(company_name)
                
                # Stelle sicher, dass der Slug eindeutig ist
                counter = 1
                original_slug = slug
                while cls.objects.filter(slug=slug).exists():
                    slug = f"{original_slug}-{counter}"
                    counter += 1
                
                tenant = cls.objects.create(
                    name=company_name,
                    email=company_email,
                    slug=slug,
                    **extra_fields
                )
                return tenant, True
