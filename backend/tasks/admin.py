"""
Django Admin für Tasks App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    Task, TaskLabel, TaskComment, TaskSubtask, TaskAttachment, TaskActivity,
    Project, Board, BoardStatus, TaskPriority, TaskStatus
)


class TaskCommentInline(admin.TabularInline):
    """Task Comment Inline Admin"""
    model = TaskComment
    extra = 0
    fields = ('author', 'text', 'timestamp', 'parent')
    readonly_fields = ('timestamp',)


class TaskSubtaskInline(admin.TabularInline):
    """Task Subtask Inline Admin"""
    model = TaskSubtask
    extra = 0
    fields = ('title', 'completed', 'order', 'assignee', 'due_date')


class TaskAttachmentInline(admin.TabularInline):
    """Task Attachment Inline Admin"""
    model = TaskAttachment
    extra = 0
    fields = ('name', 'url', 'mime_type', 'size', 'uploaded_by', 'uploaded_at')
    readonly_fields = ('uploaded_at',)


class TaskActivityInline(admin.TabularInline):
    """Task Activity Inline Admin"""
    model = TaskActivity
    extra = 0
    fields = ('user', 'action', 'created_at', 'details')
    readonly_fields = ('created_at',)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Project Admin"""
    
    list_display = ('name', 'tenant', 'color', 'created_at', 'updated_at')
    list_filter = ('tenant', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    """Board Admin"""
    
    list_display = ('name', 'project', 'tenant', 'team', 'wip_limit', 'created_by', 'created_at')
    list_filter = ('tenant', 'project', 'team', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(BoardStatus)
class BoardStatusAdmin(admin.ModelAdmin):
    """Board Status Admin"""
    
    list_display = ('title', 'board', 'key', 'order', 'wip_limit', 'is_terminal')
    list_filter = ('board', 'is_terminal')
    search_fields = ('title', 'key')
    ordering = ('board', 'order')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Task Admin"""
    
    list_display = ('title', 'status', 'priority', 'assignee', 'project', 'board', 'due_date', 'tenant', 'created_at')
    list_filter = ('status', 'priority', 'tenant', 'project', 'board', 'assignee', 'created_at')
    search_fields = ('title', 'description', 'property_id', 'financing_status')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    filter_horizontal = ('labels',)

    fieldsets = (
        (_('Basic Information'), {
            'fields': ('tenant', 'project', 'board', 'title', 'description')
        }),
        (_('Status & Priority'), {
            'fields': ('status', 'priority', 'assignee', 'due_date', 'start_date', 'archived')
        }),
        (_('Progress & Estimation'), {
            'fields': ('progress', 'estimated_hours', 'actual_hours', 'story_points')
        }),
        (_('AI & Impact'), {
            'fields': ('ai_score', 'impact_score', 'effort_score', 'complexity')
        }),
        (_('Relationships'), {
            'fields': ('labels', 'tags', 'dependencies', 'property_id', 'financing_status')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
    inlines = [TaskCommentInline, TaskSubtaskInline, TaskAttachmentInline, TaskActivityInline]


@admin.register(TaskLabel)
class TaskLabelAdmin(admin.ModelAdmin):
    """Task Label Admin"""
    
    list_display = ('name', 'tenant', 'color')
    list_filter = ('tenant',)
    search_fields = ('name', 'description')
    ordering = ('tenant', 'name')
    readonly_fields = ('id',)


@admin.register(TaskActivity)
class TaskActivityAdmin(admin.ModelAdmin):
    """Task Activity Admin"""
    
    list_display = ('task', 'user', 'action', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('task__title', 'user__email', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
