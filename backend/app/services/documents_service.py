"""
Documents Service
"""

import hashlib
import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from django.db import models
from django.db.models import Q, Count, Sum
from asgiref.sync import sync_to_async

from documents.models import (
    Document,
    DocumentFolder,
    DocumentVersion,
    DocumentActivity,
    DocumentComment,
)
from accounts.models import Tenant, User
from app.schemas.documents import (
    DocumentResponse,
    DocumentFolderResponse,
    DocumentAnalyticsResponse,
    UploadMetadataRequest,
    CreateFolderRequest,
    UpdateDocumentRequest,
    DocumentVersionResponse,
    DocumentSearchRequest,
    DocumentVisibilityUpdateRequest,
    CreateVersionRequest,
)
from app.core.errors import NotFoundError, ValidationError
from app.services.audit import AuditService
from app.core.billing_guard import BillingGuard

logger = logging.getLogger(__name__)


class DocumentsService:
    """Documents service for business logic"""

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.audit_service = AuditService(tenant_id)

    def calculate_checksum(self, file_content: bytes) -> str:
        """Calculate SHA256 checksum for file content"""
        return hashlib.sha256(file_content).hexdigest()

    async def _log_activity(
        self,
        document_id: str,
        user_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log document activity"""
        user = await sync_to_async(User.objects.get)(id=user_id)

        await sync_to_async(DocumentActivity.objects.create)(
            document_id=document_id,
            tenant_id=self.tenant_id,
            action=action,
            user=user,
            details=details or {},
        )

    async def log_document_view(self, document_id: str, user_id: str) -> None:
        """Log document view and increment view count"""
        try:
            document = await sync_to_async(Document.objects.get)(
                id=document_id, tenant_id=self.tenant_id
            )
            document.view_count += 1
            await sync_to_async(document.save)()

            await self._log_activity(
                document_id=document_id, user_id=user_id, action="viewed", details={}
            )
        except Document.DoesNotExist:
            pass

    async def log_document_download(self, document_id: str, user_id: str) -> None:
        """Log document download and increment download count"""
        try:
            document = await sync_to_async(Document.objects.get)(
                id=document_id, tenant_id=self.tenant_id
            )
            document.download_count += 1
            await sync_to_async(document.save)()

            await self._log_activity(
                document_id=document_id,
                user_id=user_id,
                action="downloaded",
                details={},
            )
        except Document.DoesNotExist:
            pass

    async def search_documents(
        self, search_request: DocumentSearchRequest, offset: int = 0, limit: int = 20
    ) -> Tuple[List[DocumentResponse], int]:
        """Search documents using full-text search"""

        queryset = Document.objects.filter(tenant_id=self.tenant_id)

        # Build search query
        search_query = Q()

        # Search in title, description, tags
        search_query |= Q(title__icontains=search_request.query)
        search_query |= Q(description__icontains=search_request.query)
        search_query |= Q(tags__icontains=search_request.query)

        # Include OCR text if requested
        if search_request.include_ocr:
            search_query |= Q(ocr_text__icontains=search_request.query)

        queryset = queryset.filter(search_query)

        # Apply additional filters
        if search_request.folder_id:
            queryset = queryset.filter(folder_id=search_request.folder_id)

        if search_request.document_type:
            queryset = queryset.filter(type=search_request.document_type)

        if search_request.category:
            queryset = queryset.filter(category=search_request.category)

        # Get total count
        total = await sync_to_async(queryset.count)()

        # Apply pagination and ordering
        documents = await sync_to_async(list)(
            queryset.select_related("uploaded_by", "folder").order_by("-created_at")[
                offset : offset + limit
            ]
        )

        # Convert to response models - manually construct to avoid async ForeignKey issues
        document_responses = []
        for doc in documents:
            uploaded_by_id = await sync_to_async(lambda d=doc: d.uploaded_by.id)()
            uploaded_by_name = await sync_to_async(
                lambda d=doc: f"{d.uploaded_by.first_name} {d.uploaded_by.last_name}".strip()
                or d.uploaded_by.email
            )()
            folder_name = await sync_to_async(
                lambda d=doc: d.folder.name if d.folder else None
            )()

            document_responses.append(
                DocumentResponse(
                    id=str(doc.id),
                    name=doc.name,
                    original_name=doc.original_name,
                    title=doc.title,
                    type=doc.type,
                    category=doc.category,
                    status=doc.status,
                    visibility=doc.visibility,
                    size=doc.size,
                    mime_type=doc.mime_type,
                    url=doc.url,
                    thumbnail_url=doc.thumbnail_url,
                    property_id=str(doc.property_id) if doc.property_id else None,
                    property_title=doc.property_title,
                    contact_id=str(doc.contact_id) if doc.contact_id else None,
                    contact_name=doc.contact_name,
                    uploaded_by=uploaded_by_name,
                    uploaded_at=doc.uploaded_at,
                    created_at=doc.created_at,
                    last_modified=doc.last_modified,
                    version=doc.version,
                    tags=doc.tags,
                    description=doc.description,
                    expiry_date=doc.expiry_date,
                    is_favorite=doc.is_favorite,
                    view_count=doc.view_count,
                    download_count=doc.download_count,
                    folder_id=doc.folder_id,
                    folder_name=folder_name,
                    checksum=doc.checksum,
                    search_vector=doc.search_vector,
                    ocr_text=doc.ocr_text,
                )
            )

        return document_responses, total

    async def create_document_version(
        self,
        document_id: str,
        file_url: str,
        file_size: int,
        checksum: str,
        user_id: str,
        change_notes: Optional[str] = None,
    ) -> DocumentVersionResponse:
        """Create a new version of a document"""

        # Get document
        document = await sync_to_async(Document.objects.get)(
            id=document_id, tenant_id=self.tenant_id
        )

        # Get next version number
        latest_version = await sync_to_async(
            DocumentVersion.objects.filter(document=document)
            .order_by("-version_number")
            .first
        )()

        next_version = (latest_version.version_number + 1) if latest_version else 1

        # Create version
        version = await sync_to_async(DocumentVersion.objects.create)(
            document=document,
            version_number=next_version,
            file_url=file_url,
            file_size=file_size,
            checksum=checksum,
            created_by_id=user_id,
            change_notes=change_notes,
        )

        # Update document with new file info
        await sync_to_async(document.__setattr__)("url", file_url)
        await sync_to_async(document.__setattr__)("size", file_size)
        await sync_to_async(document.__setattr__)("checksum", checksum)
        await sync_to_async(document.__setattr__)("version", next_version)
        await sync_to_async(document.save)()

        return DocumentVersionResponse.model_validate(version)

    async def get_document_versions(
        self, document_id: str
    ) -> List[DocumentVersionResponse]:
        """Get all versions of a document"""

        # Verify document exists and user has access
        await sync_to_async(Document.objects.get)(
            id=document_id, tenant_id=self.tenant_id
        )

        versions = await sync_to_async(list)(
            DocumentVersion.objects.filter(document_id=document_id).order_by(
                "-version_number"
            )
        )

        return [DocumentVersionResponse.model_validate(v) for v in versions]

    async def get_document_version(
        self, document_id: str, version_id: str
    ) -> DocumentVersionResponse:
        """Get a specific version of a document"""

        # Verify document exists and user has access
        await sync_to_async(Document.objects.get)(
            id=document_id, tenant_id=self.tenant_id
        )

        version = await sync_to_async(DocumentVersion.objects.get)(
            id=version_id, document_id=document_id
        )

        return DocumentVersionResponse.model_validate(version)

    async def update_document_visibility(
        self,
        document_id: str,
        visibility_request: DocumentVisibilityUpdateRequest,
        user_id: str,
    ) -> DocumentResponse:
        """Update document visibility"""

        document = await sync_to_async(Document.objects.get)(
            id=document_id, tenant_id=self.tenant_id
        )

        old_visibility = document.visibility
        await sync_to_async(document.__setattr__)(
            "visibility", visibility_request.visibility.value
        )
        await sync_to_async(document.save)()

        # Log visibility change
        await self.audit_service.audit_action(
            user_id=user_id,
            action="update_visibility",
            resource_type="document",
            resource_id=document_id,
            old_values={"visibility": old_visibility},
            new_values={"visibility": visibility_request.visibility.value},
        )

        # Manually construct response to avoid async issues
        uploaded_by_id = await sync_to_async(lambda: document.uploaded_by.id)()
        uploaded_by_name = await sync_to_async(
            lambda: f"{document.uploaded_by.first_name} {document.uploaded_by.last_name}".strip()
            or document.uploaded_by.email
        )()
        folder_name = await sync_to_async(
            lambda: document.folder.name if document.folder else None
        )()

        return DocumentResponse(
            id=str(document.id),
            name=document.name,
            original_name=document.original_name,
            title=document.title,
            type=document.type,
            category=document.category,
            status=document.status,
            visibility=document.visibility,
            size=document.size,
            mime_type=document.mime_type,
            url=document.url,
            thumbnail_url=document.thumbnail_url,
            property_id=str(document.property_id) if document.property_id else None,
            property_title=document.property_title,
            contact_id=str(document.contact_id) if document.contact_id else None,
            contact_name=document.contact_name,
            uploaded_by=uploaded_by_name,
            uploaded_at=document.uploaded_at,
            created_at=document.created_at,
            last_modified=document.last_modified,
            version=document.version,
            tags=document.tags,
            description=document.description,
            expiry_date=document.expiry_date,
            is_favorite=document.is_favorite,
            view_count=document.view_count,
            download_count=document.download_count,
            folder_id=document.folder_id,
            folder_name=folder_name,
            checksum=document.checksum,
            search_vector=document.search_vector,
            ocr_text=document.ocr_text,
        )

    async def trigger_ocr_processing(
        self, document_id: str, user_id: str
    ) -> Dict[str, Any]:
        """Trigger OCR processing for a document (stub implementation)"""

        document = await sync_to_async(Document.objects.get)(
            id=document_id, tenant_id=self.tenant_id
        )

        # In a real implementation, this would:
        # 1. Download the file from storage
        # 2. Send it to an OCR service (e.g., Google Vision API, Azure Computer Vision)
        # 3. Store the extracted text in document.ocr_text
        # 4. Update search_vector for full-text search

        # For now, return a stub response
        logger.info(f"OCR processing triggered for document {document_id}")

        # Log OCR request
        await self.audit_service.audit_action(
            user_id=user_id,
            action="trigger_ocr",
            resource_type="document",
            resource_id=document_id,
            description="OCR processing triggered",
        )

        return {
            "status": "processing",
            "message": "OCR processing has been triggered. This is a stub implementation.",
            "estimated_completion": "2-5 minutes",
        }

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
        sort_order: Optional[str] = None,
    ) -> Tuple[List[DocumentResponse], int]:
        """Get documents with filters and pagination"""

        queryset = Document.objects.filter(tenant_id=self.tenant_id)

        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(tags__icontains=search)
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

        total = await sync_to_async(queryset.count)()
        documents = await sync_to_async(list)(
            queryset.select_related("uploaded_by", "folder")[offset : offset + limit]
        )

        # Manually construct responses to avoid async issues
        document_responses = []
        for doc in documents:
            uploaded_by_id = await sync_to_async(lambda d=doc: d.uploaded_by.id)()
            uploaded_by_name = await sync_to_async(
                lambda d=doc: f"{d.uploaded_by.first_name} {d.uploaded_by.last_name}".strip()
                or d.uploaded_by.email
            )()
            folder_name = await sync_to_async(
                lambda d=doc: d.folder.name if d.folder else None
            )()

            document_responses.append(
                DocumentResponse(
                    id=str(doc.id),
                    name=doc.name,
                    original_name=doc.original_name,
                    title=doc.title,
                    type=doc.type,
                    category=doc.category,
                    status=doc.status,
                    visibility=doc.visibility,
                    size=doc.size,
                    mime_type=doc.mime_type,
                    url=doc.url,
                    thumbnail_url=doc.thumbnail_url,
                    property_id=str(doc.property_id) if doc.property_id else None,
                    property_title=doc.property_title,
                    contact_id=str(doc.contact_id) if doc.contact_id else None,
                    contact_name=doc.contact_name,
                    uploaded_by=uploaded_by_name,
                    uploaded_at=doc.uploaded_at,
                    created_at=doc.created_at,
                    last_modified=doc.last_modified,
                    version=doc.version,
                    tags=doc.tags,
                    description=doc.description,
                    expiry_date=doc.expiry_date,
                    is_favorite=doc.is_favorite,
                    view_count=doc.view_count,
                    download_count=doc.download_count,
                    folder_id=doc.folder_id,
                    folder_name=folder_name,
                    checksum=doc.checksum,
                    search_vector=doc.search_vector,
                    ocr_text=doc.ocr_text,
                )
            )

        return document_responses, total

    async def create_document(
        self,
        file_info: Dict[str, Any],
        metadata: UploadMetadataRequest,
        uploaded_by_id: str,
    ) -> DocumentResponse:
        """Create a new document"""

        # Billing Guard: Prüfe Storage-Limit ZUERST
        file_size_mb = file_info["size"] / (1024 * 1024)  # Bytes zu MB
        await BillingGuard.check_limit(
            self.tenant_id, "storage_gb", "create", int(file_size_mb)
        )

        user = await sync_to_async(User.objects.get)(id=uploaded_by_id)

        document = await sync_to_async(Document.objects.create)(
            tenant_id=self.tenant_id,
            name=file_info["filename"],
            original_name=file_info["original_name"],
            title=metadata.title or file_info["original_name"],
            type=metadata.type,
            category=metadata.category,
            status="active",
            visibility=metadata.visibility,
            size=file_info["size"],
            mime_type=file_info["mime_type"],
            url=file_info["url"],
            uploaded_by=user,
            tags=metadata.tags,
            description=metadata.description,
            expiry_date=metadata.expiry_date,
            folder_id=metadata.folder_id,
            property_id=metadata.property_id,
            contact_id=metadata.contact_id,
        )

        # Audit log
        await sync_to_async(AuditService.audit_action)(
            user=user,
            action="create",
            resource_type="document",
            resource_id=str(document.id),
            new_values={"title": document.title, "type": document.type},
        )

        # Log activity
        await self._log_activity(
            document_id=str(document.id),
            user_id=uploaded_by_id,
            action="uploaded",
            details={"filename": file_info["original_name"], "size": file_info["size"]},
        )

        # Manually construct response to avoid async issues with ForeignKey
        uploaded_by_name = f"{user.first_name} {user.last_name}".strip() or user.email

        return DocumentResponse(
            id=str(document.id),
            name=document.name,
            original_name=document.original_name,
            title=document.title,
            type=document.type,
            category=document.category,
            status=document.status,
            visibility=document.visibility,
            size=document.size,
            mime_type=document.mime_type,
            url=document.url,
            thumbnail_url=document.thumbnail_url,
            property_id=str(document.property_id) if document.property_id else None,
            property_title=document.property_title,
            contact_id=str(document.contact_id) if document.contact_id else None,
            contact_name=document.contact_name,
            uploaded_by=uploaded_by_name,
            uploaded_at=document.uploaded_at,
            created_at=document.created_at,
            last_modified=document.last_modified,
            version=document.version,
            tags=document.tags,
            description=document.description,
            expiry_date=document.expiry_date,
            is_favorite=document.is_favorite,
            view_count=document.view_count,
            download_count=document.download_count,
            folder_id=document.folder_id,
            folder_name=None,
            checksum=document.checksum,
            search_vector=document.search_vector,
            ocr_text=document.ocr_text,
        )

    async def toggle_favorite(self, document_id: str, user_id: str) -> bool:
        """Toggle document favorite status"""

        try:
            document = await sync_to_async(Document.objects.get)(
                id=document_id, tenant_id=self.tenant_id
            )
        except Document.DoesNotExist:
            raise NotFoundError("Document not found")

        document.is_favorite = not document.is_favorite
        await sync_to_async(document.save)()

        return document.is_favorite

    async def delete_document(self, document_id: str, user_id: str) -> None:
        """Delete a document"""

        try:
            document = await sync_to_async(Document.objects.get)(
                id=document_id, tenant_id=self.tenant_id
            )
        except Document.DoesNotExist:
            raise NotFoundError("Document not found")

        user = await sync_to_async(User.objects.get)(id=user_id)

        # Audit log
        await sync_to_async(AuditService.audit_action)(
            user=user,
            action="delete",
            resource_type="document",
            resource_id=document_id,
            old_values={"title": document.title, "type": document.type},
        )

        # Log activity before deleting
        await self._log_activity(
            document_id=document_id,
            user_id=user_id,
            action="deleted",
            details={"title": document.title},
        )

        await sync_to_async(document.delete)()

    async def get_folders(self) -> List[DocumentFolderResponse]:
        """Get document folders"""

        folders = await sync_to_async(list)(
            DocumentFolder.objects.filter(tenant_id=self.tenant_id).select_related(
                "created_by"
            )
        )

        # Build folder tree
        folder_dict = {}
        root_folders = []

        # Convert Django models to Pydantic models
        for folder in folders:
            # Get document count for this folder
            document_count = await sync_to_async(
                Document.objects.filter(
                    folder_id=folder.id, tenant_id=self.tenant_id
                ).count
            )()

            # Build path
            path = folder.name
            if folder.parent_id and folder.parent_id in folder_dict:
                parent_path = folder_dict[folder.parent_id].path
                path = f"{parent_path}/{folder.name}"

            folder_response = DocumentFolderResponse(
                id=folder.id,
                name=folder.name,
                description=folder.description,
                parent_id=folder.parent_id,
                path=path,
                color=folder.color,
                icon=folder.icon or "ri-folder-line",
                is_system=folder.is_system,
                created_by=str(folder.created_by.id) if folder.created_by else "",
                created_at=folder.created_at,
                document_count=document_count,
                subfolders=[],
            )
            folder_dict[folder.id] = folder_response

        # Build tree structure
        for folder in folders:
            if folder.parent_id:
                if folder.parent_id in folder_dict:
                    folder_dict[folder.parent_id].subfolders.append(
                        folder_dict[folder.id]
                    )
            else:
                root_folders.append(folder_dict[folder.id])

        return root_folders

    async def create_folder(
        self, folder_data: CreateFolderRequest, created_by_id: str
    ) -> DocumentFolderResponse:
        """Create a new folder"""

        user = await sync_to_async(User.objects.get)(id=created_by_id)

        folder = await sync_to_async(DocumentFolder.objects.create)(
            tenant_id=self.tenant_id,
            name=folder_data.name,
            description=folder_data.description,
            parent_id=folder_data.parent_folder_id,
            color=folder_data.color or "#3B82F6",
            icon=folder_data.icon or "ri-folder-line",
            created_by=user,
        )

        # Audit log
        await sync_to_async(AuditService.audit_action)(
            user=user,
            action="create",
            resource_type="folder",
            resource_id=str(folder.id),
            new_values={"name": folder.name},
        )

        # Build path
        path = folder.name
        if folder.parent_id:
            try:
                parent = await sync_to_async(DocumentFolder.objects.get)(
                    id=folder.parent_id
                )
                path = (
                    f"{parent.path}/{folder.name}"
                    if hasattr(parent, "path") and parent.path
                    else folder.name
                )
            except DocumentFolder.DoesNotExist:
                pass

        # Get document count
        document_count = await sync_to_async(
            Document.objects.filter(folder_id=folder.id, tenant_id=self.tenant_id).count
        )()

        # Return response with all required fields
        return DocumentFolderResponse(
            id=folder.id,
            name=folder.name,
            description=folder.description,
            parent_id=folder.parent_id,
            path=path,
            color=folder.color,
            icon=folder.icon or "ri-folder-line",
            is_system=folder.is_system,
            created_by=str(user.id),
            created_at=folder.created_at,
            document_count=document_count,
            subfolders=[],
        )

    async def delete_folder(self, folder_id: int, user_id: str) -> None:
        """Delete a folder"""

        try:
            folder = await sync_to_async(DocumentFolder.objects.get)(
                id=folder_id, tenant_id=self.tenant_id
            )
        except DocumentFolder.DoesNotExist:
            raise NotFoundError("Folder not found")

        # Check if folder has documents
        document_count = await sync_to_async(
            Document.objects.filter(folder_id=folder_id).count
        )()
        if document_count > 0:
            raise ValidationError("Cannot delete folder with documents")

        user = await sync_to_async(User.objects.get)(id=user_id)

        # Audit log
        await sync_to_async(AuditService.audit_action)(
            user=user,
            action="delete",
            resource_type="folder",
            resource_id=str(folder_id),
            old_values={"name": folder.name},
        )

        await sync_to_async(folder.delete)()

    async def get_analytics(self) -> DocumentAnalyticsResponse:
        """Get document analytics"""

        queryset = Document.objects.filter(tenant_id=self.tenant_id)

        total_documents = await sync_to_async(queryset.count)()
        total_folders = await sync_to_async(
            DocumentFolder.objects.filter(tenant_id=self.tenant_id).count
        )()

        # Total views
        total_views_result = await sync_to_async(
            lambda: queryset.aggregate(total=Sum("view_count"))
        )()
        total_views = total_views_result["total"] or 0

        favorite_documents = await sync_to_async(
            queryset.filter(is_favorite=True).count
        )()

        # Views this month
        from datetime import datetime, timedelta

        month_start = datetime.utcnow().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        views_this_month_result = await sync_to_async(
            lambda: queryset.filter(uploaded_at__gte=month_start).aggregate(
                total=Sum("view_count")
            )
        )()
        views_this_month = views_this_month_result["total"] or 0

        # Storage used
        storage_used_result = await sync_to_async(
            lambda: queryset.aggregate(total=Sum("size"))
        )()
        storage_used = storage_used_result["total"] or 0

        # Most viewed documents
        most_viewed = await sync_to_async(
            lambda: list(
                queryset.order_by("-view_count")[:5].values(
                    "id", "title", "view_count", "download_count"
                )
            )
        )()

        # Document counts by type
        counts_by_type = await sync_to_async(
            lambda: list(queryset.values("type").annotate(count=Count("id")))
        )()
        counts = {item["type"]: item["count"] for item in counts_by_type}

        return DocumentAnalyticsResponse(
            total_documents=total_documents,
            total_folders=total_folders,
            total_views=total_views,
            views_this_month=views_this_month,
            favorite_documents=favorite_documents,
            shared_documents=0,  # TODO: Implement sharing
            storage_used=storage_used,
            storage_limit=None,  # TODO: Implement storage limits
            most_viewed_documents=most_viewed,
            counts=counts,
            charts={},  # TODO: Implement charts
            recent_activities=[],  # TODO: Implement recent activities
        )

    async def get_document_activities(self, document_id: str) -> List[Dict[str, Any]]:
        """Get activities for a document"""
        activities = await sync_to_async(list)(
            DocumentActivity.objects.filter(
                document_id=document_id, tenant_id=self.tenant_id
            )
            .select_related("user")
            .order_by("-timestamp")
        )

        result = []
        for activity in activities:
            user_name = (
                f"{activity.user.first_name} {activity.user.last_name}".strip()
                or activity.user.email
            )
            result.append(
                {
                    "id": str(activity.id),
                    "action": activity.action,
                    "user": user_name,
                    "timestamp": activity.timestamp.isoformat(),
                    "details": activity.details,
                }
            )

        return result

    async def get_document_comments(self, document_id: str) -> List[Dict[str, Any]]:
        """Get comments for a document"""
        comments = await sync_to_async(list)(
            DocumentComment.objects.filter(
                document_id=document_id, tenant_id=self.tenant_id
            )
            .select_related("author")
            .order_by("-created_at")
        )

        result = []
        for comment in comments:
            author_name = (
                f"{comment.author.first_name} {comment.author.last_name}".strip()
                or comment.author.email
            )
            result.append(
                {
                    "id": str(comment.id),
                    "text": comment.text,
                    "author": author_name,
                    "created_at": comment.created_at.isoformat(),
                    "updated_at": (
                        comment.updated_at.isoformat() if comment.updated_at else None
                    ),
                }
            )

        return result

    async def add_document_comment(
        self, document_id: str, user_id: str, text: str
    ) -> Dict[str, Any]:
        """Add a comment to a document"""
        # Check document exists
        try:
            await sync_to_async(Document.objects.get)(
                id=document_id, tenant_id=self.tenant_id
            )
        except Document.DoesNotExist:
            raise NotFoundError("Document not found")

        user = await sync_to_async(User.objects.get)(id=user_id)

        comment = await sync_to_async(DocumentComment.objects.create)(
            document_id=document_id, tenant_id=self.tenant_id, text=text, author=user
        )

        # Log activity
        await self._log_activity(
            document_id=document_id,
            user_id=user_id,
            action="commented",
            details={"text": text[:100]},
        )

        author_name = f"{user.first_name} {user.last_name}".strip() or user.email

        return {
            "id": str(comment.id),
            "text": comment.text,
            "author": author_name,
            "created_at": comment.created_at.isoformat(),
            "updated_at": None,
        }

    async def update_document(
        self, document_id: str, user_id: str, update_data: UpdateDocumentRequest
    ) -> DocumentResponse:
        """Update a document"""
        try:
            document = await sync_to_async(Document.objects.get)(
                id=document_id, tenant_id=self.tenant_id
            )
        except Document.DoesNotExist:
            raise NotFoundError("Document not found")

        # Track changes for activity log
        changes = {}

        # Update fields if provided
        if update_data.title is not None:
            if document.title != update_data.title:
                changes["title"] = {"old": document.title, "new": update_data.title}
            document.title = update_data.title

        if update_data.description is not None:
            if document.description != update_data.description:
                changes["description"] = {
                    "old": document.description,
                    "new": update_data.description,
                }
            document.description = update_data.description

        if update_data.tags is not None:
            if document.tags != update_data.tags:
                changes["tags"] = {"old": document.tags, "new": update_data.tags}
            document.tags = update_data.tags

        if update_data.category is not None:
            if document.category != update_data.category:
                changes["category"] = {
                    "old": document.category,
                    "new": update_data.category,
                }
            document.category = update_data.category

        if update_data.expiry_date is not None:
            if document.expiry_date != update_data.expiry_date:
                changes["expiry_date"] = {
                    "old": (
                        document.expiry_date.isoformat()
                        if document.expiry_date
                        else None
                    ),
                    "new": update_data.expiry_date.isoformat(),
                }
            document.expiry_date = update_data.expiry_date

        await sync_to_async(document.save)()

        # Log activity if there were changes
        if changes:
            await self._log_activity(
                document_id=document_id,
                user_id=user_id,
                action="edited",
                details={"changes": changes},
            )

        # Get user for response
        user = await sync_to_async(User.objects.get)(id=document.uploaded_by_id)
        uploaded_by_name = f"{user.first_name} {user.last_name}".strip() or user.email

        return DocumentResponse(
            id=str(document.id),
            name=document.name,
            original_name=document.original_name,
            title=document.title,
            type=document.type,
            category=document.category,
            status=document.status,
            visibility=document.visibility,
            size=document.size,
            mime_type=document.mime_type,
            url=document.url,
            thumbnail_url=document.thumbnail_url,
            property_id=str(document.property_id) if document.property_id else None,
            property_title=document.property_title,
            contact_id=str(document.contact_id) if document.contact_id else None,
            contact_name=document.contact_name,
            uploaded_by=uploaded_by_name,
            uploaded_at=document.uploaded_at,
            created_at=document.created_at,
            last_modified=document.last_modified,
            version=document.version,
            tags=document.tags,
            description=document.description,
            expiry_date=document.expiry_date,
            is_favorite=document.is_favorite,
            view_count=document.view_count,
            download_count=document.download_count,
            folder_id=document.folder_id,
            folder_name=None,
            checksum=document.checksum,
            search_vector=document.search_vector,
            ocr_text=document.ocr_text,
        )
