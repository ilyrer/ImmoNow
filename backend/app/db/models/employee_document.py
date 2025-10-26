"""
Employee Document Models
Dokumentenverwaltung für Mitarbeiter
"""

import uuid
import os
from django.db import models
from django.core.validators import FileExtensionValidator
from django.utils import timezone

from .tenant import Tenant
from .user import User
from .employee import Employee


def employee_document_upload_path(instance, filename):
    """Generate upload path for employee documents"""
    return f"tenant_{instance.tenant.id}/employee_documents/{instance.employee.id}/{filename}"


class DocumentType(models.Model):
    """
    Document Type Model
    Dokumententypen für Mitarbeiterdokumente
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='document_types')
    
    name = models.CharField(max_length=100, help_text="Name des Dokumententyps")
    description = models.TextField(blank=True, null=True, help_text="Beschreibung")
    
    # Requirements
    requires_signature = models.BooleanField(default=False, help_text="Erfordert Signatur")
    requires_expiry_date = models.BooleanField(default=False, help_text="Erfordert Ablaufdatum")
    default_validity_days = models.IntegerField(
        null=True, 
        blank=True, 
        help_text="Standard-Gültigkeitsdauer in Tagen"
    )
    
    # File restrictions
    allowed_extensions = models.JSONField(
        default=list, 
        help_text="Erlaubte Dateierweiterungen (z.B. ['pdf', 'doc', 'docx'])"
    )
    max_file_size_mb = models.IntegerField(
        default=10, 
        help_text="Maximale Dateigröße in MB"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_document_types')
    
    class Meta:
        db_table = 'document_types'
        ordering = ['name']
        unique_together = ['tenant', 'name']
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class EmployeeDocument(models.Model):
    """
    Employee Document Model
    Mitarbeiterdokumente mit Signatur-Status und Versionierung
    """
    
    SIGN_STATUS_CHOICES = [
        ('pending', 'Ausstehend'),
        ('signed', 'Signiert'),
        ('expired', 'Abgelaufen'),
        ('rejected', 'Abgelehnt'),
        ('cancelled', 'Storniert'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='employee_documents')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE, related_name='documents')
    
    # Document Info
    title = models.CharField(max_length=255, help_text="Dokumenttitel")
    description = models.TextField(blank=True, null=True, help_text="Beschreibung")
    version = models.CharField(max_length=20, default='1.0', help_text="Version")
    
    # File Info
    file_name = models.CharField(max_length=255, help_text="Original-Dateiname")
    file_path = models.FileField(
        upload_to=employee_document_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])],
        help_text="Datei"
    )
    file_size = models.BigIntegerField(help_text="Dateigröße in Bytes")
    mime_type = models.CharField(max_length=100, help_text="MIME-Typ")
    
    # Validity
    valid_from = models.DateField(default=timezone.now, help_text="Gültig ab")
    valid_until = models.DateField(null=True, blank=True, help_text="Gültig bis")
    
    # Signature
    sign_status = models.CharField(max_length=20, choices=SIGN_STATUS_CHOICES, default='pending')
    signed_at = models.DateTimeField(null=True, blank=True, help_text="Signiert am")
    signed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='signed_documents'
    )
    signature_notes = models.TextField(blank=True, null=True, help_text="Signatur-Notizen")
    
    # Status
    is_active = models.BooleanField(default=True)
    is_confidential = models.BooleanField(default=False, help_text="Vertraulich")
    
    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_documents')
    
    class Meta:
        db_table = 'employee_documents'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['tenant', 'employee']),
            models.Index(fields=['tenant', 'document_type']),
            models.Index(fields=['tenant', 'sign_status']),
            models.Index(fields=['employee', 'document_type']),
            models.Index(fields=['valid_until']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.employee.full_name}"
    
    @property
    def file_size_mb(self):
        """Return file size in MB"""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def is_expired(self):
        """Check if document is expired"""
        if not self.valid_until:
            return False
        return timezone.now().date() > self.valid_until
    
    @property
    def is_valid(self):
        """Check if document is currently valid"""
        if not self.is_active:
            return False
        if self.is_expired:
            return False
        return timezone.now().date() >= self.valid_from
    
    @property
    def days_until_expiry(self):
        """Calculate days until expiry"""
        if not self.valid_until:
            return None
        delta = self.valid_until - timezone.now().date()
        return delta.days
    
    @property
    def download_url(self):
        """Generate download URL"""
        return f"/api/v1/admin/employee-documents/{self.id}/download"
    
    def get_file_extension(self):
        """Get file extension"""
        return os.path.splitext(self.file_name)[1].lower()
    
    def can_be_signed(self):
        """Check if document can be signed"""
        return (
            self.is_active and 
            self.sign_status == 'pending' and 
            not self.is_expired
        )
    
    def can_be_downloaded_by(self, user):
        """Check if user can download this document"""
        # Employee can download their own documents
        if hasattr(user, 'employee_profile') and user.employee_profile == self.employee:
            return True
        
        # Admin/Manager can download all documents
        if hasattr(user, 'tenant_memberships'):
            membership = user.tenant_memberships.filter(
                tenant=self.tenant,
                is_active=True
            ).first()
            if membership and membership.role in ['owner', 'admin', 'manager']:
                return True
        
        return False


class DocumentTemplate(models.Model):
    """
    Document Template Model
    Vorlagen für Mitarbeiterdokumente
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='document_templates')
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE, related_name='templates')
    
    name = models.CharField(max_length=255, help_text="Template-Name")
    description = models.TextField(blank=True, null=True, help_text="Beschreibung")
    
    # Template Content
    template_content = models.TextField(help_text="Template-Inhalt (HTML/Markdown)")
    variables = models.JSONField(
        default=list, 
        help_text="Verfügbare Variablen (z.B. ['employee_name', 'start_date'])"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text="Standard-Template")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_document_templates')
    
    class Meta:
        db_table = 'document_templates'
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant', 'document_type']),
            models.Index(fields=['tenant', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.document_type.name})"
