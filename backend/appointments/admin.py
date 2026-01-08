"""
Django Admin für Appointments App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Appointment, Attendee


class AttendeeInline(admin.TabularInline):
    """Attendee Inline Admin"""
    model = Attendee
    extra = 0
    fields = ('name', 'email', 'role', 'status')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Appointment Admin"""
    
    list_display = ('title', 'type', 'status', 'start_datetime', 'end_datetime', 'tenant', 'created_at')
    list_filter = ('type', 'status', 'tenant', 'start_datetime', 'created_at')
    search_fields = ('title', 'description', 'location', 'created_by__email')
    ordering = ('-start_datetime',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('tenant', 'title', 'description', 'type', 'status')
        }),
        (_('Schedule'), {
            'fields': ('start_datetime', 'end_datetime', 'created_by')
        }),
        (_('Location'), {
            'fields': ('location',)
        }),
        (_('Related Objects'), {
            'fields': ('property_id', 'property_title', 'contact_id', 'contact_name')
        }),
        (_('Important dates'), {
            'fields': ('id', 'created_at', 'updated_at')
        }),
    )
    
    inlines = [AttendeeInline]


@admin.register(Attendee)
class AttendeeAdmin(admin.ModelAdmin):
    """Attendee Admin"""
    
    list_display = ('appointment', 'name', 'email', 'status', 'role')
    list_filter = ('status', 'role')
    search_fields = ('appointment__title', 'email', 'name')
    ordering = ('-appointment__start_datetime',)
    readonly_fields = ('id',)
