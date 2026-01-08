"""
Automation Models
"""
import uuid
from django.db import models
from django.utils import timezone

from .tenant import Tenant
from .user import User


class AutomationRule(models.Model):
    """Automation Rule: Trigger → Conditions → Actions"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="automation_rules")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # Trigger: Event-Type (z.B. "task.status_changed", "task.created")
    trigger = models.CharField(max_length=100)
    
    # Conditions: JSON Array of conditions
    # Format: [{"field": "status", "operator": "equals", "value": "done"}, ...]
    conditions = models.JSONField(default=list, blank=True)
    
    # Actions: JSON Array of actions
    # Format: [{"type": "assign_user", "params": {"user_id": "..."}}, ...]
    actions = models.JSONField(default=list, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_automations", blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Execution stats
    execution_count = models.IntegerField(default=0)
    last_executed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = "automation_rules"
        indexes = [
            models.Index(fields=["tenant", "trigger"]),
            models.Index(fields=["tenant", "is_active"]),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.trigger})"


class AutomationLog(models.Model):
    """Execution Log für Automation Rules"""
    
    STATUS_CHOICES = [
        ("success", "Success"),
        ("failed", "Failed"),
        ("skipped", "Skipped"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    automation_rule = models.ForeignKey(
        AutomationRule, on_delete=models.CASCADE, related_name="execution_logs"
    )
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="automation_logs")
    
    # Event that triggered this execution
    trigger_event = models.CharField(max_length=100)
    event_payload = models.JSONField(default=dict, blank=True)
    
    # Execution result
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="success")
    error_message = models.TextField(blank=True, null=True)
    
    # Execution details
    conditions_met = models.BooleanField(default=True)
    actions_executed = models.JSONField(default=list, blank=True)
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    execution_time_ms = models.IntegerField(blank=True, null=True)
    
    class Meta:
        db_table = "automation_logs"
        indexes = [
            models.Index(fields=["automation_rule", "started_at"]),
            models.Index(fields=["tenant", "started_at"]),
            models.Index(fields=["status"]),
        ]
        ordering = ["-started_at"]
    
    def __str__(self):
        return f"{self.automation_rule.name} - {self.status} ({self.started_at})"

