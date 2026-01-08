"""
Notification Model
Vollständiges Benachrichtigungssystem mit Kategorien, Prioritäten und Actions
"""
import uuid
from django.db import models
from django.utils import timezone


class NotificationType(models.TextChoices):
    """Notification types"""
    INFO = 'info', 'Info'
    SUCCESS = 'success', 'Success'
    WARNING = 'warning', 'Warning'
    ERROR = 'error', 'Error'
    REMINDER = 'reminder', 'Reminder'


class NotificationCategory(models.TextChoices):
    """Notification categories"""
    SYSTEM = 'system', 'System'
    PROPERTY = 'property', 'Property'
    CONTACT = 'contact', 'Contact'
    TASK = 'task', 'Task'
    APPOINTMENT = 'appointment', 'Appointment'
    DOCUMENT = 'document', 'Document'
    FINANCIAL = 'financial', 'Financial'
    MESSAGE = 'message', 'Message'
    TEAM = 'team', 'Team'
    CIM = 'cim', 'CIM'


class NotificationPriority(models.TextChoices):
    """Notification priorities"""
    LOW = 'low', 'Low'
    NORMAL = 'normal', 'Normal'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class Notification(models.Model):
    """
    Notification Model
    Speichert alle Benachrichtigungen für Benutzer
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='notifications',
        help_text="Empfänger der Benachrichtigung"
    )
    
    # Basic Information
    type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.INFO
    )
    category = models.CharField(
        max_length=20,
        choices=NotificationCategory.choices,
        default=NotificationCategory.SYSTEM
    )
    priority = models.CharField(
        max_length=20,
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL
    )
    
    # Content
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Status
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    
    # Action & Navigation
    action_url = models.CharField(
        max_length=500, 
        null=True, 
        blank=True,
        help_text="URL zum Navigieren bei Klick"
    )
    action_label = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Label für Action-Button"
    )
    
    # Related Entity (optional)
    related_entity_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="z.B. 'property', 'contact', 'task'"
    )
    related_entity_id = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )
    related_entity_title = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Zusätzliche Daten (Icons, Farben, etc.)"
    )
    
    # Expiry
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Automatisches Löschen nach diesem Datum"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Creator (optional, für System-Benachrichtigungen null)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_notifications'
    )
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'user', 'read', 'created_at']),
            models.Index(fields=['tenant', 'user', 'category']),
            models.Index(fields=['tenant', 'user', 'priority']),
            models.Index(fields=['tenant', 'type']),
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['expires_at']),
        ]
        app_label = 'notifications'
    
    def __str__(self):
        return f"{self.type} - {self.title} ({self.user.email})"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save(update_fields=['read', 'read_at', 'updated_at'])
    
    def mark_as_unread(self):
        """Mark notification as unread"""
        if self.read:
            self.read = False
            self.read_at = None
            self.save(update_fields=['read', 'read_at', 'updated_at'])
    
    def archive(self):
        """Archive notification"""
        if not self.archived:
            self.archived = True
            self.archived_at = timezone.now()
            self.save(update_fields=['archived', 'archived_at', 'updated_at'])


class NotificationPreference(models.Model):
    """
    Notification Preferences per User
    Definiert welche Benachrichtigungen ein User erhalten möchte
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('accounts.Tenant', on_delete=models.CASCADE)
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='notification_preferences'
    )
    
    # Category preferences
    category = models.CharField(
        max_length=20,
        choices=NotificationCategory.choices
    )
    
    # Channels
    enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    
    # Minimum priority
    min_priority = models.CharField(
        max_length=20,
        choices=NotificationPriority.choices,
        default=NotificationPriority.LOW,
        help_text="Minimale Priorität für diese Kategorie"
    )
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
        unique_together = ['tenant', 'user', 'category']
        indexes = [
            models.Index(fields=['tenant', 'user']),
        ]
        app_label = 'notifications'
    
    def __str__(self):
        return f"{self.user.email} - {self.category}"
