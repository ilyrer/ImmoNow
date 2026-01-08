"""
SLA Models
"""
import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta

from .tenant import Tenant
from .user import User


class SLA(models.Model):
    """Service Level Agreement Definition"""
    
    SLA_TYPE_CHOICES = [
        ("first_response", "First Response Time"),
        ("resolution", "Resolution Time"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="slas")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # SLA-Typ
    sla_type = models.CharField(max_length=50, choices=SLA_TYPE_CHOICES)
    
    # Time Limit (in Stunden)
    time_limit_hours = models.IntegerField(help_text="Time limit in hours")
    
    # Applies To: Board, Status, Priority, etc. (JSON)
    # Format: {"board_id": "...", "status": "...", "priority": "..."}
    applies_to = models.JSONField(default=dict, blank=True)
    
    # Metadata
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_slas", blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = "slas"
        indexes = [
            models.Index(fields=["tenant", "is_active"]),
            models.Index(fields=["sla_type"]),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.sla_type})"


class SLAInstance(models.Model):
    """SLA Instance für einen Task"""
    
    STATUS_CHOICES = [
        ("active", "Active"),
        ("paused", "Paused"),
        ("breached", "Breached"),
        ("resolved", "Resolved"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sla = models.ForeignKey(SLA, on_delete=models.CASCADE, related_name="instances")
    task = models.ForeignKey("Task", on_delete=models.CASCADE, related_name="sla_instances")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="sla_instances")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    
    # Timing
    started_at = models.DateTimeField()
    deadline = models.DateTimeField()
    paused_at = models.DateTimeField(blank=True, null=True)
    paused_duration_seconds = models.IntegerField(default=0, help_text="Total paused duration in seconds")
    resolved_at = models.DateTimeField(blank=True, null=True)
    breached_at = models.DateTimeField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "sla_instances"
        indexes = [
            models.Index(fields=["sla", "status"]),
            models.Index(fields=["task"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["deadline"]),
        ]
    
    def __str__(self):
        return f"{self.sla.name} → {self.task.title} ({self.status})"
    
    def get_remaining_time_hours(self) -> float:
        """Gibt verbleibende Zeit in Stunden zurück"""
        if self.status == "resolved" or self.status == "breached":
            return 0.0
        
        now = timezone.now()
        if self.status == "paused" and self.paused_at:
            # Berechne mit Pause
            elapsed = (self.paused_at - self.started_at).total_seconds() - self.paused_duration_seconds
        else:
            elapsed = (now - self.started_at).total_seconds() - self.paused_duration_seconds
        
        remaining = (self.deadline - self.started_at).total_seconds() - elapsed
        return max(0.0, remaining / 3600.0)
    
    def is_breached(self) -> bool:
        """Prüft ob SLA gebrochen wurde"""
        if self.status == "breached":
            return True
        
        if self.status == "resolved":
            return False
        
        now = timezone.now()
        if now > self.deadline:
            return True
        
        return False

