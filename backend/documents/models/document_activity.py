"""
Document Activity Models
"""
import uuid
from django.db import models


class DocumentActivity(models.Model):
    """Document activity tracking"""

    ACTION_CHOICES = [
        ("uploaded", "Uploaded"),
        ("edited", "Edited"),
        ("deleted", "Deleted"),
        ("downloaded", "Downloaded"),
        ("viewed", "Viewed"),
        ("shared", "Shared"),
        ("commented", "Commented"),
        ("moved", "Moved"),
        ("renamed", "Renamed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_id = models.UUIDField(db_index=True)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="document_activities"
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    user = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="document_activities"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = "document_activities"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["tenant", "document_id", "-timestamp"]),
            models.Index(fields=["tenant", "action", "-timestamp"]),
        ]
        app_label = 'documents'

    def __str__(self):
        return f"{self.action} by {self.user.email} on {self.timestamp}"


class DocumentComment(models.Model):
    """Document comments"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_id = models.UUIDField(db_index=True)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="document_comments"
    )
    text = models.TextField()
    author = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="document_comments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "document_comments"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant", "document_id", "-created_at"]),
        ]
        app_label = 'documents'

    def __str__(self):
        return f"Comment by {self.author.email} on {self.created_at}"
