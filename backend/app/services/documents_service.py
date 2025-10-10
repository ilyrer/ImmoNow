"""
Documents Service
"""
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q, Count, Sum

from app.db.models import Document, DocumentFolder, Tenant
from app.schemas.documents import (
    DocumentResponse, DocumentFolderResponse, DocumentAnalyticsResponse,
    UploadMetadataRequest, CreateFolderRequest, UpdateDocumentRequest
)
from app.core.errors import NotFoundError, ValidationError
from app.services.audit import AuditService


class DocumentsService:
    """Documents service for business logic"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_documents(
        self,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        folder_id: Optional[int] = None,
        document_type: Optional[str] = None,
        status: Optional[str] = None,
        category_id: Optional[int] = None,
        property_id: Optional[str] = None,
        favorites_only: Optional[bool] = None,
        has_expiry: Optional[bool] = None,
        is_expired: Optional[bool] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ) -> Tuple[List[DocumentResponse], int]:
        """Get documents with filters and pagination"""
        
        queryset = Document.objects.filter(tenant_id=self.tenant_id)
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(tags__icontains=search)
            )
        
        if folder_id:
            queryset = queryset.filter(folder_id=folder_id)
        
        if document_type:
            queryset = queryset.filter(type=document_type)
        
        if status:
            queryset = queryset.filter(status=status)
        
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        
        if favorites_only:
            queryset = queryset.filter(is_favorite=True)
        
        if has_expiry is not None:
            if has_expiry:
                queryset = queryset.filter(expiry_date__isnull=False)
            else:
                queryset = queryset.filter(expiry_date__isnull=True)
        
        if is_expired is not None:
            now = datetime.utcnow()
            if is_expired:
                queryset = queryset.filter(expiry_date__lt=now)
            else:
                queryset = queryset.filter(
                    Q(expiry_date__gte=now) | Q(expiry_date__isnull=True)
                )
        
        # Apply sorting
        if sort_by:
            if sort_order == "desc":
                sort_by = f"-{sort_by}"
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by("-created_at")
        
        total = queryset.count()
        documents = list(queryset[offset:offset + limit])
        
        return [DocumentResponse.model_validate(doc) for doc in documents], total
    
    async def create_document(
        self,
        file_info: Dict[str, Any],
        metadata: UploadMetadataRequest,
        uploaded_by_id: str
    ) -> DocumentResponse:
        """Create a new document"""
        
        user = User.objects.get(id=uploaded_by_id)
        
        document = Document.objects.create(
            tenant_id=self.tenant_id,
            name=file_info['filename'],
            original_name=file_info['original_name'],
            title=metadata.title or file_info['original_name'],
            type=metadata.type,
            category=metadata.category,
            status='active',
            visibility=metadata.visibility,
            size=file_info['size'],
            mime_type=file_info['mime_type'],
            url=file_info['url'],
            uploaded_by=user,
            tags=metadata.tags,
            description=metadata.description,
            expiry_date=metadata.expiry_date,
            folder_id=metadata.folder_id,
            property_id=metadata.property_id,
            contact_id=metadata.contact_id
        )
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="create",
            resource_type="document",
            resource_id=str(document.id),
            new_values={"title": document.title, "type": document.type}
        )
        
        return DocumentResponse.model_validate(document)
    
    async def toggle_favorite(self, document_id: str, user_id: str) -> bool:
        """Toggle document favorite status"""
        
        try:
            document = Document.objects.get(
                id=document_id, 
                tenant_id=self.tenant_id
            )
        except Document.DoesNotExist:
            raise NotFoundError("Document not found")
        
        document.is_favorite = not document.is_favorite
        document.save()
        
        return document.is_favorite
    
    async def delete_document(self, document_id: str, user_id: str) -> None:
        """Delete a document"""
        
        try:
            document = Document.objects.get(
                id=document_id, 
                tenant_id=self.tenant_id
            )
        except Document.DoesNotExist:
            raise NotFoundError("Document not found")
        
        user = User.objects.get(id=user_id)
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="delete",
            resource_type="document",
            resource_id=document_id,
            old_values={"title": document.title, "type": document.type}
        )
        
        document.delete()
    
    async def get_folders(self) -> List[DocumentFolderResponse]:
        """Get document folders"""
        
        folders = DocumentFolder.objects.filter(tenant_id=self.tenant_id)
        
        # Build folder tree
        folder_dict = {}
        root_folders = []
        
        for folder in folders:
            folder_dict[folder.id] = DocumentFolderResponse.model_validate(folder)
            folder_dict[folder.id].subfolders = []
        
        for folder in folders:
            if folder.parent_id:
                if folder.parent_id in folder_dict:
                    folder_dict[folder.parent_id].subfolders.append(folder_dict[folder.id])
            else:
                root_folders.append(folder_dict[folder.id])
        
        return root_folders
    
    async def create_folder(
        self, 
        folder_data: CreateFolderRequest, 
        created_by_id: str
    ) -> DocumentFolderResponse:
        """Create a new folder"""
        
        user = User.objects.get(id=created_by_id)
        
        folder = DocumentFolder.objects.create(
            tenant_id=self.tenant_id,
            name=folder_data.name,
            description=folder_data.description,
            parent_id=folder_data.parent_folder_id,
            color=folder_data.color or '#3B82F6',
            icon=folder_data.icon,
            created_by=user
        )
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="create",
            resource_type="folder",
            resource_id=str(folder.id),
            new_values={"name": folder.name}
        )
        
        return DocumentFolderResponse.model_validate(folder)
    
    async def delete_folder(self, folder_id: int, user_id: str) -> None:
        """Delete a folder"""
        
        try:
            folder = DocumentFolder.objects.get(
                id=folder_id, 
                tenant_id=self.tenant_id
            )
        except DocumentFolder.DoesNotExist:
            raise NotFoundError("Folder not found")
        
        # Check if folder has documents
        document_count = Document.objects.filter(folder_id=folder_id).count()
        if document_count > 0:
            raise ValidationError("Cannot delete folder with documents")
        
        user = User.objects.get(id=user_id)
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="delete",
            resource_type="folder",
            resource_id=str(folder_id),
            old_values={"name": folder.name}
        )
        
        folder.delete()
    
    async def get_analytics(self) -> DocumentAnalyticsResponse:
        """Get document analytics"""
        
        queryset = Document.objects.filter(tenant_id=self.tenant_id)
        
        total_documents = queryset.count()
        total_folders = DocumentFolder.objects.filter(tenant_id=self.tenant_id).count()
        total_views = queryset.aggregate(total=Sum('view_count'))['total'] or 0
        favorite_documents = queryset.filter(is_favorite=True).count()
        
        # Views this month
        from datetime import datetime, timedelta
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        views_this_month = queryset.filter(
            uploaded_at__gte=month_start
        ).aggregate(total=Sum('view_count'))['total'] or 0
        
        # Storage used
        storage_used = queryset.aggregate(total=Sum('size'))['total'] or 0
        
        # Most viewed documents
        most_viewed = queryset.order_by('-view_count')[:5].values(
            'id', 'title', 'view_count', 'download_count'
        )
        
        # Document counts by type
        counts_by_type = queryset.values('type').annotate(count=Count('id'))
        counts = {item['type']: item['count'] for item in counts_by_type}
        
        return DocumentAnalyticsResponse(
            total_documents=total_documents,
            total_folders=total_folders,
            total_views=total_views,
            views_this_month=views_this_month,
            favorite_documents=favorite_documents,
            shared_documents=0,  # TODO: Implement sharing
            storage_used=storage_used,
            storage_limit=None,  # TODO: Implement storage limits
            most_viewed_documents=list(most_viewed),
            counts=counts,
            charts={},  # TODO: Implement charts
            recent_activities=[]  # TODO: Implement recent activities
        )
