"""
Django Admin für Contacts App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """Contact Admin"""

    list_display = ('name', 'email', 'phone', 'company', 'status', 'priority', 'tenant', 'created_at')
    list_filter = ('status', 'priority', 'category', 'tenant', 'created_at')
    search_fields = ('name', 'email', 'phone', 'company', 'location', 'notes')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('tenant', 'name', 'email', 'phone', 'company', 'avatar')}),
        (_('Classification'), {
            'fields': ('category', 'status', 'priority', 'lead_score', 'lead_score_details')
        }),
        (_('Location & Preferences'), {
            'fields': ('location', 'address', 'preferences')
        }),
        (_('Financial'), {
            'fields': ('budget', 'budget_currency', 'budget_min', 'budget_max')
        }),
        (_('Additional Info'), {
            'fields': ('additional_info', 'notes', 'last_contact')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
