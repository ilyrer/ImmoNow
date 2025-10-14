from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, TenantUser, Tenant, Property, Contact, Task, Document

# Register your models here.

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin"""
    
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'email_verified', 'created_at')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    # Remove fieldsets that don't exist in our custom User model
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone', 'avatar')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'email_verified'),
        }),
        (_('Preferences'), {'fields': ('language', 'timezone')}),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    
    # Remove filter_horizontal since we don't have groups/user_permissions
    filter_horizontal = ()


@admin.register(TenantUser)
class TenantUserAdmin(admin.ModelAdmin):
    """Tenant User Admin"""
    
    list_display = ('user', 'tenant', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'tenant', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'tenant__name')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('user', 'tenant', 'role')}),
        (_('Permissions'), {
            'fields': ('can_manage_properties', 'can_manage_documents', 'can_manage_users', 
                      'can_view_analytics', 'can_export_data'),
        }),
        (_('Status'), {'fields': ('is_active', 'invited_at', 'joined_at', 'invited_by')}),
        (_('Important dates'), {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'invited_at')


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """Tenant Admin"""
    
    list_display = ('name', 'slug', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'slug', 'description')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('name', 'slug', 'description')}),
        (_('Settings'), {'fields': ('is_active', 'settings')}),
        (_('Important dates'), {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ('created_at', 'updated_at')


# Register other models with basic admin
admin.site.register(Property)
admin.site.register(Contact)
admin.site.register(Task)
admin.site.register(Document)
