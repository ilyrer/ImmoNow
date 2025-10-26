"""
Portal API Endpoints für OAuth-Integration
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import RedirectResponse

from app.api.deps import (
    require_read_scope, require_write_scope, get_tenant_id
)
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.portals import (
    PortalConnectionResponse, PortalConnectionCreate, PortalConnectionUpdate,
    PortalPublishJobResponse, PortalPublishJobCreate, PortalPublishJobUpdate,
    PortalSyncLogResponse, PortalSyncLogCreate,
    PortalStatusResponse, PropertyPortalStatusResponse,
    OAuthInitiateRequest, OAuthCallbackRequest, OAuthUrlResponse,
    PortalPublishRequest, PortalSyncRequest, PortalUnpublishRequest,
    PortalType
)
from app.tasks.portal_tasks import publish_property_to_portal_task, sync_property_on_portal_task

router = APIRouter()


# OAuth Flow Endpoints
@router.post("/oauth/initiate", response_model=OAuthUrlResponse)
async def initiate_oauth_flow(
    request: OAuthInitiateRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """OAuth-Flow für Portal-Verbindung starten - ECHTE Integration"""
    
    async with RealPortalOAuthService(tenant_id) as oauth_service:
        return await oauth_service.initiate_oauth_flow(request)


@router.post("/oauth/callback", response_model=PortalConnectionResponse)
async def handle_oauth_callback(
    request: OAuthCallbackRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """OAuth-Callback verarbeiten - ECHTE Integration"""
    
    async with RealPortalOAuthService(tenant_id) as oauth_service:
        return await oauth_service.handle_oauth_callback(request, current_user.user_id)


@router.get("/oauth/callback/{portal}")
async def oauth_callback_redirect(
    portal: PortalType,
    code: str = Query(...),
    state: str = Query(...),
    error: Optional[str] = Query(None),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """OAuth-Callback Redirect Handler"""
    
    if error:
        # OAuth-Fehler behandeln
        return RedirectResponse(
            url=f"/properties/portals?error={error}&portal={portal}",
            status_code=302
        )
    
    # OAuth-Callback verarbeiten
    oauth_service = PortalOAuthService(tenant_id)
    callback_request = OAuthCallbackRequest(
        portal=portal,
        code=code,
        state=state,
        redirect_uri=f"https://your-app.com/oauth/callback/{portal}"
    )
    
    try:
        connection = await oauth_service.handle_oauth_callback(callback_request, current_user.user_id)
        return RedirectResponse(
            url=f"/properties/portals?success=true&portal={portal}",
            status_code=302
        )
    except Exception as e:
        return RedirectResponse(
            url=f"/properties/portals?error=callback_failed&portal={portal}",
            status_code=302
        )


# Portal Connection Management
@router.get("/connections", response_model=List[PortalConnectionResponse])
async def get_portal_connections(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Alle Portal-Verbindungen abrufen"""
    
    from app.db.models import PortalConnection
    
    @sync_to_async
    def get_connections():
        connections = PortalConnection.objects.filter(
            tenant_id=tenant_id,
            is_active=True
        ).order_by('portal')
        
        return [PortalConnectionResponse.model_validate(conn) for conn in connections]
    
    return await get_connections()


@router.get("/connections/{portal}", response_model=PortalConnectionResponse)
async def get_portal_connection(
    portal: PortalType,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Spezifische Portal-Verbindung abrufen"""
    
    from app.db.models import PortalConnection
    
    @sync_to_async
    def get_connection():
        try:
            connection = PortalConnection.objects.get(
                tenant_id=tenant_id,
                portal=portal
            )
            return PortalConnectionResponse.model_validate(connection)
        except PortalConnection.DoesNotExist:
            raise NotFoundError(f"No connection to {portal}")
    
    return await get_connection()


@router.delete("/connections/{portal}")
async def delete_portal_connection(
    portal: PortalType,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Portal-Verbindung löschen"""
    
    from app.db.models import PortalConnection
    
    @sync_to_async
    def delete_connection():
        try:
            connection = PortalConnection.objects.get(
                tenant_id=tenant_id,
                portal=portal
            )
            connection.delete()
        except PortalConnection.DoesNotExist:
            raise NotFoundError(f"No connection to {portal}")
    
    await delete_connection()


# Portal Publishing
@router.get("/properties/{property_id}/status", response_model=PropertyPortalStatusResponse)
async def get_property_portal_status(
    property_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Portal-Status für eine Immobilie abrufen"""
    
    publishing_service = PortalPublishingService(tenant_id)
    return await publishing_service.get_portal_status(property_id)


@router.post("/properties/{property_id}/publish", response_model=PortalPublishJobResponse)
async def publish_property_to_portal(
    property_id: str,
    request: PortalPublishRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Immobilie auf Portal veröffentlichen - ECHTE Integration mit Background-Job"""
    
    from app.db.models import PortalConnection, PortalPublishJob, Property
    
    @sync_to_async
    def create_publish_job():
        # Portal-Verbindung prüfen
        try:
            connection = PortalConnection.objects.get(
                tenant_id=tenant_id,
                portal=request.portal,
                is_active=True
            )
        except PortalConnection.DoesNotExist:
            raise NotFoundError(f"No active connection to {request.portal}")
        
        # Property laden
        try:
            property_obj = Property.objects.get(
                id=request.property_id,
                tenant_id=tenant_id
            )
        except Property.DoesNotExist:
            raise NotFoundError("Property not found")
        
        # Publish Job erstellen
        job, created = PortalPublishJob.objects.update_or_create(
            property=property_obj,
            portal_connection=connection,
            defaults={
                'status': 'pending',
                'portal_data': request.portal_data or {},
                'retry_count': 0,
            }
        )
        
        # Background-Task starten
        publish_property_to_portal_task.delay(str(job.id), tenant_id)
        
        return PortalPublishJobResponse.model_validate(job)
    
    return await create_publish_job()


@router.post("/properties/{property_id}/sync", response_model=List[PortalPublishJobResponse])
async def sync_property_on_portal(
    property_id: str,
    request: PortalSyncRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Immobilie auf Portal synchronisieren"""
    
    publishing_service = PortalPublishingService(tenant_id)
    return await publishing_service.sync_portal(request, current_user.user_id)


@router.post("/properties/{property_id}/unpublish", response_model=PortalPublishJobResponse)
async def unpublish_property_from_portal(
    property_id: str,
    request: PortalUnpublishRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Immobilie von Portal zurückziehen"""
    
    publishing_service = PortalPublishingService(tenant_id)
    return await publishing_service.unpublish_from_portal(request, current_user.user_id)


# Bulk Operations
@router.post("/bulk/publish")
async def bulk_publish_properties(
    property_ids: List[str] = Body(...),
    portal: PortalType = Body(...),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Mehrere Immobilien auf Portal veröffentlichen"""
    
    publishing_service = PortalPublishingService(tenant_id)
    results = []
    
    for property_id in property_ids:
        try:
            request = PortalPublishRequest(
                portal=portal,
                property_id=property_id
            )
            job = await publishing_service.publish_to_portal(request, current_user.user_id)
            results.append(job)
        except Exception as e:
            # Fehler loggen aber weitermachen
            continue
    
    return {"published": len(results), "jobs": results}


@router.post("/bulk/sync")
async def bulk_sync_properties(
    property_ids: List[str] = Body(...),
    portal: PortalType = Body(...),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Mehrere Immobilien auf Portal synchronisieren"""
    
    publishing_service = PortalPublishingService(tenant_id)
    results = []
    
    for property_id in property_ids:
        try:
            request = PortalSyncRequest(
                portal=portal,
                property_id=property_id
            )
            jobs = await publishing_service.sync_portal(request, current_user.user_id)
            results.extend(jobs)
        except Exception as e:
            # Fehler loggen aber weitermachen
            continue
    
    return {"synced": len(results), "jobs": results}


# Portal Analytics
@router.get("/analytics/{portal}")
async def get_portal_analytics(
    portal: PortalType,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Portal-Analytics abrufen"""
    
    from app.db.models import PortalPublishJob
    
    @sync_to_async
    def get_analytics():
        jobs = PortalPublishJob.objects.filter(
            portal_connection__tenant_id=tenant_id,
            portal_connection__portal=portal,
            status='published'
        )
        
        total_properties = jobs.count()
        total_views = sum(job.sync_data.get('views', 0) for job in jobs)
        total_inquiries = sum(job.sync_data.get('inquiries', 0) for job in jobs)
        
        return {
            'portal': portal,
            'total_properties': total_properties,
            'total_views': total_views,
            'total_inquiries': total_inquiries,
            'average_views_per_property': total_views / total_properties if total_properties > 0 else 0,
            'average_inquiries_per_property': total_inquiries / total_properties if total_properties > 0 else 0,
        }
    
    return await get_analytics()


# Portal Sync Logs
@router.get("/logs/{portal}", response_model=List[PortalSyncLogResponse])
async def get_portal_sync_logs(
    portal: PortalType,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Portal-Sync-Logs abrufen"""
    
    from app.db.models import PortalSyncLog
    
    @sync_to_async
    def get_logs():
        logs = PortalSyncLog.objects.filter(
            portal_connection__tenant_id=tenant_id,
            portal_connection__portal=portal
        ).order_by('-created_at')[offset:offset + limit]
        
        return [PortalSyncLogResponse.model_validate(log) for log in logs]
    
    return await get_logs()
