"""
Django Admin für Notifications App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Notification Admin"""

    list_display = ('title', 'user', 'tenant', 'type', 'category', 'priority', 'read', 'created_at')
    list_filter = ('type', 'category', 'priority', 'read', 'archived', 'tenant', 'created_at')
    search_fields = ('title', 'message', 'user__email', 'tenant__name')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'read_at', 'archived_at')

    fieldsets = (
        (None, {'fields': ('tenant', 'user', 'title', 'message')}),
        (_('Classification'), {
            'fields': ('type', 'category', 'priority')
        }),
        (_('Status'), {
            'fields': ('read', 'read_at', 'archived', 'archived_at')
        }),
        (_('Action'), {
            'fields': ('action_url', 'action_label')
        }),
        (_('Related Entity'), {
            'fields': ('related_entity_type', 'related_entity_id')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """Notification Preference Admin"""

    list_display = ('user', 'tenant', 'category', 'enabled', 'created_at')
    list_filter = ('category', 'enabled', 'tenant', 'created_at')
    search_fields = ('user__email', 'tenant__name')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
