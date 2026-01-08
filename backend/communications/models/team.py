"""
Team and Channel Models
"""
import uuid
from django.db import models


class Team(models.Model):
    """Team of users for communication context"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('accounts.Tenant', on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="teams_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "teams"
        unique_together = [["tenant", "name"]]
        indexes = [
            models.Index(fields=["tenant", "name"]),
        ]
        app_label = 'communications'

    def __str__(self):
        return self.name


class Channel(models.Model):
    """Channel within a team for messaging"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="channels"
    )
    team = models.ForeignKey(
        Team, on_delete=models.CASCADE, related_name="channels", null=True, blank=True
    )
    name = models.CharField(max_length=120)
    topic = models.CharField(max_length=255, blank=True, null=True)
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="channels_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "channels"
        unique_together = [["tenant", "name", "team"]]
        indexes = [
            models.Index(fields=["tenant", "team"]),
            models.Index(fields=["tenant", "is_private"]),
        ]
        app_label = 'communications'

    def __str__(self):
        return self.name


class ChannelMembership(models.Model):
    """Membership with role for channel"""

    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("member", "Member"),
        ("guest", "Guest"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="channel_memberships"
    )
    channel = models.ForeignKey(
        Channel, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="channel_memberships"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "channel_memberships"
        unique_together = [["channel", "user"]]
        indexes = [
            models.Index(fields=["tenant", "channel"]),
            models.Index(fields=["tenant", "user"]),
        ]
        app_label = 'communications'

    def __str__(self):
        return f"{self.user.email} in {self.channel.name}"
