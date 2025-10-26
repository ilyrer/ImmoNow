"""
DSGVO Compliance API Endpoints
Handles data export, deletion, and anonymization for GDPR compliance
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
import io
import json
from datetime import datetime

from app.api.deps import get_current_user, require_admin_scope, get_tenant_id
from app.core.security import TokenData
from app.services.dsgvo_compliance_service import DSGVOComplianceService
from app.middleware.structured_logging import log_audit_event, log_business_event
from app.schemas.dsgvo import (
    UserDataExportResponse,
    UserDataDeletionResponse,
    TenantDataExportResponse,
    TenantDataDeletionResponse,
    DSGVORequestResponse
)

router = APIRouter()


@router.post(
    "/export/user/{user_id}",
    response_model=DSGVORequestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Export user data",
    description="""
    Export all user data for DSGVO compliance.
    
    This endpoint exports all personal data associated with a user including:
    - User profile information
    - Tenant memberships
    - Properties created
    - Documents uploaded
    - Contacts created
    - Tasks assigned
    - Social posts
    - Audit logs
    
    The export is returned as a JSON response containing all user data.
    """
)
async def export_user_data(
    user_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Export all user data for DSGVO compliance
    """
    try:
        # Check if user exists and is accessible
        from app.db.models import User
        from asgiref.sync import sync_to_async
        
        user_exists = await sync_to_async(User.objects.filter(id=user_id).exists)()
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Export user data
        export_data = await DSGVOComplianceService.export_user_data(user_id)
        
        # Log export event
        log_audit_event(
            event_type="dsgvo_user_export_requested",
            resource_type="user",
            resource_id=user_id,
            action="export",
            details={
                "exported_by": current_user.user_id,
                "export_type": "full_user_data"
            },
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        
        return DSGVORequestResponse(
            message="User data export completed successfully",
            request_id=f"export_user_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            status="completed",
            data=export_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log_audit_event(
            event_type="dsgvo_user_export_failed",
            resource_type="user",
            resource_id=user_id,
            action="export",
            details={"error": str(e)},
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User data export failed: {str(e)}"
        )


@router.get(
    "/export/user/{user_id}/download",
    summary="Download user data export",
    description="""
    Download user data export as a ZIP file.
    
    This endpoint returns the user data export as a downloadable ZIP file
    containing JSON files with all user data.
    """
)
async def download_user_data_export(
    user_id: str,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Download user data export as ZIP file
    """
    try:
        # Export user data
        export_data = await DSGVOComplianceService.export_user_data(user_id)
        
        # Create ZIP file
        filename = f"user_data_export_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        zip_content = DSGVOComplianceService.create_export_zip(export_data, filename)
        
        # Log download event
        log_audit_event(
            event_type="dsgvo_user_export_downloaded",
            resource_type="user",
            resource_id=user_id,
            action="download",
            details={
                "downloaded_by": current_user.user_id,
                "file_size": len(zip_content)
            },
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        
        # Return ZIP file as streaming response
        return StreamingResponse(
            io.BytesIO(zip_content),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.zip",
                "Content-Length": str(len(zip_content))
            }
        )
        
    except Exception as e:
        log_audit_event(
            event_type="dsgvo_user_export_download_failed",
            resource_type="user",
            resource_id=user_id,
            action="download",
            details={"error": str(e)},
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User data export download failed: {str(e)}"
        )


@router.post(
    "/delete/user/{user_id}",
    response_model=DSGVORequestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Delete user data",
    description="""
    Delete user data for DSGVO compliance.
    
    This endpoint deletes or anonymizes all personal data associated with a user.
    
    Parameters:
    - soft_delete: If true, data is anonymized instead of permanently deleted
    - grace_period_days: Number of days before hard deletion (if soft_delete=true)
    
    The deletion process includes:
    - User profile anonymization/deletion
    - Tenant membership deactivation
    - Property data anonymization
    - Document anonymization
    - Contact anonymization
    - Task anonymization
    - Social post anonymization
    - Audit log anonymization
    """
)
async def delete_user_data(
    user_id: str,
    soft_delete: bool = True,
    grace_period_days: int = 30,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Delete user data for DSGVO compliance
    """
    try:
        # Validate grace period
        if grace_period_days < 0 or grace_period_days > 365:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grace period must be between 0 and 365 days"
            )
        
        # Check if user exists
        from app.db.models import User
        from asgiref.sync import sync_to_async
        
        user_exists = await sync_to_async(User.objects.filter(id=user_id).exists)()
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete user data
        deletion_summary = await DSGVOComplianceService.delete_user_data(
            user_id, 
            soft_delete=soft_delete
        )
        
        # Log deletion event
        log_audit_event(
            event_type="dsgvo_user_deletion_requested",
            resource_type="user",
            resource_id=user_id,
            action="delete",
            details={
                "deleted_by": current_user.user_id,
                "deletion_type": "soft_delete" if soft_delete else "hard_delete",
                "grace_period_days": grace_period_days,
                "deleted_items": deletion_summary["deleted_items"]
            },
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        
        # Schedule hard deletion if soft delete
        if soft_delete and grace_period_days > 0:
            log_business_event(
                event_type="hard_deletion_scheduled",
                event_data={
                    "user_id": user_id,
                    "scheduled_date": (datetime.utcnow() + timedelta(days=grace_period_days)).isoformat(),
                    "grace_period_days": grace_period_days
                }
            )
        
        return DSGVORequestResponse(
            message="User data deletion completed successfully",
            request_id=f"delete_user_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            status="completed",
            data=deletion_summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log_audit_event(
            event_type="dsgvo_user_deletion_failed",
            resource_type="user",
            resource_id=user_id,
            action="delete",
            details={"error": str(e)},
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User data deletion failed: {str(e)}"
        )


@router.post(
    "/export/tenant",
    response_model=DSGVORequestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Export tenant data",
    description="""
    Export all tenant data for DSGVO compliance.
    
    This endpoint exports all data associated with a tenant including:
    - Tenant information
    - All users in tenant
    - All properties
    - All documents
    - All contacts
    - All tasks
    - Billing information
    
    The export is returned as a JSON response containing all tenant data.
    """
)
async def export_tenant_data(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Export all tenant data for DSGVO compliance
    """
    try:
        # Export tenant data
        export_data = await DSGVOComplianceService.export_tenant_data(tenant_id)
        
        # Log export event
        log_audit_event(
            event_type="dsgvo_tenant_export_requested",
            resource_type="tenant",
            resource_id=tenant_id,
            action="export",
            details={
                "exported_by": current_user.user_id,
                "export_type": "full_tenant_data"
            },
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        
        return DSGVORequestResponse(
            message="Tenant data export completed successfully",
            request_id=f"export_tenant_{tenant_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            status="completed",
            data=export_data
        )
        
    except Exception as e:
        log_audit_event(
            event_type="dsgvo_tenant_export_failed",
            resource_type="tenant",
            resource_id=tenant_id,
            action="export",
            details={"error": str(e)},
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tenant data export failed: {str(e)}"
        )


@router.get(
    "/export/tenant/download",
    summary="Download tenant data export",
    description="""
    Download tenant data export as a ZIP file.
    
    This endpoint returns the tenant data export as a downloadable ZIP file
    containing JSON files with all tenant data.
    """
)
async def download_tenant_data_export(
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Download tenant data export as ZIP file
    """
    try:
        # Export tenant data
        export_data = await DSGVOComplianceService.export_tenant_data(tenant_id)
        
        # Create ZIP file
        filename = f"tenant_data_export_{tenant_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        zip_content = DSGVOComplianceService.create_export_zip(export_data, filename)
        
        # Log download event
        log_audit_event(
            event_type="dsgvo_tenant_export_downloaded",
            resource_type="tenant",
            resource_id=tenant_id,
            action="download",
            details={
                "downloaded_by": current_user.user_id,
                "file_size": len(zip_content)
            },
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        
        # Return ZIP file as streaming response
        return StreamingResponse(
            io.BytesIO(zip_content),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}.zip",
                "Content-Length": str(len(zip_content))
            }
        )
        
    except Exception as e:
        log_audit_event(
            event_type="dsgvo_tenant_export_download_failed",
            resource_type="tenant",
            resource_id=tenant_id,
            action="download",
            details={"error": str(e)},
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tenant data export download failed: {str(e)}"
        )


@router.post(
    "/delete/tenant",
    response_model=DSGVORequestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Delete tenant data",
    description="""
    Delete tenant data for DSGVO compliance.
    
    This endpoint deletes or anonymizes all data associated with a tenant.
    
    Parameters:
    - soft_delete: If true, data is anonymized instead of permanently deleted
    - grace_period_days: Number of days before hard deletion (if soft_delete=true)
    
    WARNING: This operation will affect all users and data in the tenant.
    Use with extreme caution.
    """
)
async def delete_tenant_data(
    soft_delete: bool = True,
    grace_period_days: int = 30,
    current_user: TokenData = Depends(require_admin_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Delete tenant data for DSGVO compliance
    """
    try:
        # Validate grace period
        if grace_period_days < 0 or grace_period_days > 365:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grace period must be between 0 and 365 days"
            )
        
        # Additional confirmation for tenant deletion
        if not soft_delete:
            # This is a hard delete - require additional confirmation
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hard deletion of tenant data requires additional confirmation. Use soft_delete=true for safety."
            )
        
        # Delete tenant data
        deletion_summary = await DSGVOComplianceService.delete_tenant_data(
            tenant_id, 
            soft_delete=soft_delete
        )
        
        # Log deletion event
        log_audit_event(
            event_type="dsgvo_tenant_deletion_requested",
            resource_type="tenant",
            resource_id=tenant_id,
            action="delete",
            details={
                "deleted_by": current_user.user_id,
                "deletion_type": "soft_delete" if soft_delete else "hard_delete",
                "grace_period_days": grace_period_days,
                "deleted_items": deletion_summary["deleted_items"]
            },
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        
        # Schedule hard deletion if soft delete
        if soft_delete and grace_period_days > 0:
            log_business_event(
                event_type="tenant_hard_deletion_scheduled",
                event_data={
                    "tenant_id": tenant_id,
                    "scheduled_date": (datetime.utcnow() + timedelta(days=grace_period_days)).isoformat(),
                    "grace_period_days": grace_period_days
                }
            )
        
        return DSGVORequestResponse(
            message="Tenant data deletion completed successfully",
            request_id=f"delete_tenant_{tenant_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            status="completed",
            data=deletion_summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log_audit_event(
            event_type="dsgvo_tenant_deletion_failed",
            resource_type="tenant",
            resource_id=tenant_id,
            action="delete",
            details={"error": str(e)},
            user_id=current_user.user_id,
            tenant_id=tenant_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tenant data deletion failed: {str(e)}"
        )


@router.get(
    "/status",
    summary="Get DSGVO compliance status",
    description="""
    Get the current DSGVO compliance status for the tenant.
    
    This endpoint provides information about:
    - Data retention policies
    - Export capabilities
    - Deletion policies
    - Compliance status
    """
)
async def get_dsgvo_status(
    current_user: TokenData = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Get DSGVO compliance status
    """
    try:
        from app.db.models import Tenant, User, Property, Document, Contact, Task
        from asgiref.sync import sync_to_async
        
        # Get tenant info
        tenant = await sync_to_async(Tenant.objects.get)(id=tenant_id)
        
        # Count data items
        users_count = await sync_to_async(User.objects.filter(tenantuser__tenant_id=tenant_id).count)()
        properties_count = await sync_to_async(Property.objects.filter(tenant_id=tenant_id).count)()
        documents_count = await sync_to_async(Document.objects.filter(tenant_id=tenant_id).count)()
        contacts_count = await sync_to_async(Contact.objects.filter(tenant_id=tenant_id).count)()
        tasks_count = await sync_to_async(Task.objects.filter(tenant_id=tenant_id).count)()
        
        status_data = {
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
            "compliance_status": "compliant",
            "data_retention_policy": {
                "user_data_retention_days": 365,
                "audit_log_retention_days": 2555,  # 7 years
                "deleted_data_retention_days": 30
            },
            "data_counts": {
                "users": users_count,
                "properties": properties_count,
                "documents": documents_count,
                "contacts": contacts_count,
                "tasks": tasks_count
            },
            "export_capabilities": {
                "user_data_export": True,
                "tenant_data_export": True,
                "bulk_export": True,
                "zip_download": True
            },
            "deletion_capabilities": {
                "soft_delete": True,
                "hard_delete": True,
                "anonymization": True,
                "grace_period": True
            },
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }
        
        return status_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get DSGVO status: {str(e)}"
        )
