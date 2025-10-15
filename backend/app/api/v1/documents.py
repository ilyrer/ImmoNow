"""
Documents API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import JSONResponse
import hashlib
from datetime import datetime

from app.api.deps import (
    require_read_scope, require_write_scope, require_delete_scope,
    get_tenant_id, apply_rate_limit
)
from app.core.security import TokenData
from app.core.errors import ValidationError, NotFoundError, ConflictError
from app.schemas.documents import (
    DocumentResponse, DocumentListResponse, DocumentFolderResponse,
    CreateFolderRequest, DocumentAnalyticsResponse, UploadMetadataRequest,
    UpdateDocumentRequest, FavoriteToggleResponse, DocumentVersionResponse,
    DocumentSearchRequest, DocumentVisibilityUpdateRequest, CreateVersionRequest
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset, validate_sort_field
from app.services.documents_service import DocumentsService
from app.services.storage_s3 import StorageService

router = APIRouter()


@router.get("/search", response_model=PaginatedResponse[DocumentResponse])
async def search_documents(
    search_request: DocumentSearchRequest = Depends(),
    pagination: PaginationParams = Depends(),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Search documents using full-text search"""
    
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    documents_service = DocumentsService(tenant_id)
    documents, total = await documents_service.search_documents(
        search_request=search_request,
        offset=offset,
        limit=pagination.size
    )
    
    return PaginatedResponse.create(
        items=documents,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.get("/{document_id}/versions", response_model=List[DocumentVersionResponse])
async def get_document_versions(
    document_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all versions of a document"""
    
    documents_service = DocumentsService(tenant_id)
    versions = await documents_service.get_document_versions(document_id)
    
    return versions


@router.get("/{document_id}/versions/{version_id}", response_model=DocumentVersionResponse)
async def get_document_version(
    document_id: str,
    version_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific version of a document"""
    
    documents_service = DocumentsService(tenant_id)
    version = await documents_service.get_document_version(document_id, version_id)
    
    return version


@router.post("/{document_id}/versions", response_model=DocumentVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_document_version(
    document_id: str,
    file: UploadFile = File(...),
    change_notes: Optional[str] = None,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new version of a document"""
    
    # Validate file
    if not file.filename:
        raise ValidationError("No file provided")
    
    # Calculate checksum
    file_content = await file.read()
    checksum = hashlib.sha256(file_content).hexdigest()
    
    # Upload file to storage (stub - in real implementation, use StorageService)
    file_url = f"https://storage.example.com/documents/{document_id}/v{datetime.utcnow().timestamp()}/{file.filename}"
    
    documents_service = DocumentsService(tenant_id)
    version = await documents_service.create_document_version(
        document_id=document_id,
        file_url=file_url,
        file_size=len(file_content),
        checksum=checksum,
        user_id=current_user.user_id,
        change_notes=change_notes
    )
    
    return version


@router.put("/{document_id}/visibility", response_model=DocumentResponse)
async def update_document_visibility(
    document_id: str,
    visibility_request: DocumentVisibilityUpdateRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update document visibility"""
    
    documents_service = DocumentsService(tenant_id)
    document = await documents_service.update_document_visibility(
        document_id=document_id,
        visibility_request=visibility_request,
        user_id=current_user.user_id
    )
    
    return document


@router.post("/{document_id}/ocr", response_model=dict)
async def trigger_ocr_processing(
    document_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Trigger OCR processing for a document"""
    
    documents_service = DocumentsService(tenant_id)
    result = await documents_service.trigger_ocr_processing(
        document_id=document_id,
        user_id=current_user.user_id
    )
    
    return result


@router.get("", response_model=PaginatedResponse[DocumentResponse])
async def get_documents(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search term"),
    folder_id: Optional[int] = Query(None, description="Folder ID filter"),
    document_type: Optional[str] = Query(None, description="Document type filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    category_id: Optional[int] = Query(None, description="Category ID filter"),
    property_id: Optional[str] = Query(None, description="Property ID filter"),
    favorites_only: Optional[bool] = Query(False, description="Show only favorites"),
    has_expiry: Optional[bool] = Query(None, description="Has expiry date"),
    is_expired: Optional[bool] = Query(None, description="Is expired"),
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get paginated list of documents with filters"""
    
    # Validate sort field
    allowed_sort_fields = ["created_at", "title", "file_size", "updated_at"]
    sort_by = validate_sort_field(allowed_sort_fields, sort_by)
    
    # Calculate pagination offset
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    # Get documents from service
    documents_service = DocumentsService(tenant_id)
    documents, total = await documents_service.get_documents(
        offset=offset,
        limit=pagination.size,
        search=search,
        folder_id=folder_id,
        document_type=document_type,
        status=status,
        category_id=category_id,
        property_id=property_id,
        favorites_only=favorites_only,
        has_expiry=has_expiry,
        is_expired=is_expired,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return PaginatedResponse.create(
        items=documents,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    metadata: str = Query(..., description="JSON metadata"),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Upload a new document"""
    
    import json
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"📤 Upload request received")
        logger.info(f"📄 File: {file.filename}")
        logger.info(f"📋 Metadata string: {metadata}")
        
        metadata_dict = json.loads(metadata)
        logger.info(f"✅ Parsed metadata: {metadata_dict}")
        
        upload_metadata = UploadMetadataRequest(**metadata_dict)
        logger.info(f"✅ Validated metadata: {upload_metadata}")
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid JSON in metadata: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Validation error: {str(e)}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid metadata: {str(e)}"
        )
    
    # Validate file
    if not file.filename:
        raise ValidationError("No filename provided")
    
    if file.size > 50 * 1024 * 1024:  # 50MB limit
        raise ValidationError("File too large. Maximum size is 50MB")
    
    # Upload file to storage
    storage_service = StorageService()
    upload_result = await storage_service.upload_file(
        file=file,
        tenant_id=tenant_id,
        folder_path=str(upload_metadata.folder_id) if upload_metadata.folder_id else ""
    )
    
    # Create document record
    documents_service = DocumentsService(tenant_id)
    document = await documents_service.create_document(
        file_info=upload_result,
        metadata=upload_metadata,
        uploaded_by_id=current_user.user_id
    )
    
    return document


@router.put("/{document_id}/favorite", response_model=FavoriteToggleResponse)
async def toggle_favorite(
    document_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Toggle document favorite status"""
    
    documents_service = DocumentsService(tenant_id)
    is_favorite = await documents_service.toggle_favorite(document_id, current_user.user_id)
    
    return FavoriteToggleResponse(is_favorite=is_favorite)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a document"""
    
    documents_service = DocumentsService(tenant_id)
    await documents_service.delete_document(document_id, current_user.user_id)


@router.get("/folders", response_model=List[DocumentFolderResponse])
async def get_folders(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get document folders"""
    
    documents_service = DocumentsService(tenant_id)
    folders = await documents_service.get_folders()
    
    return folders


@router.post("/folders", response_model=DocumentFolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_data: CreateFolderRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new document folder"""
    
    documents_service = DocumentsService(tenant_id)
    folder = await documents_service.create_folder(folder_data, current_user.user_id)
    
    return folder


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: int,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a document folder"""
    
    documents_service = DocumentsService(tenant_id)
    await documents_service.delete_folder(folder_id, current_user.user_id)


@router.get("/analytics", response_model=DocumentAnalyticsResponse)
async def get_analytics(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get document analytics"""
    
    documents_service = DocumentsService(tenant_id)
    analytics = await documents_service.get_analytics()
    
    return analytics
