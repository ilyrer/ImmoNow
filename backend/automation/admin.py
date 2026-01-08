"""
Django Admin für Automation App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import AutomationRule, AutomationLog


@admin.register(AutomationRule)
class AutomationRuleAdmin(admin.ModelAdmin):
    """Automation Rule Admin"""
    
    list_display = ('name', 'tenant', 'trigger', 'is_active', 'execution_count', 'last_executed_at')
    list_filter = ('trigger', 'is_active', 'tenant', 'created_at')
    search_fields = ('name', 'description', 'trigger')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'execution_count', 'last_executed_at')

    fieldsets = (
        (None, {'fields': ('tenant', 'name', 'description')}),
        (_('Logic'), {
            'fields': ('trigger', 'conditions', 'actions')
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Execution Info'), {
            'fields': ('execution_count', 'last_executed_at')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(AutomationLog)
class AutomationLogAdmin(admin.ModelAdmin):
    """Automation Log Admin"""
    
    list_display = ('automation_rule', 'tenant', 'trigger_event', 'status', 'started_at', 'execution_time_ms')
    list_filter = ('status', 'trigger_event', 'tenant', 'started_at')
    search_fields = ('automation_rule__name', 'trigger_event', 'error_message')
    ordering = ('-started_at',)
    readonly_fields = ('id', 'automation_rule', 'tenant', 'trigger_event', 'event_payload', 'status',
                       'error_message', 'conditions_met', 'actions_executed', 'started_at', 'completed_at',
                       'execution_time_ms')
    
    def has_add_permission(self, request):
        """Automation logs are created automatically"""
        return False
