"""
Social Media Models
"""
import uuid
from django.db import models


class SocialAccount(models.Model):
    """Social media account model - supports multiple accounts per platform"""

    PLATFORM_CHOICES = [
        ("facebook", "Facebook"),
        ("linkedin", "LinkedIn"),
        ("twitter", "Twitter"),
        ("instagram", "Instagram"),
        ("youtube", "YouTube"),
        ("tiktok", "TikTok"),
        ("pinterest", "Pinterest"),
        ("immoscout24", "ImmoScout24"),
        ("immowelt", "Immowelt"),
        ("immonet", "Immonet"),
        ("ebay_kleinanzeigen", "eBay Kleinanzeigen"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="social_accounts"
    )
    platform = models.CharField(max_length=30, choices=PLATFORM_CHOICES)
    account_id = models.CharField(max_length=255)  # Platform-specific account ID
    account_name = models.CharField(max_length=255)
    account_label = models.CharField(
        max_length=100, blank=True, null=True
    )  # Custom label for multi-account
    access_token = models.TextField()  # Encrypted token
    refresh_token = models.TextField(blank=True, null=True)  # Encrypted refresh token
    token_expires_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_sync_at = models.DateTimeField(blank=True, null=True)
    # Account metadata
    follower_count = models.IntegerField(blank=True, null=True)
    following_count = models.IntegerField(blank=True, null=True)
    post_count = models.IntegerField(blank=True, null=True)
    profile_url = models.URLField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)

    class Meta:
        db_table = "social_accounts"
        indexes = [
            models.Index(fields=["tenant", "platform"]),
            models.Index(fields=["tenant", "is_active"]),
        ]
        unique_together = ["tenant", "platform", "account_id"]
        app_label = 'communications'

    def __str__(self):
        return f"{self.platform}: {self.account_name}"


class SocialPost(models.Model):
    """Social media post model"""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("scheduled", "Scheduled"),
        ("published", "Published"),
        ("failed", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="social_posts"
    )
    account = models.ForeignKey(
        SocialAccount, on_delete=models.CASCADE, related_name="posts"
    )
    content = models.TextField()
    media_urls = models.JSONField(default=list, blank=True)  # List of media URLs
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    scheduled_at = models.DateTimeField(blank=True, null=True)
    published_at = models.DateTimeField(blank=True, null=True)
    platform_post_id = models.CharField(
        max_length=255, blank=True, null=True
    )  # Platform's post ID
    metrics = models.JSONField(
        default=dict, blank=True
    )  # reach, clicks, comments, shares
    error_message = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "social_posts"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "scheduled_at"]),
            models.Index(fields=["tenant", "published_at"]),
            models.Index(fields=["account", "status"]),
        ]
        app_label = 'communications'

    def __str__(self):
        return f"{self.account.platform}: {self.content[:50]}..."
