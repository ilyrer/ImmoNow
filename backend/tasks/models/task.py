"""
Task Models
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class TaskPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    URGENT = "urgent", "Urgent"


class TaskStatus(models.TextChoices):
    BACKLOG = "backlog", "Backlog"
    TODO = "todo", "To Do"
    IN_PROGRESS = "in_progress", "In Progress"
    REVIEW = "review", "Review"
    DONE = "done", "Done"
    BLOCKED = "blocked", "Blocked"
    ON_HOLD = "on_hold", "On Hold"
    CANCELLED = "cancelled", "Cancelled"


class Task(models.Model):
    """Task model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('accounts.Tenant', on_delete=models.CASCADE, related_name="tasks")
    project = models.ForeignKey(
        'tasks.Project', on_delete=models.CASCADE, related_name="tasks", blank=True, null=True
    )
    board = models.ForeignKey(
        'tasks.Board', on_delete=models.CASCADE, related_name="tasks", blank=True, null=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(
        max_length=20, choices=TaskPriority.choices, default=TaskPriority.MEDIUM
    )
    status = models.CharField(
        max_length=30, choices=TaskStatus.choices, default=TaskStatus.TODO
    )
    assignee = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="assigned_tasks"
    )
    due_date = models.DateTimeField()
    start_date = models.DateTimeField(blank=True, null=True)
    progress = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    estimated_hours = models.IntegerField(
        default=1, validators=[MinValueValidator(1), MaxValueValidator(1000)]
    )
    actual_hours = models.IntegerField(
        blank=True, null=True, validators=[MinValueValidator(0)]
    )
    tags = models.JSONField(default=list, blank=True)
    labels = models.ManyToManyField("TaskLabel", related_name="tasks", blank=True)
    property_id = models.UUIDField(blank=True, null=True)
    financing_status = models.CharField(max_length=50, blank=True, null=True)
    story_points = models.IntegerField(
        blank=True, null=True, validators=[MinValueValidator(0), MaxValueValidator(200)]
    )
    ai_score = models.FloatField(blank=True, null=True)
    impact_score = models.FloatField(blank=True, null=True)
    effort_score = models.FloatField(blank=True, null=True)
    complexity = models.CharField(max_length=50, blank=True, null=True)
    dependencies = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="created_tasks"
    )
    archived = models.BooleanField(default=False)

    class Meta:
        db_table = "tasks"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "priority"]),
            models.Index(fields=["tenant", "assignee"]),
            models.Index(fields=["tenant", "project"]),
            models.Index(fields=["tenant", "board"]),
            models.Index(fields=["tenant", "due_date"]),
            models.Index(fields=["tenant", "created_at"]),
        ]
        app_label = 'tasks'

    def __str__(self):
        return self.title


class TaskLabel(models.Model):
    """Task label model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="task_labels"
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#3B82F6")
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "task_labels"
        unique_together = ["tenant", "name"]
        app_label = 'tasks'

    def __str__(self):
        return self.name


class TaskComment(models.Model):
    """Task comment model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, blank=True, null=True, related_name="replies"
    )

    class Meta:
        db_table = "task_comments"
        indexes = [
            models.Index(fields=["task", "timestamp"]),
        ]
        app_label = 'tasks'

    def __str__(self):
        return f"Comment by {self.author.get_full_name()} on {self.task.title}"


class TaskSubtask(models.Model):
    """Subtasks/Checklisten für Tasks."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="subtasks")
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    assignee = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="subtasks", blank=True, null=True
    )
    due_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "task_subtasks"
        indexes = [
            models.Index(fields=["task", "order"]),
            models.Index(fields=["task", "completed"]),
        ]
        app_label = 'tasks'

    def __str__(self):
        return f"{self.title} ({'done' if self.completed else 'open'})"


class TaskAttachment(models.Model):
    """Anhänge zu Tasks."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="attachments")
    name = models.CharField(max_length=255)
    url = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    size = models.IntegerField(blank=True, null=True)
    uploaded_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "task_attachments"
        indexes = [
            models.Index(fields=["task"]),
        ]
        app_label = 'tasks'

    def __str__(self):
        return self.name


class TaskActivity(models.Model):
    """Activity/Audit-Log auf Task-Ebene."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="activities")
    action = models.CharField(
        max_length=50
    )  # created, updated, moved, comment, ai_proposed
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "task_activities"
        indexes = [
            models.Index(fields=["task", "created_at"]),
            models.Index(fields=["action"]),
        ]
        app_label = 'tasks'

    def __str__(self):
        return f"{self.action} ({self.task_id})"
