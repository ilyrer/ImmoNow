"""
Django Admin für Communications App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    Team, Channel, ChannelMembership, Message, Reaction,
    Attachment, ResourceLink, SocialAccount, SocialPost,
)


class ChannelMembershipInline(admin.TabularInline):
    """Channel Membership Inline Admin"""
    model = ChannelMembership
    extra = 0
    fields = ('user', 'role', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    """Team Admin"""

    list_display = ('name', 'tenant', 'created_by', 'created_at')
    list_filter = ('tenant', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    """Channel Admin"""

    list_display = ('name', 'team', 'tenant', 'is_private', 'created_by', 'created_at')
    list_filter = ('is_private', 'team', 'tenant', 'created_at')
    search_fields = ('name', 'topic', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [ChannelMembershipInline]


@admin.register(ChannelMembership)
class ChannelMembershipAdmin(admin.ModelAdmin):
    """Channel Membership Admin"""

    list_display = ('channel', 'user', 'role', 'tenant', 'created_at')
    list_filter = ('role', 'tenant', 'created_at')
    search_fields = ('channel__name', 'user__email')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')


class ReactionInline(admin.TabularInline):
    """Reaction Inline Admin"""
    model = Reaction
    extra = 0
    fields = ('user', 'emoji', 'created_at')
    readonly_fields = ('created_at',)


class AttachmentInline(admin.TabularInline):
    """Attachment Inline Admin"""
    model = Attachment
    extra = 0
    fields = ('file_name', 'file_url', 'file_type', 'file_size', 'created_at')
    readonly_fields = ('created_at',)


class ResourceLinkInline(admin.TabularInline):
    """Resource Link Inline Admin"""
    model = ResourceLink
    extra = 0
    fields = ('resource_type', 'resource_id', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    """Reaction Admin"""

    list_display = ('message', 'user', 'emoji', 'created_at')
    list_filter = ('emoji', 'created_at')
    search_fields = ('message__content', 'user__email')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    """Attachment Admin"""

    list_display = ('message', 'file_name', 'file_type', 'file_size', 'created_at')
    list_filter = ('file_type', 'created_at')
    search_fields = ('file_name', 'message__content')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')


@admin.register(ResourceLink)
class ResourceLinkAdmin(admin.ModelAdmin):
    """Resource Link Admin"""

    list_display = ('message', 'resource_type', 'resource_id', 'created_at')
    list_filter = ('resource_type', 'created_at')
    search_fields = ('message__content', 'resource_id')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')


@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    """Social Account Admin"""

    list_display = ('platform', 'account_name', 'tenant', 'is_active', 'created_by', 'last_sync_at')
    list_filter = ('platform', 'is_active', 'tenant')
    search_fields = ('account_name', 'account_label')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_sync_at', 'token_expires_at')


@admin.register(SocialPost)
class SocialPostAdmin(admin.ModelAdmin):
    """Social Post Admin"""

    list_display = ('account', 'status', 'scheduled_at', 'published_at', 'created_by')
    list_filter = ('status', 'account__platform', 'scheduled_at', 'published_at')
    search_fields = ('content',)
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'platform_post_id')
