"""
Django Admin für Properties App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    Property, Address, ContactPerson, PropertyFeatures,
    PropertyImage, PropertyDocument, PropertyMetrics,
    PropertyMetricsSnapshot, ExposeVersion, PublishJob,
    IntegrationSettings,
)


class AddressInline(admin.StackedInline):
    """Address Inline Admin"""
    model = Address
    extra = 0
    fields = ('street', 'house_number', 'city', 'zip_code', 'state', 'country')


class ContactPersonInline(admin.TabularInline):
    """Contact Person Inline Admin"""
    model = ContactPerson
    extra = 0
    fields = ('name', 'email', 'phone', 'role')


class PropertyImageInline(admin.TabularInline):
    """Property Image Inline Admin"""
    model = PropertyImage
    extra = 0
    fields = ('url', 'alt_text', 'order', 'is_primary')


class PropertyDocumentInline(admin.TabularInline):
    """Property Document Inline Admin"""
    model = PropertyDocument
    extra = 0
    fields = ('name', 'document_type', 'url', 'uploaded_by')
    readonly_fields = ('uploaded_at',)


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    """Property Admin"""
    
    list_display = ('title', 'property_type', 'status', 'price', 'living_area', 'rooms', 'tenant', 'created_at')
    list_filter = ('property_type', 'status', 'tenant', 'created_at', 'updated_at')
    search_fields = ('title', 'description', 'location', 'address__street', 'address__city', 'address__postal_code')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (_('Basic Information'), {
            'fields': ('tenant', 'title', 'description', 'property_type', 'status', 'price', 'price_currency', 'price_type')
        }),
        (_('Location'), {
            'fields': ('location', 'coordinates_lat', 'coordinates_lng')
        }),
        (_('Area & Rooms'), {
            'fields': ('living_area', 'total_area', 'plot_area', 'rooms', 'bedrooms', 'bathrooms', 'floors')
        }),
        (_('Building Info'), {
            'fields': ('year_built', 'energy_class', 'energy_consumption', 'heating_type')
        }),
        (_('Energy Certificate'), {
            'fields': ('energy_certificate_type', 'energy_certificate_valid_until', 'energy_certificate_issue_date', 'co2_emissions')
        }),
        (_('Additional Data'), {
            'fields': ('amenities', 'tags')
        }),
        (_('Auto-Publish Settings'), {
            'fields': ('auto_publish_enabled', 'auto_publish_portals', 'auto_publish_interval_hours', 'last_auto_published_at')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
    
    inlines = [AddressInline, ContactPersonInline, PropertyImageInline, PropertyDocumentInline]


@admin.register(PropertyFeatures)
class PropertyFeaturesAdmin(admin.ModelAdmin):
    """Property Features Admin"""
    
    list_display = ('property', 'bedrooms', 'bathrooms', 'year_built', 'balcony', 'garden', 'elevator', 'parking_spaces')
    list_filter = ('balcony', 'garden', 'elevator', 'parking_spaces')
    search_fields = ('property__title',)
    ordering = ('-property__created_at',)
    readonly_fields = ('id',)


@admin.register(PropertyMetrics)
class PropertyMetricsAdmin(admin.ModelAdmin):
    """Property Metrics Admin"""
    
    list_display = ('property', 'total_views', 'total_inquiries', 'total_favorites', 'conversion_rate', 'last_synced_at')
    list_filter = ('last_synced_at',)
    search_fields = ('property__title',)
    ordering = ('-last_synced_at',)
    readonly_fields = ('id', 'property', 'total_views', 'total_inquiries', 'total_favorites',
                      'total_clicks', 'total_visits', 'conversion_rate', 'avg_view_duration',
                      'immoscout_views', 'immoscout_inquiries', 'immoscout_favorites',
                      'immowelt_views', 'immowelt_inquiries', 'immowelt_favorites',
                      'last_synced_at', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('property', 'last_synced_at')}),
        (_('Totals'), {
            'fields': ('total_views', 'total_inquiries', 'total_favorites', 'total_clicks', 'total_visits')
        }),
        (_('Calculated'), {
            'fields': ('conversion_rate', 'avg_view_duration')
        }),
        (_('ImmoScout24 Metrics'), {
            'fields': ('immoscout_views', 'immoscout_inquiries', 'immoscout_favorites')
        }),
        (_('Immowelt Metrics'), {
            'fields': ('immowelt_views', 'immowelt_inquiries', 'immowelt_favorites')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )


@admin.register(PropertyMetricsSnapshot)
class PropertyMetricsSnapshotAdmin(admin.ModelAdmin):
    """Property Metrics Snapshot Admin"""
    
    list_display = ('property', 'date', 'views', 'inquiries', 'favorites')
    list_filter = ('date',)
    search_fields = ('property__title',)
    ordering = ('-date',)
    readonly_fields = ('id', 'property', 'date', 'views', 'inquiries', 'favorites', 'clicks', 'visits',
                      'immoscout_views', 'immoscout_inquiries', 'immowelt_views', 'immowelt_inquiries', 'created_at')


@admin.register(ExposeVersion)
class ExposeVersionAdmin(admin.ModelAdmin):
    """Expose Version Admin"""
    
    list_display = ('property', 'title', 'audience', 'tone', 'language', 'status', 'version_number', 'created_at')
    list_filter = ('audience', 'tone', 'language', 'status', 'created_at')
    search_fields = ('property__title', 'title', 'content')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(PublishJob)
class PublishJobAdmin(admin.ModelAdmin):
    """Publish Job Admin"""
    
    list_display = ('property', 'portal', 'status', 'portal_property_id', 'published_at', 'created_at')
    list_filter = ('portal', 'status', 'published_at', 'created_at')
    search_fields = ('property__title', 'portal_property_id', 'error_message')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(IntegrationSettings)
class IntegrationSettingsAdmin(admin.ModelAdmin):
    """Integration Settings Admin"""
    
    list_display = ('tenant', 'created_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('tenant__name', 'created_by__email')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('tenant', 'created_by')}),
        (_('Google Maps'), {'fields': ('google_maps_api_key',)}),
        (_('ImmoScout24'), {'fields': ('immoscout_client_id', 'immoscout_client_secret', 'immoscout_access_token', 
                                      'immoscout_refresh_token', 'immoscout_token_expires_at')}),
        (_('eBay Kleinanzeigen'), {'fields': ('ebay_api_key',)}),
        (_('Important dates'), {'fields': ('id', 'created_at', 'updated_at')}),
    )
