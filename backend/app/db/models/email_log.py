"""
Email Logging Model für Tracking von gesendeten E-Mails
"""

import uuid
from django.db import models
from django.utils import timezone


class EmailLog(models.Model):
    """Track sent emails for debugging and analytics"""
    
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
        ('delivered', 'Delivered'),
        ('opened', 'Opened'),
        ('clicked', 'Clicked'),
    ]
    
    EMAIL_TYPE_CHOICES = [
        ('notification', 'Notification'),
        ('billing', 'Billing'),
        ('system', 'System'),
        ('welcome', 'Welcome'),
        ('trial_expired', 'Trial Expired'),
        ('test', 'Test'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='email_logs')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='email_logs', null=True, blank=True)
    notification = models.ForeignKey('Notification', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Email details
    email_type = models.CharField(max_length=50, choices=EMAIL_TYPE_CHOICES)
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=255)
    template_name = models.CharField(max_length=100, null=True, blank=True)
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    provider_message_id = models.CharField(max_length=255, null=True, blank=True)
    provider_name = models.CharField(max_length=50, null=True, blank=True)  # sendgrid, mailgun, smtp, console
    
    # Error handling
    error_message = models.TextField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    
    # Timestamps
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    
    # Additional metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'email_logs'
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['tenant', 'sent_at']),
            models.Index(fields=['user', 'sent_at']),
            models.Index(fields=['email_type', 'sent_at']),
            models.Index(fields=['status', 'sent_at']),
            models.Index(fields=['provider_name', 'sent_at']),
        ]
    
    def __str__(self):
        return f"EmailLog {self.id}: {self.email_type} to {self.recipient_email} ({self.status})"
    
    @property
    def is_successful(self) -> bool:
        """Check if email was successfully sent"""
        return self.status in ['sent', 'delivered', 'opened', 'clicked']
    
    @property
    def can_retry(self) -> bool:
        """Check if email can be retried"""
        return self.retry_count < self.max_retries and self.status == 'failed'
    
    def mark_delivered(self, provider_message_id: str = None):
        """Mark email as delivered"""
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        if provider_message_id:
            self.provider_message_id = provider_message_id
        self.save(update_fields=['status', 'delivered_at', 'provider_message_id'])
    
    def mark_opened(self):
        """Mark email as opened"""
        self.status = 'opened'
        self.opened_at = timezone.now()
        self.save(update_fields=['status', 'opened_at'])
    
    def mark_clicked(self):
        """Mark email as clicked"""
        self.status = 'clicked'
        self.clicked_at = timezone.now()
        self.save(update_fields=['status', 'clicked_at'])
    
    def mark_failed(self, error_message: str):
        """Mark email as failed"""
        self.status = 'failed'
        self.error_message = error_message
        self.retry_count += 1
        self.save(update_fields=['status', 'error_message', 'retry_count'])
    
    def mark_bounced(self, error_message: str):
        """Mark email as bounced"""
        self.status = 'bounced'
        self.error_message = error_message
        self.save(update_fields=['status', 'error_message'])


class EmailTemplateUsage(models.Model):
    """Track usage of email templates for analytics"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='template_usage')
    template_name = models.CharField(max_length=100)
    email_type = models.CharField(max_length=50)
    
    # Usage statistics
    total_sent = models.IntegerField(default=0)
    total_delivered = models.IntegerField(default=0)
    total_opened = models.IntegerField(default=0)
    total_clicked = models.IntegerField(default=0)
    total_failed = models.IntegerField(default=0)
    total_bounced = models.IntegerField(default=0)
    
    # Timestamps
    first_used = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'email_template_usage'
        unique_together = ['tenant', 'template_name']
        ordering = ['-last_used']
    
    def __str__(self):
        return f"Template {self.template_name} for {self.tenant.name}: {self.total_sent} sent"
    
    @property
    def delivery_rate(self) -> float:
        """Calculate delivery rate percentage"""
        if self.total_sent == 0:
            return 0.0
        return (self.total_delivered / self.total_sent) * 100
    
    @property
    def open_rate(self) -> float:
        """Calculate open rate percentage"""
        if self.total_delivered == 0:
            return 0.0
        return (self.total_opened / self.total_delivered) * 100
    
    @property
    def click_rate(self) -> float:
        """Calculate click rate percentage"""
        if self.total_delivered == 0:
            return 0.0
        return (self.total_clicked / self.total_delivered) * 100
    
    def update_stats(self, email_log: EmailLog):
        """Update statistics based on email log"""
        self.total_sent += 1
        
        if email_log.status == 'delivered':
            self.total_delivered += 1
        elif email_log.status == 'opened':
            self.total_opened += 1
        elif email_log.status == 'clicked':
            self.total_clicked += 1
        elif email_log.status == 'failed':
            self.total_failed += 1
        elif email_log.status == 'bounced':
            self.total_bounced += 1
        
        self.save()
