"""
Billing Models für Stripe Subscription Integration
"""

import uuid
from django.db import models
from django.utils import timezone
from .tenant import Tenant


class BillingAccount(models.Model):
    """Stripe Billing Account - OneToOne mit Tenant"""
    
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('trialing', 'Trialing'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('incomplete', 'Incomplete'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='billing')
    
    # Stripe IDs
    stripe_customer_id = models.CharField(max_length=255, unique=True, db_index=True)
    stripe_subscription_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    
    # Plan & Status (Quelle der Wahrheit)
    plan_key = models.CharField(max_length=50, choices=PLAN_CHOICES, default='free')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    
    # Subscription Metadata
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    
    # Trial Management
    trial_end = models.DateTimeField(null=True, blank=True)
    trial_days = models.IntegerField(default=14)
    
    # Zusätzliche Metadaten (JSON)
    meta = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'billing_accounts'
        indexes = [
            models.Index(fields=['tenant', 'plan_key']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['stripe_customer_id']),
            models.Index(fields=['stripe_subscription_id']),
        ]
    
    def __str__(self):
        return f"{self.tenant.name} - {self.plan_key} ({self.status})"
    
    def is_active(self) -> bool:
        """Check if subscription is active"""
        return self.status in ['active', 'trialing']
    
    def is_trial_expired(self) -> bool:
        """Check if trial period has expired"""
        if self.status == 'trialing' and self.trial_end:
            return timezone.now() > self.trial_end
        return False


class StripeWebhookEvent(models.Model):
    """Idempotenz für Stripe Webhook Events"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_id = models.CharField(max_length=255, unique=True, db_index=True)
    event_type = models.CharField(max_length=100, db_index=True)
    processed_at = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField()
    
    class Meta:
        db_table = 'stripe_webhook_events'
        indexes = [
            models.Index(fields=['event_id']),
            models.Index(fields=['event_type']),
            models.Index(fields=['processed_at']),
        ]
        ordering = ['-processed_at']
    
    def __str__(self):
        return f"Stripe Event: {self.event_type} ({self.event_id})"

