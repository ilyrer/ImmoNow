"""
Audit Log Model
"""

import uuid
from django.db import models


class AuditLog(models.Model):
    """Audit log model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant',
        on_delete=models.CASCADE,
        related_name="audit_logs",
        null=True,
        blank=True,
    )
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    action = models.CharField(max_length=50)
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100)
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()

    class Meta:
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["tenant", "timestamp"]),
            models.Index(fields=["tenant", "user", "timestamp"]),
            models.Index(fields=["tenant", "resource_type", "resource_id"]),
        ]
        app_label = 'common'

    def __str__(self):
        return f"{self.action} {self.resource_type} {self.resource_id} by {self.user.get_full_name()}"
