"""
Document Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.schemas.common import (
    DocumentType, DocumentCategory, DocumentStatus, DocumentVisibility,
    UserResponse, PaginatedResponse, PageResponse
)


class DocumentResponse(BaseModel):
    """Document response model"""
    id: str
    name: str
    original_name: str
    title: str
    type: DocumentType
    category: DocumentCategory
    status: DocumentStatus
    visibility: DocumentVisibility
    size: int
    mime_type: str
    url: str
    thumbnail_url: Optional[str] = None
    property_id: Optional[str] = None
    property_title: Optional[str] = None
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime
    created_at: datetime
    last_modified: datetime
    version: int
    tags: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    expiry_date: Optional[datetime] = None
    is_favorite: bool
    view_count: int
    download_count: int
    folder_id: Optional[int] = None
    folder_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('mime_type')
    @classmethod
    def validate_mime_type(cls, v):
        allowed_types = [
            'application/pdf',
            'image/jpeg', 'image/png', 'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv'
        ]
        if v not in allowed_types:
            raise ValueError('Unsupported file type')
        return v


class DocumentListResponse(BaseModel):
    """Document list response model"""
    documents: List[DocumentResponse]
    total: int
    page: int
    size: int
    pages: int


class DocumentFolderResponse(BaseModel):
    """Document folder response model"""
    id: int
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    path: str
    color: str
    icon: str
    is_system: bool
    created_by: str
    created_at: datetime
    document_count: int
    subfolders: List['DocumentFolderResponse'] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


class CreateFolderRequest(BaseModel):
    """Create folder request model"""
    name: str = Field(..., min_length=1, max_length=100)
    parent_folder_id: Optional[int] = None
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)


class DocumentAnalyticsResponse(BaseModel):
    """Document analytics response model"""
    total_documents: int
    total_folders: int
    total_views: int
    views_this_month: int
    favorite_documents: int
    shared_documents: int
    storage_used: int
    storage_limit: Optional[int] = None
    most_viewed_documents: List[Dict[str, Any]] = Field(default_factory=list)
    counts: Dict[str, Any] = Field(default_factory=dict)
    charts: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
    recent_activities: List[Dict[str, Any]] = Field(default_factory=list)


class UploadMetadataRequest(BaseModel):
    """Upload metadata request model"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    type: DocumentType
    category: DocumentCategory
    tags: List[str] = Field(default_factory=list)
    property_id: Optional[str] = None
    contact_id: Optional[str] = None
    folder_id: Optional[int] = None
    visibility: DocumentVisibility = DocumentVisibility.PRIVATE
    expiry_date: Optional[datetime] = None


class UpdateDocumentRequest(BaseModel):
    """Update document request model"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    type: Optional[DocumentType] = None
    category: Optional[DocumentCategory] = None
    status: Optional[DocumentStatus] = None
    visibility: Optional[DocumentVisibility] = None
    tags: Optional[List[str]] = None
    property_id: Optional[str] = None
    contact_id: Optional[str] = None
    folder_id: Optional[int] = None
    expiry_date: Optional[datetime] = None


class FavoriteToggleResponse(BaseModel):
    """Favorite toggle response model"""
    is_favorite: bool
