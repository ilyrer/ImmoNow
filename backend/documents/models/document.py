"""
Document Models
"""
import uuid
from django.db import models


class DocumentFolder(models.Model):
    """Document folder model"""

    id = models.AutoField(primary_key=True)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="document_folders"
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="subfolders",
    )
    color = models.CharField(max_length=7, default="#3B82F6")  # Hex color
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_system = models.BooleanField(default=False)
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "document_folders"
        indexes = [
            models.Index(fields=["tenant", "parent"]),
            models.Index(fields=["tenant", "name"]),
        ]
        app_label = 'documents'

    def __str__(self):
        return self.name


class Document(models.Model):
    """Document model"""

    DOCUMENT_TYPES = [
        ("contract", "Contract"),
        ("expose", "Expose"),
        ("energy_certificate", "Energy Certificate"),
        ("floor_plan", "Floor Plan"),
        ("photo", "Photo"),
        ("video", "Video"),
        ("document", "Document"),
        ("presentation", "Presentation"),
        ("spreadsheet", "Spreadsheet"),
        ("pdf", "PDF"),
        ("other", "Other"),
    ]

    DOCUMENT_CATEGORIES = [
        ("legal", "Legal"),
        ("marketing", "Marketing"),
        ("technical", "Technical"),
        ("financial", "Financial"),
        ("administrative", "Administrative"),
        ("other", "Other"),
    ]

    DOCUMENT_STATUSES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
        ("deleted", "Deleted"),
    ]

    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("private", "Private"),
        ("team", "Team"),
        ("restricted", "Restricted"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="documents"
    )
    name = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    category = models.CharField(max_length=50, choices=DOCUMENT_CATEGORIES)
    status = models.CharField(
        max_length=50, choices=DOCUMENT_STATUSES, default="active"
    )
    visibility = models.CharField(
        max_length=20, choices=VISIBILITY_CHOICES, default="private"
    )
    size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    url = models.URLField()
    thumbnail_url = models.URLField(blank=True, null=True)
    checksum = models.CharField(max_length=64, blank=True, null=True)  # SHA256 hash
    search_vector = models.TextField(blank=True, null=True)  # For full-text search
    ocr_text = models.TextField(blank=True, null=True)  # OCR extracted text
    property_id = models.UUIDField(blank=True, null=True)
    property_title = models.CharField(max_length=255, blank=True, null=True)
    contact_id = models.UUIDField(blank=True, null=True)
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    uploaded_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    tags = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True, null=True)
    expiry_date = models.DateTimeField(blank=True, null=True)
    is_favorite = models.BooleanField(default=False)
    view_count = models.IntegerField(default=0)
    download_count = models.IntegerField(default=0)
    folder = models.ForeignKey(
        DocumentFolder, on_delete=models.SET_NULL, blank=True, null=True
    )

    class Meta:
        db_table = "documents"
        indexes = [
            models.Index(fields=["tenant", "type"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "uploaded_at"]),
            models.Index(fields=["tenant", "folder"]),
            models.Index(fields=["tenant", "is_favorite"]),
        ]
        app_label = 'documents'

    def __str__(self):
        return self.title


class DocumentVersion(models.Model):
    """Document version model for versioning"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name="versions"
    )
    version_number = models.IntegerField()
    file_url = models.URLField()
    file_size = models.BigIntegerField()
    checksum = models.CharField(max_length=64)  # SHA256 hash
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    change_notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "document_versions"
        indexes = [
            models.Index(fields=["document", "version_number"]),
            models.Index(fields=["document", "created_at"]),
        ]
        unique_together = ["document", "version_number"]
        app_label = 'documents'

    def __str__(self):
        return f"{self.document.title} v{self.version_number}"
