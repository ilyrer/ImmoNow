"""
Django Admin für SLA App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import SLA, SLAInstance


@admin.register(SLA)
class SLAAdmin(admin.ModelAdmin):
    """SLA Admin"""

    list_display = ('name', 'tenant', 'sla_type', 'time_limit_hours', 'is_active', 'created_at')
    list_filter = ('sla_type', 'is_active', 'tenant', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('tenant', 'name', 'description')}),
        (_('Configuration'), {
            'fields': ('sla_type', 'time_limit_hours', 'applies_to')
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(SLAInstance)
class SLAInstanceAdmin(admin.ModelAdmin):
    """SLA Instance Admin"""

    list_display = ('sla', 'task', 'status', 'deadline', 'breached_at', 'resolved_at')
    list_filter = ('status', 'sla', 'breached_at', 'resolved_at')
    search_fields = ('sla__name', 'task__title')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'started_at', 'deadline', 'paused_at', 'resolved_at', 'breached_at')
