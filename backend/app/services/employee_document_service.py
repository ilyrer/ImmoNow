"""
Employee Document Service
Service für Mitarbeiterdokumente und Dokumentenverwaltung
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date
from decimal import Decimal
from django.db import transaction
from django.db.models import Q, Count, Avg, Sum
from django.core.exceptions import ValidationError
from asgiref.sync import sync_to_async

from app.db.models import EmployeeDocument, DocumentType, Employee
from app.schemas.employee_document import (
    DocumentTypeResponse, EmployeeDocumentResponse, EmployeeDocumentListResponse,
    DocumentStats
)
from app.core.errors import NotFoundError, ValidationError as AppValidationError


class EmployeeDocumentService:
    """Service für Mitarbeiterdokumente"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_document_types(self) -> List[DocumentTypeResponse]:
        """Alle Dokumententypen abrufen"""
        
        def _get_document_types():
            types = DocumentType.objects.filter(tenant_id=self.tenant_id).order_by('name')
            return list(types)
        
        types = await sync_to_async(_get_document_types)()
        return [DocumentTypeResponse.model_validate(t) for t in types]
    
    async def get_employee_documents(
        self,
        page: int = 1,
        size: int = 20,
        employee_id: Optional[str] = None,
        document_type_id: Optional[str] = None,
        sign_status: Optional[str] = None
    ) -> EmployeeDocumentListResponse:
        """Alle Mitarbeiterdokumente abrufen mit Filterung und Paginierung"""
        
        def _get_employee_documents():
            queryset = EmployeeDocument.objects.filter(tenant_id=self.tenant_id)
            
            # Apply filters
            if employee_id:
                queryset = queryset.filter(employee_id=employee_id)
            
            if document_type_id:
                queryset = queryset.filter(document_type_id=document_type_id)
            
            if sign_status:
                queryset = queryset.filter(sign_status=sign_status)
            
            # Count total
            total = queryset.count()
            
            # Apply pagination
            offset = (page - 1) * size
            documents = list(
                queryset.select_related('employee__user', 'document_type')
                .order_by('-created_at')[offset:offset + size]
            )
            
            return documents, total
        
        documents, total = await sync_to_async(_get_employee_documents)()
        
        # Convert to response format
        document_responses = []
        for doc in documents:
            document_responses.append(EmployeeDocumentResponse(
                id=str(doc.id),
                employee_id=str(doc.employee.id),
                employee_name=doc.employee.user.get_full_name(),
                document_type_id=str(doc.document_type.id),
                document_type_name=doc.document_type.name,
                title=doc.title,
                file_name=doc.file_name,
                file_size=doc.file_size,
                file_path=doc.file_path,
                sign_status=doc.sign_status,
                signed_at=doc.signed_at,
                signed_by=str(doc.signed_by.id) if doc.signed_by else None,
                valid_until=doc.valid_until,
                is_expired=doc.is_expired,
                created_at=doc.created_at,
                updated_at=doc.updated_at,
                created_by=str(doc.created_by.id)
            ))
        
        return EmployeeDocumentListResponse(
            documents=document_responses,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
    
    async def get_employee_document(self, document_id: str) -> EmployeeDocumentResponse:
        """Einzelnes Mitarbeiterdokument abrufen"""
        
        def _get_employee_document():
            try:
                document = EmployeeDocument.objects.select_related('employee__user', 'document_type').get(
                    id=document_id,
                    tenant_id=self.tenant_id
                )
                return document
            except EmployeeDocument.DoesNotExist:
                raise NotFoundError(f"Dokument mit ID {document_id} nicht gefunden")
        
        document = await sync_to_async(_get_employee_document)()
        
        return EmployeeDocumentResponse(
            id=str(document.id),
            employee_id=str(document.employee.id),
            employee_name=document.employee.user.get_full_name(),
            document_type_id=str(document.document_type.id),
            document_type_name=document.document_type.name,
            title=document.title,
            file_name=document.file_name,
            file_size=document.file_size,
            file_path=document.file_path,
            sign_status=document.sign_status,
            signed_at=document.signed_at,
            signed_by=str(document.signed_by.id) if document.signed_by else None,
            valid_until=document.valid_until,
            is_expired=document.is_expired,
            created_at=document.created_at,
            updated_at=document.updated_at,
            created_by=str(document.created_by.id)
        )
    
    async def upload_employee_document(
        self,
        file_data: bytes,
        file_name: str,
        employee_id: str,
        document_type_id: str,
        title: str,
        valid_until: Optional[str] = None,
        uploaded_by: str = None
    ) -> EmployeeDocumentResponse:
        """Mitarbeiterdokument hochladen"""
        
        def _upload_employee_document():
            # Get employee
            try:
                employee = Employee.objects.get(id=employee_id, tenant_id=self.tenant_id)
            except Employee.DoesNotExist:
                raise NotFoundError("Mitarbeiter nicht gefunden")
            
            # Get document type
            try:
                document_type = DocumentType.objects.get(id=document_type_id, tenant_id=self.tenant_id)
            except DocumentType.DoesNotExist:
                raise NotFoundError("Dokumententyp nicht gefunden")
            
            # Get uploaded_by user
            try:
                uploaded_by_user = User.objects.get(id=uploaded_by)
            except User.DoesNotExist:
                raise NotFoundError("Benutzer nicht gefunden")
            
            # Generate file path
            file_path = f"/documents/{self.tenant_id}/{employee_id}/{file_name}"
            
            # Create document
            document = EmployeeDocument.objects.create(
                tenant_id=self.tenant_id,
                employee=employee,
                document_type=document_type,
                title=title,
                file_name=file_name,
                file_size=len(file_data),
                file_path=file_path,
                sign_status='pending',
                valid_until=valid_until,
                created_by=uploaded_by_user
            )
            
            return document
        
        document = await sync_to_async(_upload_employee_document)()
        
        return EmployeeDocumentResponse(
            id=str(document.id),
            employee_id=str(document.employee.id),
            employee_name=document.employee.user.get_full_name(),
            document_type_id=str(document.document_type.id),
            document_type_name=document.document_type.name,
            title=document.title,
            file_name=document.file_name,
            file_size=document.file_size,
            file_path=document.file_path,
            sign_status=document.sign_status,
            signed_at=document.signed_at,
            signed_by=str(document.signed_by.id) if document.signed_by else None,
            valid_until=document.valid_until,
            is_expired=document.is_expired,
            created_at=document.created_at,
            updated_at=document.updated_at,
            created_by=str(document.created_by.id)
        )
    
    async def update_employee_document(
        self,
        document_id: str,
        title: Optional[str] = None,
        valid_until: Optional[str] = None,
        updated_by: str = None
    ) -> EmployeeDocumentResponse:
        """Mitarbeiterdokument aktualisieren"""
        
        def _update_employee_document():
            try:
                document = EmployeeDocument.objects.get(id=document_id, tenant_id=self.tenant_id)
            except EmployeeDocument.DoesNotExist:
                raise NotFoundError(f"Dokument mit ID {document_id} nicht gefunden")
            
            # Update fields
            if title:
                document.title = title
            if valid_until is not None:
                document.valid_until = valid_until
            
            document.save()
            return document
        
        document = await sync_to_async(_update_employee_document)()
        
        return EmployeeDocumentResponse(
            id=str(document.id),
            employee_id=str(document.employee.id),
            employee_name=document.employee.user.get_full_name(),
            document_type_id=str(document.document_type.id),
            document_type_name=document.document_type.name,
            title=document.title,
            file_name=document.file_name,
            file_size=document.file_size,
            file_path=document.file_path,
            sign_status=document.sign_status,
            signed_at=document.signed_at,
            signed_by=str(document.signed_by.id) if document.signed_by else None,
            valid_until=document.valid_until,
            is_expired=document.is_expired,
            created_at=document.created_at,
            updated_at=document.updated_at,
            created_by=str(document.created_by.id)
        )
    
    async def delete_employee_document(self, document_id: str) -> bool:
        """Mitarbeiterdokument löschen"""
        
        def _delete_employee_document():
            try:
                document = EmployeeDocument.objects.get(id=document_id, tenant_id=self.tenant_id)
                document.delete()
                return True
            except EmployeeDocument.DoesNotExist:
                raise NotFoundError(f"Dokument mit ID {document_id} nicht gefunden")
        
        await sync_to_async(_delete_employee_document)()
        return True
    
    async def download_employee_document(self, document_id: str) -> bytes:
        """Mitarbeiterdokument herunterladen"""
        
        def _download_employee_document():
            try:
                document = EmployeeDocument.objects.get(id=document_id, tenant_id=self.tenant_id)
                # In real implementation, read file from storage
                # For now, return dummy content
                return b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF'
            except EmployeeDocument.DoesNotExist:
                raise NotFoundError(f"Dokument mit ID {document_id} nicht gefunden")
        
        file_data = await sync_to_async(_download_employee_document)()
        return file_data
    
    async def sign_employee_document(
        self,
        document_id: str,
        signature_data: Dict[str, Any],
        signed_by: str
    ) -> bool:
        """Mitarbeiterdokument signieren"""
        
        def _sign_employee_document():
            try:
                document = EmployeeDocument.objects.get(id=document_id, tenant_id=self.tenant_id)
            except EmployeeDocument.DoesNotExist:
                raise NotFoundError(f"Dokument mit ID {document_id} nicht gefunden")
            
            if document.sign_status != 'pending':
                raise ValidationError("Nur ausstehende Dokumente können signiert werden")
            
            # Get signed_by user
            try:
                signed_by_user = User.objects.get(id=signed_by)
            except User.DoesNotExist:
                raise NotFoundError("Benutzer nicht gefunden")
            
            document.sign_status = 'signed'
            document.signed_at = datetime.now()
            document.signed_by = signed_by_user
            document.save()
            
            return True
        
        await sync_to_async(_sign_employee_document)()
        return True
    
    async def get_document_stats(self) -> DocumentStats:
        """Dokumenten-Statistiken abrufen"""
        
        def _get_document_stats():
            total_documents = EmployeeDocument.objects.filter(tenant_id=self.tenant_id).count()
            
            # Documents by type
            documents_by_type = {}
            for doc_type in DocumentType.objects.filter(tenant_id=self.tenant_id):
                count = EmployeeDocument.objects.filter(
                    tenant_id=self.tenant_id,
                    document_type=doc_type
                ).count()
                if count > 0:
                    documents_by_type[doc_type.name] = count
            
            # Documents by status
            documents_by_status = {}
            for status in ['pending', 'signed', 'expired', 'rejected', 'cancelled']:
                count = EmployeeDocument.objects.filter(
                    tenant_id=self.tenant_id,
                    sign_status=status
                ).count()
                if count > 0:
                    documents_by_status[status] = count
            
            # Total file size
            total_file_size = EmployeeDocument.objects.filter(
                tenant_id=self.tenant_id
            ).aggregate(total=Sum('file_size'))['total'] or 0
            
            # Average file size
            avg_file_size = EmployeeDocument.objects.filter(
                tenant_id=self.tenant_id
            ).aggregate(avg=Avg('file_size'))['avg'] or 0
            
            # Documents this month
            this_month = datetime.now().replace(day=1)
            documents_this_month = EmployeeDocument.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=this_month
            ).count()
            
            # Expired documents
            expired_documents = EmployeeDocument.objects.filter(
                tenant_id=self.tenant_id,
                valid_until__lt=datetime.now()
            ).count()
            
            # Pending signatures
            pending_signatures = EmployeeDocument.objects.filter(
                tenant_id=self.tenant_id,
                sign_status='pending'
            ).count()
            
            # Documents by employee
            documents_by_employee = {}
            for employee in Employee.objects.filter(tenant_id=self.tenant_id):
                count = EmployeeDocument.objects.filter(
                    tenant_id=self.tenant_id,
                    employee=employee
                ).count()
                if count > 0:
                    documents_by_employee[employee.user.get_full_name()] = count
            
            return {
                'total_documents': total_documents,
                'documents_by_type': documents_by_type,
                'documents_by_status': documents_by_status,
                'total_file_size': total_file_size,
                'average_file_size': avg_file_size,
                'documents_this_month': documents_this_month,
                'expired_documents': expired_documents,
                'pending_signatures': pending_signatures,
                'documents_by_employee': documents_by_employee
            }
        
        stats = await sync_to_async(_get_document_stats)()
        return DocumentStats(**stats)