"""
Django Admin für Locations App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import LocationMarketData


@admin.register(LocationMarketData)
class LocationMarketDataAdmin(admin.ModelAdmin):
    """Location Market Data Admin"""

    list_display = ('city', 'state', 'postal_code_start', 'base_price_per_sqm', 'is_premium_location', 'is_active')
    list_filter = ('state', 'is_premium_location', 'is_suburban', 'location_type', 'is_active')
    search_fields = ('city', 'state', 'postal_code_start', 'postal_code_end')
    ordering = ('city', 'postal_code_start')
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('city', 'state', 'country')}),
        (_('Postal Codes'), {'fields': ('postal_code_start', 'postal_code_end')}),
        (_('Market Data'), {'fields': ('base_price_per_sqm', 'is_premium_location', 'is_suburban')}),
        (_('Metadata'), {'fields': ('population', 'location_type')}),
        (_('Status'), {'fields': ('is_active',)}),
        (_('Important dates'), {'fields': ('id', 'created_at', 'updated_at')}),
    )
