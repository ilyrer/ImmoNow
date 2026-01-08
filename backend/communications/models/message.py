"""
Message Models
"""
import uuid
from django.db import models


class Message(models.Model):
    """Channel message (supports threads and soft delete)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="messages"
    )
    channel = models.ForeignKey(
        'communications.Channel', on_delete=models.CASCADE, related_name="messages"
    )
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name="messages")
    content = models.TextField()
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, related_name="replies", null=True, blank=True
    )
    has_attachments = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    edited_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "messages"
        indexes = [
            models.Index(fields=["tenant", "channel"]),
            models.Index(fields=["tenant", "parent"]),
            models.Index(fields=["tenant", "created_at"]),
        ]
        ordering = ["created_at"]
        app_label = 'communications'

    def __str__(self):
        return f"Message by {self.user.email} in {self.channel.name}"


class Reaction(models.Model):
    """Emoji reactions for messages"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="reactions"
    )
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="reactions"
    )
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name="reactions")
    emoji = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reactions"
        unique_together = [["message", "user", "emoji"]]
        indexes = [
            models.Index(fields=["tenant", "message"]),
        ]
        app_label = 'communications'

    def __str__(self):
        return f"{self.emoji} by {self.user.email}"


class Attachment(models.Model):
    """File attachment for messages"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="attachments"
    )
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="attachments"
    )
    file_url = models.URLField()
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100, blank=True, null=True)
    file_size = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attachments"
        indexes = [
            models.Index(fields=["tenant", "message"]),
        ]
        app_label = 'communications'

    def __str__(self):
        return self.file_name


class ResourceLink(models.Model):
    """Reference to another resource (contact/property) from a message"""

    RESOURCE_CHOICES = [
        ("contact", "Contact"),
        ("property", "Property"),
        ("task", "Task"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="resource_links"
    )
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name="resource_links"
    )
    resource_type = models.CharField(max_length=20, choices=RESOURCE_CHOICES)
    resource_id = models.UUIDField()
    label = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "resource_links"
        indexes = [
            models.Index(fields=["tenant", "resource_type"]),
            models.Index(fields=["resource_id"]),
        ]
        app_label = 'communications'

    def __str__(self):
        return f"{self.resource_type}:{self.resource_id}"
