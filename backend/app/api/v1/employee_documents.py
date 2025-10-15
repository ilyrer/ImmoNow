"""
Employee Documents API Endpoints
Dokumentenverwaltung für Mitarbeiter (Admin-spezifisch)
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File
from pydantic import BaseModel

from app.api.deps import require_admin_scope, get_tenant_id
from app.core.security import TokenData

router = APIRouter()


class EmployeeDocumentResponse(BaseModel):
    """Employee document response model"""
    id: str
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    type: str  # contract, nda, certificate, id_document, other
    title: str
    file_name: str
    version: str
    valid_until: Optional[datetime] = None
    sign_status: str  # pending, signed, expired, rejected
    uploaded_at: datetime
    uploaded_by: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    
    class Config:
        from_attributes = True


class DocumentTypeResponse(BaseModel):
    """Document type response model"""
    id: str
    name: str
    description: str


@router.get("/employee-documents", response_model=List[EmployeeDocumentResponse])
async def get_employee_documents(
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    sign_status: Optional[str] = Query(None, description="Filter by sign status"),
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get employee documents"""
    
    # Mock data for now - replace with real database queries
    mock_documents = [
        EmployeeDocumentResponse(
            id="1",
            employee_id="1",
            employee_name="Max Mustermann",
            type="contract",
            title="Arbeitsvertrag",
            file_name="arbeitsvertrag_max_mustermann.pdf",
            version="1.0",
            valid_until=datetime(2025, 12, 31),
            sign_status="signed",
            uploaded_at=datetime.now(),
            uploaded_by=current_user.user_id,
            file_size=1024000,
            mime_type="application/pdf"
        ),
        EmployeeDocumentResponse(
            id="2",
            employee_id="1",
            employee_name="Max Mustermann",
            type="nda",
            title="Geheimhaltungsvereinbarung",
            file_name="nda_max_mustermann.pdf",
            version="1.0",
            sign_status="signed",
            uploaded_at=datetime.now(),
            uploaded_by=current_user.user_id,
            file_size=512000,
            mime_type="application/pdf"
        ),
        EmployeeDocumentResponse(
            id="3",
            employee_id="2",
            employee_name="Anna Schmidt",
            type="contract",
            title="Arbeitsvertrag",
            file_name="arbeitsvertrag_anna_schmidt.pdf",
            version="1.0",
            valid_until=datetime(2025, 6, 30),
            sign_status="pending",
            uploaded_at=datetime.now(),
            uploaded_by=current_user.user_id,
            file_size=1024000,
            mime_type="application/pdf"
        ),
        EmployeeDocumentResponse(
            id="4",
            employee_id="2",
            employee_name="Anna Schmidt",
            type="certificate",
            title="Führerschein",
            file_name="fuehrerschein_anna_schmidt.pdf",
            version="1.0",
            valid_until=datetime(2026, 3, 15),
            sign_status="signed",
            uploaded_at=datetime.now(),
            uploaded_by=current_user.user_id,
            file_size=256000,
            mime_type="application/pdf"
        )
    ]
    
    # Apply filters
    filtered_documents = mock_documents
    
    if employee_id:
        filtered_documents = [doc for doc in filtered_documents if doc.employee_id == employee_id]
    
    if document_type:
        filtered_documents = [doc for doc in filtered_documents if doc.type == document_type]
    
    if sign_status:
        filtered_documents = [doc for doc in filtered_documents if doc.sign_status == sign_status]
    
    return filtered_documents


@router.get("/employee-documents/{document_id}", response_model=EmployeeDocumentResponse)
async def get_employee_document(
    document_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get specific employee document"""
    
    # Mock data - replace with real database query
    mock_document = EmployeeDocumentResponse(
        id=document_id,
        employee_id="1",
        employee_name="Max Mustermann",
        type="contract",
        title="Arbeitsvertrag",
        file_name="arbeitsvertrag_max_mustermann.pdf",
        version="1.0",
        valid_until=datetime(2025, 12, 31),
        sign_status="signed",
        uploaded_at=datetime.now(),
        uploaded_by=current_user.user_id,
        file_size=1024000,
        mime_type="application/pdf"
    )
    
    return mock_document


@router.post("/employee-documents/upload", response_model=EmployeeDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_employee_document(
    file: UploadFile = File(...),
    employee_id: Optional[str] = Query(None, description="Employee ID"),
    document_type: str = Query(..., description="Document type"),
    title: str = Query(..., description="Document title"),
    valid_until: Optional[datetime] = Query(None, description="Valid until date"),
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Upload employee document"""
    
    # Mock upload - replace with real file handling
    mock_document = EmployeeDocumentResponse(
        id="new-document-id",
        employee_id=employee_id,
        employee_name="Employee Name",  # Would be fetched from database
        type=document_type,
        title=title,
        file_name=file.filename or "document.pdf",
        version="1.0",
        valid_until=valid_until,
        sign_status="pending",
        uploaded_at=datetime.now(),
        uploaded_by=current_user.user_id,
        file_size=file.size,
        mime_type=file.content_type
    )
    
    return mock_document


@router.put("/employee-documents/{document_id}/sign", response_model=EmployeeDocumentResponse)
async def sign_document(
    document_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Mark document as signed"""
    
    # Mock signing - replace with real database update
    mock_document = EmployeeDocumentResponse(
        id=document_id,
        employee_id="1",
        employee_name="Max Mustermann",
        type="contract",
        title="Arbeitsvertrag",
        file_name="arbeitsvertrag_max_mustermann.pdf",
        version="1.0",
        valid_until=datetime(2025, 12, 31),
        sign_status="signed",
        uploaded_at=datetime.now(),
        uploaded_by=current_user.user_id,
        file_size=1024000,
        mime_type="application/pdf"
    )
    
    return mock_document


@router.delete("/employee-documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee_document(
    document_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete employee document"""
    
    # Mock deletion - replace with real database delete
    pass


@router.get("/document-types", response_model=List[DocumentTypeResponse])
async def get_document_types(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get available document types"""
    
    return [
        DocumentTypeResponse(id="contract", name="Arbeitsvertrag", description="Employment contract"),
        DocumentTypeResponse(id="nda", name="Geheimhaltungsvereinbarung", description="Non-disclosure agreement"),
        DocumentTypeResponse(id="certificate", name="Zertifikat", description="Certificate or license"),
        DocumentTypeResponse(id="id_document", name="Ausweisdokument", description="ID document"),
        DocumentTypeResponse(id="other", name="Sonstiges", description="Other document")
    ]
