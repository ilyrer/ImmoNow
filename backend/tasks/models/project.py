"""
Project and Board Models
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Project(models.Model):
    """Projekt innerhalb eines Tenants (Workspace)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="projects"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default="#0A84FF")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects"
        unique_together = ["tenant", "name"]
        indexes = [
            models.Index(fields=["tenant", "name"]),
        ]
        app_label = 'tasks'

    def __str__(self):
        return self.name


class Board(models.Model):
    """Board pro Projekt/Team mit konfigurierbaren Status/WIP."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('accounts.Tenant', on_delete=models.CASCADE, related_name="boards")
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="boards", blank=True, null=True
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    team = models.CharField(max_length=100, blank=True, null=True)
    wip_limit = models.IntegerField(
        blank=True, null=True, validators=[MinValueValidator(1), MaxValueValidator(500)]
    )
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name="created_boards"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "boards"
        indexes = [
            models.Index(fields=["tenant", "project"]),
            models.Index(fields=["tenant", "name"]),
        ]
        unique_together = ["tenant", "name"]
        app_label = 'tasks'

    def __str__(self):
        return self.name


class BoardStatus(models.Model):
    """Konfigurierter Status pro Board (inkl. Reihenfolge/WIP/Transition)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="statuses")
    key = models.CharField(max_length=50)  # z.B. todo, in_progress
    title = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default="#8E8E93")
    order = models.IntegerField(default=0)
    wip_limit = models.IntegerField(
        blank=True, null=True, validators=[MinValueValidator(1), MaxValueValidator(500)]
    )
    is_terminal = models.BooleanField(default=False)
    allow_from = models.JSONField(default=list, blank=True)  # erlaubte Vorgänger
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "board_statuses"
        unique_together = ["board", "key"]
        indexes = [
            models.Index(fields=["board", "order"]),
            models.Index(fields=["board", "key"]),
        ]
        app_label = 'tasks'

    def __str__(self):
        return f"{self.board.name}:{self.title}"
