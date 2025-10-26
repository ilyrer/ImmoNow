"""
Employee Document Schemas
Pydantic models for employee document operations
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class SignStatus(str, Enum):
    """Document sign status"""
    PENDING = "pending"
    SIGNED = "signed"
    EXPIRED = "expired"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


# Document Type Schemas
class DocumentTypeBase(BaseModel):
    """Base document type schema"""
    name: str = Field(..., description="Name des Dokumententyps")
    description: Optional[str] = Field(None, description="Beschreibung")
    requires_signature: bool = Field(default=False, description="Erfordert Signatur")
    requires_expiry_date: bool = Field(default=False, description="Erfordert Ablaufdatum")
    default_validity_days: Optional[int] = Field(None, ge=1, description="Standard-Gültigkeitsdauer in Tagen")
    allowed_extensions: List[str] = Field(default=["pdf", "doc", "docx"], description="Erlaubte Dateierweiterungen")
    max_file_size_mb: int = Field(default=10, ge=1, le=100, description="Maximale Dateigröße in MB")
    is_active: bool = Field(default=True, description="Aktiv")


class DocumentTypeCreate(DocumentTypeBase):
    """Schema for creating a document type"""
    pass


class DocumentTypeUpdate(BaseModel):
    """Schema for updating a document type"""
    name: Optional[str] = None
    description: Optional[str] = None
    requires_signature: Optional[bool] = None
    requires_expiry_date: Optional[bool] = None
    default_validity_days: Optional[int] = Field(None, ge=1)
    allowed_extensions: Optional[List[str]] = None
    max_file_size_mb: Optional[int] = Field(None, ge=1, le=100)
    is_active: Optional[bool] = None


class DocumentTypeResponse(DocumentTypeBase):
    """Schema for document type response"""
    id: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    
    class Config:
        from_attributes = True


# Employee Document Schemas
class EmployeeDocumentBase(BaseModel):
    """Base employee document schema"""
    title: str = Field(..., description="Dokumenttitel")
    description: Optional[str] = Field(None, description="Beschreibung")
    version: str = Field(default="1.0", description="Version")
    valid_from: date = Field(default_factory=date.today, description="Gültig ab")
    valid_until: Optional[date] = Field(None, description="Gültig bis")
    is_confidential: bool = Field(default=False, description="Vertraulich")


class EmployeeDocumentCreate(EmployeeDocumentBase):
    """Schema for creating an employee document"""
    employee_id: str = Field(..., description="Mitarbeiter-ID")
    document_type_id: str = Field(..., description="Dokumenttyp-ID")
    file_name: str = Field(..., description="Dateiname")
    file_size: int = Field(..., ge=1, description="Dateigröße in Bytes")
    mime_type: str = Field(..., description="MIME-Typ")


class EmployeeDocumentUpdate(BaseModel):
    """Schema for updating an employee document"""
    title: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    is_confidential: Optional[bool] = None


class EmployeeDocumentResponse(EmployeeDocumentBase):
    """Schema for employee document response"""
    id: str
    employee_id: str
    employee_name: str
    document_type_id: str
    document_type_name: str
    file_name: str
    file_path: str
    file_size: int
    mime_type: str
    sign_status: SignStatus
    signed_at: Optional[datetime] = None
    signed_by: Optional[str] = None
    signature_notes: Optional[str] = None
    is_active: bool
    uploaded_at: datetime
    updated_at: datetime
    uploaded_by: str
    
    @property
    def file_size_mb(self) -> float:
        """Return file size in MB"""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def is_expired(self) -> bool:
        """Check if document is expired"""
        if not self.valid_until:
            return False
        return date.today() > self.valid_until
    
    @property
    def is_valid(self) -> bool:
        """Check if document is currently valid"""
        if not self.is_active:
            return False
        if self.is_expired:
            return False
        return date.today() >= self.valid_from
    
    @property
    def days_until_expiry(self) -> Optional[int]:
        """Calculate days until expiry"""
        if not self.valid_until:
            return None
        delta = self.valid_until - date.today()
        return max(0, delta.days)
    
    @property
    def download_url(self) -> str:
        """Generate download URL"""
        return f"/api/v1/admin/employee-documents/{self.id}/download"
    
    @property
    def can_be_signed(self) -> bool:
        """Check if document can be signed"""
        return (
            self.is_active and 
            self.sign_status == SignStatus.PENDING and 
            not self.is_expired
        )
    
    class Config:
        from_attributes = True


# Document Template Schemas
class DocumentTemplateBase(BaseModel):
    """Base document template schema"""
    name: str = Field(..., description="Template-Name")
    description: Optional[str] = Field(None, description="Beschreibung")
    template_content: str = Field(..., description="Template-Inhalt")
    variables: List[str] = Field(default=[], description="Verfügbare Variablen")
    is_active: bool = Field(default=True, description="Aktiv")
    is_default: bool = Field(default=False, description="Standard-Template")


class DocumentTemplateCreate(DocumentTemplateBase):
    """Schema for creating a document template"""
    document_type_id: str = Field(..., description="Dokumenttyp-ID")


class DocumentTemplateUpdate(BaseModel):
    """Schema for updating a document template"""
    name: Optional[str] = None
    description: Optional[str] = None
    template_content: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class DocumentTemplateResponse(DocumentTemplateBase):
    """Schema for document template response"""
    id: str
    document_type_id: str
    document_type_name: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    
    class Config:
        from_attributes = True


# Document List Response
class EmployeeDocumentListResponse(BaseModel):
    """Schema for employee document list response"""
    documents: List[EmployeeDocumentResponse]
    total: int
    page: int
    size: int
    pages: int


# Document Upload Request
class DocumentUploadRequest(BaseModel):
    """Request for document upload"""
    employee_id: str = Field(..., description="Mitarbeiter-ID")
    document_type_id: str = Field(..., description="Dokumenttyp-ID")
    title: str = Field(..., description="Dokumenttitel")
    description: Optional[str] = None
    valid_until: Optional[date] = None
    is_confidential: bool = Field(default=False)


# Document Sign Request
class DocumentSignRequest(BaseModel):
    """Request for document signing"""
    document_id: str = Field(..., description="Dokument-ID")
    signature_notes: Optional[str] = None


# Document Filter Request
class DocumentFilterRequest(BaseModel):
    """Request for filtering documents"""
    employee_id: Optional[str] = None
    document_type_id: Optional[str] = None
    sign_status: Optional[SignStatus] = None
    is_expired: Optional[bool] = None
    is_confidential: Optional[bool] = None
    uploaded_by: Optional[str] = None
    uploaded_from: Optional[date] = None
    uploaded_to: Optional[date] = None


# Document Statistics
class DocumentStats(BaseModel):
    """Document statistics"""
    total_documents: int
    pending_signatures: int
    signed_documents: int
    expired_documents: int
    documents_by_type: Dict[str, int]
    documents_by_status: Dict[str, int]
    total_file_size_mb: float
    average_file_size_mb: float
    documents_expiring_soon: int  # Within 30 days
