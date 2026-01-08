"""
Django Admin für Documents App
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    Document, DocumentFolder, DocumentVersion,
    DocumentActivity, DocumentComment,
)


class DocumentVersionInline(admin.TabularInline):
    """Document Version Inline Admin"""
    model = DocumentVersion
    extra = 0
    fields = ('version_number', 'file_url', 'file_size', 'created_by', 'created_at')
    readonly_fields = ('created_at',)


# DocumentActivityInline entfernt: DocumentActivity hat kein ForeignKey zu Document
# (nur document_id als UUIDField)
# DocumentCommentInline entfernt: DocumentComment hat kein ForeignKey zu Document
# (nur document_id als UUIDField)


@admin.register(DocumentFolder)
class DocumentFolderAdmin(admin.ModelAdmin):
    """Document Folder Admin"""

    list_display = ('name', 'tenant', 'parent', 'is_system', 'created_by', 'created_at')
    list_filter = ('is_system', 'tenant', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('tenant', 'name')
    readonly_fields = ('id', 'created_at')


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """Document Admin"""

    list_display = ('title', 'type', 'category', 'status', 'tenant', 'uploaded_by', 'uploaded_at', 'version')
    list_filter = ('type', 'category', 'status', 'visibility', 'tenant', 'uploaded_at')
    search_fields = ('title', 'name', 'description', 'ocr_text', 'property_title', 'contact_name')
    ordering = ('-uploaded_at',)
    readonly_fields = ('id', 'uploaded_at', 'created_at', 'last_modified', 'checksum', 'search_vector', 'ocr_text', 'view_count', 'download_count')

    fieldsets = (
        (_('Basic Information'), {
            'fields': ('tenant', 'folder', 'title', 'name', 'original_name', 'description')
        }),
        (_('Classification'), {
            'fields': ('type', 'category', 'status', 'visibility', 'tags')
        }),
        (_('File Details'), {
            'fields': ('url', 'thumbnail_url', 'mime_type', 'size', 'checksum')
        }),
        (_('Content'), {
            'fields': ('ocr_text', 'search_vector')
        }),
        (_('Related Objects'), {
            'fields': ('property_id', 'property_title', 'contact_id', 'contact_name')
        }),
        (_('Audit & Usage'), {
            'fields': ('uploaded_by', 'view_count', 'download_count', 'is_favorite')
        }),
        (_('Versioning & Dates'), {
            'fields': ('version', 'expiry_date', 'uploaded_at', 'created_at', 'last_modified')
        }),
    )
    inlines = [DocumentVersionInline]


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    """Document Version Admin"""

    list_display = ('document', 'version_number', 'created_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('document__title', 'created_by__email')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at')


@admin.register(DocumentActivity)
class DocumentActivityAdmin(admin.ModelAdmin):
    """Document Activity Admin"""

    list_display = ('document_id', 'action', 'user', 'timestamp', 'tenant')
    list_filter = ('action', 'tenant', 'timestamp')
    search_fields = ('document_id', 'user__email', 'details')
    ordering = ('-timestamp',)
    readonly_fields = ('id', 'timestamp')


@admin.register(DocumentComment)
class DocumentCommentAdmin(admin.ModelAdmin):
    """Document Comment Admin"""

    list_display = ('document_id', 'author', 'created_at', 'tenant')
    list_filter = ('tenant', 'created_at')
    search_fields = ('document_id', 'author__email', 'text')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
