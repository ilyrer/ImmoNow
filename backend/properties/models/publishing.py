"""
Property Publishing Models
"""
import uuid
from django.db import models


class ExposeVersion(models.Model):
    """Expose version model for AI-generated exposés"""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name="expose_versions"
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    audience = models.CharField(
        max_length=50,
        choices=[
            ("kauf", "Kauf"),
            ("miete", "Miete"),
            ("investor", "Investor"),
        ],
    )
    tone = models.CharField(
        max_length=50,
        choices=[
            ("neutral", "Neutral"),
            ("elegant", "Elegant"),
            ("kurz", "Kurz"),
        ],
    )
    language = models.CharField(
        max_length=10,
        choices=[
            ("de", "Deutsch"),
            ("en", "English"),
        ],
    )
    length = models.CharField(
        max_length=20,
        choices=[
            ("short", "Kurz"),
            ("standard", "Standard"),
            ("long", "Lang"),
        ],
    )
    keywords = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    version_number = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)

    class Meta:
        db_table = "expose_versions"
        indexes = [
            models.Index(fields=["property", "status"]),
            models.Index(fields=["property", "created_at"]),
            models.Index(fields=["property", "version_number"]),
        ]
        unique_together = ["property", "version_number"]
        app_label = 'properties'

    def __str__(self):
        return f"{self.property.title} - Exposé v{self.version_number}"


class PublishJob(models.Model):
    """Publish job model for tracking property publications"""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("publishing", "Publishing"),
        ("published", "Published"),
        ("failed", "Failed"),
        ("unpublished", "Unpublished"),
    ]

    PORTAL_CHOICES = [
        ("immoscout24", "ImmoScout24"),
        ("immowelt", "Immowelt"),
        ("ebay_kleinanzeigen", "eBay Kleinanzeigen"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name="publish_jobs"
    )
    portal = models.CharField(max_length=50, choices=PORTAL_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    portal_property_id = models.CharField(
        max_length=255, blank=True, null=True
    )  # ID on the portal
    portal_url = models.URLField(blank=True, null=True)  # URL to the published property
    error_message = models.TextField(blank=True, null=True)
    retry_count = models.IntegerField(default=0)
    scheduled_at = models.DateTimeField(blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    unpublished_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)

    class Meta:
        db_table = "publish_jobs"
        indexes = [
            models.Index(fields=["property", "status"]),
            models.Index(fields=["property", "portal"]),
            models.Index(fields=["property", "created_at"]),
        ]
        app_label = 'properties'

    def __str__(self):
        return f"{self.property.title} - {self.portal} ({self.status})"


class IntegrationSettings(models.Model):
    """Integration settings model for API keys and configurations"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="integration_settings"
    )

    # Google Maps
    google_maps_api_key = models.TextField(blank=True, null=True)  # Encrypted

    # ImmoScout24
    immoscout_client_id = models.TextField(blank=True, null=True)  # Encrypted
    immoscout_client_secret = models.TextField(blank=True, null=True)  # Encrypted
    immoscout_access_token = models.TextField(blank=True, null=True)  # Encrypted
    immoscout_refresh_token = models.TextField(blank=True, null=True)  # Encrypted
    immoscout_token_expires_at = models.DateTimeField(blank=True, null=True)

    # Other portals (future)
    immowelt_api_key = models.TextField(blank=True, null=True)  # Encrypted
    ebay_api_key = models.TextField(blank=True, null=True)  # Encrypted

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)

    class Meta:
        db_table = "integration_settings"
        app_label = 'properties'

    def __str__(self):
        return f"Integration Settings for {self.tenant.name}"
