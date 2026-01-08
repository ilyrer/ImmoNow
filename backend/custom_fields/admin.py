"""
Django Admin für Custom Fields App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import CustomField, CustomFieldValue


@admin.register(CustomField)
class CustomFieldAdmin(admin.ModelAdmin):
    """Custom Field Admin"""

    list_display = ('name', 'key', 'field_type', 'resource_type', 'tenant', 'is_active', 'order')
    list_filter = ('field_type', 'resource_type', 'is_active', 'tenant')
    search_fields = ('name', 'key', 'description')
    ordering = ('resource_type', 'order', 'name')
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('tenant', 'name', 'key', 'field_type', 'resource_type')}),
        (_('Configuration'), {
            'fields': ('description', 'required', 'default_value', 'options')
        }),
        (_('Status & Order'), {
            'fields': ('is_active', 'order')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(CustomFieldValue)
class CustomFieldValueAdmin(admin.ModelAdmin):
    """Custom Field Value Admin"""

    list_display = ('custom_field', 'resource_type', 'resource_id', 'value', 'tenant', 'created_at')
    list_filter = ('resource_type', 'custom_field__field_type', 'tenant', 'created_at')
    search_fields = ('custom_field__name', 'resource_id', 'value')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
