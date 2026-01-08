"""
Django Admin für Workflow App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Workflow, WorkflowInstance


@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin):
    """Workflow Admin"""

    list_display = ('name', 'tenant', 'board', 'is_active', 'created_at')
    list_filter = ('is_active', 'tenant', 'created_at')
    search_fields = ('name', 'description', 'board__name')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('tenant', 'name', 'description')}),
        (_('Configuration'), {
            'fields': ('stages', 'board')
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(WorkflowInstance)
class WorkflowInstanceAdmin(admin.ModelAdmin):
    """Workflow Instance Admin"""

    list_display = ('workflow', 'task', 'current_stage_id', 'tenant', 'started_at', 'completed_at')
    list_filter = ('current_stage_id', 'workflow', 'tenant', 'started_at', 'completed_at')
    search_fields = ('workflow__name', 'task__title', 'current_stage_id')
    ordering = ('-started_at',)
    readonly_fields = ('id', 'started_at', 'updated_at', 'completed_at')
