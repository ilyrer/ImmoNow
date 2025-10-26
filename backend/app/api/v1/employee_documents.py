"""
Employee Documents API Endpoints
Dokumentenverwaltung für Mitarbeiter
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
import io

from app.api.deps import require_read_scope, require_write_scope, require_admin_scope, get_tenant_id
from app.core.security import TokenData
from app.schemas.employee_document import (
    DocumentTypeCreate, DocumentTypeUpdate, DocumentTypeResponse,
    EmployeeDocumentCreate, EmployeeDocumentUpdate, EmployeeDocumentResponse,
    EmployeeDocumentListResponse, DocumentUploadRequest, DocumentSignRequest,
    DocumentFilterRequest, DocumentStats, DocumentTemplateCreate, DocumentTemplateUpdate,
    DocumentTemplateResponse
)
from app.services.employee_document_service import EmployeeDocumentService

router = APIRouter()


@router.get("/document-types", response_model=List[DocumentTypeResponse])
async def get_document_types(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get all document types"""
    
    document_service = EmployeeDocumentService(tenant_id)
    document_types = await document_service.get_document_types()
    
    return document_types


@router.post("/document-types", response_model=DocumentTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_document_type(
    doc_type_data: DocumentTypeCreate,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new document type"""
    
    document_service = EmployeeDocumentService(tenant_id)
    document_type = await document_service.create_document_type(doc_type_data, current_user.user_id)
    
    return document_type


@router.get("/employee-documents", response_model=EmployeeDocumentListResponse)
async def get_employee_documents(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    employee_id: Optional[str] = Query(None),
    document_type_id: Optional[str] = Query(None),
    sign_status: Optional[str] = Query(None),
    is_expired: Optional[bool] = Query(None),
    is_confidential: Optional[bool] = Query(None),
    uploaded_by: Optional[str] = Query(None),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get employee documents with filtering and pagination"""
    
    filters = DocumentFilterRequest(
        employee_id=employee_id,
        document_type_id=document_type_id,
        sign_status=sign_status,
        is_expired=is_expired,
        is_confidential=is_confidential,
        uploaded_by=uploaded_by
    )
    
    document_service = EmployeeDocumentService(tenant_id)
    result = await document_service.get_employee_documents(page, size, filters)
    
    return result


@router.get("/employee-documents/{document_id}", response_model=EmployeeDocumentResponse)
async def get_employee_document(
    document_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific employee document"""
    
    document_service = EmployeeDocumentService(tenant_id)
    document = await document_service.get_employee_document(document_id)
    
    return document


@router.post("/employee-documents/upload", response_model=EmployeeDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_employee_document(
    employee_id: str = Query(..., description="Employee ID"),
    document_type_id: str = Query(..., description="Document type ID"),
    title: str = Query(..., description="Document title"),
    description: Optional[str] = Query(None, description="Document description"),
    valid_until: Optional[str] = Query(None, description="Valid until date (YYYY-MM-DD)"),
    is_confidential: bool = Query(False, description="Is confidential"),
    file: UploadFile = File(..., description="Document file"),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Upload an employee document"""
    
    # Read file content
    file_content = await file.read()
    
    upload_request = DocumentUploadRequest(
        employee_id=employee_id,
        document_type_id=document_type_id,
        title=title,
        description=description,
        valid_until=valid_until,
        is_confidential=is_confidential
    )
    
    document_service = EmployeeDocumentService(tenant_id)
    document = await document_service.upload_document(
        upload_request, file_content, file.filename, current_user.user_id
    )
    
    return document


@router.put("/employee-documents/{document_id}/sign", response_model=EmployeeDocumentResponse)
async def sign_document(
    document_id: str,
    sign_request: DocumentSignRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Sign a document"""
    
    document_service = EmployeeDocumentService(tenant_id)
    document = await document_service.sign_document(sign_request, current_user.user_id)
    
    return document


@router.delete("/employee-documents/{document_id}", status_code=status.HTTP_200_OK)
async def delete_employee_document(
    document_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete an employee document"""
    
    document_service = EmployeeDocumentService(tenant_id)
    await document_service.delete_document(document_id, current_user.user_id)
    
    return {"message": "Document deleted successfully"}


@router.get("/employee-documents/{document_id}/download")
async def download_employee_document(
    document_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Download an employee document"""
    
    document_service = EmployeeDocumentService(tenant_id)
    file_content, file_name, mime_type = await document_service.download_document(
        document_id, current_user.user_id
    )
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=mime_type,
        headers={"Content-Disposition": f"attachment; filename={file_name}"}
    )


@router.get("/employee-documents/stats", response_model=DocumentStats)
async def get_document_stats(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get document statistics"""
    
    document_service = EmployeeDocumentService(tenant_id)
    stats = await document_service.get_document_stats()
    
    return stats


@router.get("/document-templates", response_model=List[DocumentTemplateResponse])
async def get_document_templates(
    document_type_id: Optional[str] = Query(None),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get document templates"""
    
    document_service = EmployeeDocumentService(tenant_id)
    templates = await document_service.get_document_templates(document_type_id)
    
    return templates


@router.post("/document-templates", response_model=DocumentTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_document_template(
    template_data: DocumentTemplateCreate,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new document template"""
    
    document_service = EmployeeDocumentService(tenant_id)
    template = await document_service.create_document_template(template_data, current_user.user_id)
    
    return template