"""
Django Admin für Accounts App
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, TenantUser, Tenant, UserProfile, Permission, Role, FeatureFlag


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin"""
    
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active', 'email_verified', 'created_at')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'email_verified', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    ordering = ('-created_at',)
    
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


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """Tenant Admin"""
    
    list_display = ('name', 'slug', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'slug', 'description')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('name', 'slug', 'description')}),
        (_('Settings'), {'fields': ('is_active', 'settings', 'storage_limit_gb')}),
        (_('Important dates'), {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ('id', 'created_at')


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


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """User Profile Admin"""
    
    list_display = ('user', 'tenant', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'tenant')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'tenant__name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    """Permission Admin"""
    
    list_display = ('name', 'category', 'description')
    list_filter = ('category',)
    search_fields = ('name', 'description')
    ordering = ('category', 'name')
    readonly_fields = ('id', 'created_at')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Role Admin"""
    
    list_display = ('name', 'tenant', 'is_system', 'created_at')
    list_filter = ('is_system', 'tenant', 'created_at')
    search_fields = ('name', 'description', 'tenant__name')
    ordering = ('-created_at',)
    filter_horizontal = ('permissions',)
    
    fieldsets = (
        (None, {'fields': ('name', 'description', 'tenant')}),
        (_('Permissions'), {'fields': ('permissions',)}),
        (_('Settings'), {'fields': ('is_system', 'created_by')}),
        (_('Important dates'), {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ('id', 'created_at')


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    """Feature Flag Admin"""
    
    list_display = ('name', 'tenant', 'is_enabled', 'rollout_percentage', 'created_at')
    list_filter = ('is_enabled', 'tenant')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')
