"""
Django Admin für Common App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Audit Log Admin"""
    
    list_display = ('timestamp', 'tenant', 'user', 'action', 'resource_type', 'resource_id')
    list_filter = ('action', 'resource_type', 'tenant', 'timestamp')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'resource_id')
    ordering = ('-timestamp',)
    readonly_fields = ('id', 'timestamp', 'tenant', 'user', 'action', 'resource_type', 'resource_id', 'old_values', 'new_values', 'ip_address', 'user_agent')

    fieldsets = (
        (None, {'fields': ('tenant', 'user', 'action', 'timestamp')}),
        (_('Resource'), {'fields': ('resource_type', 'resource_id')}),
        (_('Changes'), {'fields': ('old_values', 'new_values')}),
        (_('Context'), {'fields': ('ip_address', 'user_agent')}),
    )
    
    def has_add_permission(self, request):
        """Audit logs are created automatically"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Audit logs are read-only"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Audit logs should not be deleted"""
        return False
