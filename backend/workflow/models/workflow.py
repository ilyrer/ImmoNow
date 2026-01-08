"""
Workflow Models
"""
import uuid
from django.db import models
from django.utils import timezone


class Workflow(models.Model):
    """Workflow-Definition mit Stages"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('accounts.Tenant', on_delete=models.CASCADE, related_name="workflows")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # Stages als JSON: [{id, name, order, transitions: [stage_id], is_terminal}]
    # Format: [{"id": "stage1", "name": "Intake", "order": 0, "transitions": ["stage2"], "is_terminal": false}, ...]
    stages = models.JSONField(default=list, blank=True)
    
    # Board-Verknüpfung (1:1 - ein Board hat einen Workflow)
    board = models.OneToOneField(
        'tasks.Board', 
        on_delete=models.SET_NULL, 
        related_name="workflow", 
        blank=True, 
        null=True
    )
    
    # Metadata
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="created_workflows", blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = "workflows"
        indexes = [
            models.Index(fields=["tenant", "is_active"]),
            models.Index(fields=["board"]),
        ]
        app_label = 'workflow'
    
    def __str__(self):
        return f"{self.name} ({len(self.stages)} stages)"


class WorkflowInstance(models.Model):
    """Workflow-Instance für einen Task"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(
        Workflow, on_delete=models.CASCADE, related_name="instances"
    )
    task = models.OneToOneField(
        'tasks.Task', on_delete=models.CASCADE, related_name="workflow_instance"
    )
    tenant = models.ForeignKey('accounts.Tenant', on_delete=models.CASCADE, related_name="workflow_instances")
    
    # Current Stage (ID aus workflow.stages)
    current_stage_id = models.CharField(max_length=100)
    
    # History: Liste von Stage-Transitions
    # Format: [{"from": "stage1", "to": "stage2", "timestamp": "...", "user_id": "..."}, ...]
    history = models.JSONField(default=list, blank=True)
    
    # Metadata
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = "workflow_instances"
        indexes = [
            models.Index(fields=["workflow", "current_stage_id"]),
            models.Index(fields=["task"]),
            models.Index(fields=["tenant"]),
        ]
        app_label = 'workflow'
    
    def __str__(self):
        return f"{self.workflow.name} → {self.task.title} ({self.current_stage_id})"
