"""
Publishing API

Endpoints for managing property publications to external portals
like ImmoScout24, Immowelt, etc.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

from app.db.models import Property, PublishJob, User
from app.services.immoscout_service import ImmoScout24Service
from app.services.auth_service import AuthService
from app.core.errors import NotFoundError, UnauthorizedError, ExternalServiceError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter()
security = HTTPBearer()


# Request/Response Models
class PublishRequest(BaseModel):
    """Request model for publishing property"""

    portal: str = Field(
        ..., description="Portal to publish to (immoscout24, immowelt, etc.)"
    )
    property_id: UUID = Field(..., description="Property ID to publish")


class PublishResponse(BaseModel):
    """Response model for publish operation"""

    success: bool
    message: str
    publish_job_id: Optional[str] = None
    portal_property_id: Optional[str] = None
    portal_url: Optional[str] = None


class UnpublishRequest(BaseModel):
    """Request model for unpublishing property"""

    publish_job_id: UUID = Field(..., description="Publish job ID to unpublish")


class UnpublishResponse(BaseModel):
    """Response model for unpublish operation"""

    success: bool
    message: str


class PublishJobResponse(BaseModel):
    """Response model for publish job"""

    id: str
    property_id: str
    property_title: str
    portal: str
    status: str
    portal_property_id: Optional[str] = None
    portal_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    published_at: Optional[datetime] = None
    unpublished_at: Optional[datetime] = None


class MetricsResponse(BaseModel):
    """Response model for property metrics"""

    property_id: str
    portal_property_id: str
    views: int
    inquiries: int
    favorites: int
    last_updated: str


class SyncMetricsResponse(BaseModel):
    """Response model for metrics sync"""

    success: bool
    synced_count: int
    error_count: int
    total_count: int


# Dependencies
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        payload = AuthService.verify_token(token)

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token")

        user = await User.objects.aget(id=user_id)
        return user
    except Exception as e:
        raise UnauthorizedError(f"Authentication failed: {str(e)}")


# Service instances
immoscout_service = ImmoScout24Service()


@router.post(
    "/publish",
    response_model=PublishResponse,
    summary="Publish property to external portal",
    status_code=status.HTTP_201_CREATED,
)
async def publish_property(
    request: PublishRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """
    Publish a property to an external portal (ImmoScout24, Immowelt, etc.)
    """
    try:
        # Check if property exists
        try:
            property_obj = await Property.objects.aget(id=request.property_id)
        except Property.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Property not found"
            )

        # Check if already published to this portal
        existing_job = await PublishJob.objects.filter(
            property=property_obj,
            portal=request.portal,
            status__in=["published", "publishing"],
        ).afirst()

        if existing_job:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Property already published to {request.portal}",
            )

        # Publish based on portal
        if request.portal == "immoscout24":
            result = await immoscout_service.publish_property(
                str(request.property_id),
                str(current_user.tenant_id),
                str(current_user.id),
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Portal {request.portal} not supported yet",
            )

        return PublishResponse(
            success=True,
            message=f"Property published to {request.portal} successfully",
            publish_job_id=result["publish_job_id"],
            portal_property_id=result.get("portal_property_id"),
            portal_url=result.get("portal_url"),
        )

    except ExternalServiceError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish property: {str(e)}",
        )


@router.post(
    "/unpublish",
    response_model=UnpublishResponse,
    summary="Unpublish property from external portal",
    status_code=status.HTTP_200_OK,
)
async def unpublish_property(
    request: UnpublishRequest, current_user: User = Depends(get_current_user)
):
    """
    Unpublish a property from an external portal
    """
    try:
        # Get publish job
        try:
            publish_job = await PublishJob.objects.aget(id=request.publish_job_id)
        except PublishJob.DoesNotExist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Publish job not found"
            )

        # Unpublish based on portal
        if publish_job.portal == "immoscout24":
            result = await immoscout_service.unpublish_property(
                str(request.publish_job_id), str(current_user.tenant_id)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Portal {publish_job.portal} not supported yet",
            )

        return UnpublishResponse(
            success=True,
            message=f"Property unpublished from {publish_job.portal} successfully",
        )

    except ExternalServiceError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unpublish property: {str(e)}",
        )


@router.get(
    "/jobs",
    response_model=List[PublishJobResponse],
    summary="Get all publish jobs for current user's tenant",
    status_code=status.HTTP_200_OK,
)
async def get_publish_jobs(current_user: User = Depends(get_current_user)):
    """
    Get all publish jobs for the current user's tenant
    """
    try:
        jobs = (
            await PublishJob.objects.filter(property__tenant=current_user.tenant)
            .select_related("property")
            .order_by("-created_at")
            .aiterator()
        )

        result = []
        async for job in jobs:
            result.append(
                PublishJobResponse(
                    id=str(job.id),
                    property_id=str(job.property.id),
                    property_title=job.property.title,
                    portal=job.portal,
                    status=job.status,
                    portal_property_id=job.portal_property_id,
                    portal_url=job.portal_url,
                    error_message=job.error_message,
                    created_at=job.created_at,
                    published_at=job.published_at,
                    unpublished_at=job.unpublished_at,
                )
            )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get publish jobs: {str(e)}",
        )


@router.get(
    "/jobs/{job_id}",
    response_model=PublishJobResponse,
    summary="Get specific publish job",
    status_code=status.HTTP_200_OK,
)
async def get_publish_job(job_id: UUID, current_user: User = Depends(get_current_user)):
    """
    Get a specific publish job by ID
    """
    try:
        job = await PublishJob.objects.select_related("property").aget(
            id=job_id, property__tenant=current_user.tenant
        )

        return PublishJobResponse(
            id=str(job.id),
            property_id=str(job.property.id),
            property_title=job.property.title,
            portal=job.portal,
            status=job.status,
            portal_property_id=job.portal_property_id,
            portal_url=job.portal_url,
            error_message=job.error_message,
            created_at=job.created_at,
            published_at=job.published_at,
            unpublished_at=job.unpublished_at,
        )

    except PublishJob.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Publish job not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get publish job: {str(e)}",
        )


@router.get(
    "/metrics/{portal_property_id}",
    response_model=MetricsResponse,
    summary="Get property metrics from portal",
    status_code=status.HTTP_200_OK,
)
async def get_property_metrics(
    portal_property_id: str, current_user: User = Depends(get_current_user)
):
    """
    Get metrics for a specific property from the portal
    """
    try:
        metrics = await immoscout_service.get_property_metrics(
            portal_property_id, str(current_user.tenant_id)
        )

        return MetricsResponse(
            property_id="",  # You might want to get this from the publish job
            portal_property_id=portal_property_id,
            views=metrics["views"],
            inquiries=metrics["inquiries"],
            favorites=metrics["favorites"],
            last_updated=metrics["last_updated"],
        )

    except ExternalServiceError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get property metrics: {str(e)}",
        )


@router.post(
    "/metrics/sync",
    response_model=SyncMetricsResponse,
    summary="Sync metrics for all published properties",
    status_code=status.HTTP_200_OK,
)
async def sync_all_metrics(
    background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user)
):
    """
    Sync metrics for all published properties from external portals
    """
    try:
        result = await immoscout_service.sync_all_property_metrics(
            str(current_user.tenant_id)
        )

        return SyncMetricsResponse(
            success=result["success"],
            synced_count=result["synced_count"],
            error_count=result["error_count"],
            total_count=result["total_count"],
        )

    except ExternalServiceError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync metrics: {str(e)}",
        )


@router.post(
    "/jobs/{job_id}/retry",
    response_model=PublishResponse,
    summary="Retry failed publish job",
    status_code=status.HTTP_200_OK,
)
async def retry_publish_job(
    job_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """
    Retry a failed publish job
    """
    try:
        job = await PublishJob.objects.select_related("property").aget(
            id=job_id, property__tenant=current_user.tenant
        )

        if job.status != "failed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only retry failed jobs",
            )

        # Reset job status
        job.status = "pending"
        job.error_message = None
        job.retry_count += 1
        await job.asave()

        # Retry publishing
        if job.portal == "immoscout24":
            result = await immoscout_service.publish_property(
                str(job.property.id), str(current_user.tenant_id), str(current_user.id)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Portal {job.portal} not supported yet",
            )

        return PublishResponse(
            success=True,
            message=f"Property republished to {job.portal} successfully",
            publish_job_id=str(job.id),
            portal_property_id=result.get("portal_property_id"),
            portal_url=result.get("portal_url"),
        )

    except PublishJob.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Publish job not found"
        )
    except ExternalServiceError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retry publish job: {str(e)}",
        )


# =====================================================
# AUTO-PUBLISH ENDPOINTS
# =====================================================


class AutoPublishSettingsRequest(BaseModel):
    """Request model for updating auto-publish settings"""

    auto_publish_enabled: bool = Field(
        ..., description="Enable/disable auto-publishing"
    )
    auto_publish_portals: List[str] = Field(
        default=[], description="List of portal IDs to auto-publish to"
    )


class AutoPublishSettingsResponse(BaseModel):
    """Response model for auto-publish settings"""

    property_id: str
    auto_publish_enabled: bool
    auto_publish_portals: List[str]
    last_auto_publish: Optional[datetime] = None


class PushNowRequest(BaseModel):
    """Request model for immediate push"""

    portals: List[str] = Field(..., description="List of portal IDs to push to")


class PushNowResponse(BaseModel):
    """Response model for immediate push"""

    success: bool
    message: str
    jobs_created: int
    portals: List[str]


@router.get(
    "/properties/{property_id}/auto-publish",
    response_model=AutoPublishSettingsResponse,
    summary="Get auto-publish settings for a property",
)
async def get_auto_publish_settings(
    property_id: UUID, current_user: User = Depends(get_current_user)
):
    """
    Get the current auto-publish settings for a property
    """
    try:
        property_obj = await Property.objects.aget(id=property_id)

        return AutoPublishSettingsResponse(
            property_id=str(property_obj.id),
            auto_publish_enabled=getattr(property_obj, "auto_publish_enabled", False),
            auto_publish_portals=getattr(property_obj, "auto_publish_portals", [])
            or [],
            last_auto_publish=getattr(property_obj, "last_auto_publish", None),
        )

    except Property.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Property not found"
        )


@router.put(
    "/properties/{property_id}/auto-publish",
    response_model=AutoPublishSettingsResponse,
    summary="Update auto-publish settings for a property",
)
async def update_auto_publish_settings(
    property_id: UUID,
    request: AutoPublishSettingsRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Update the auto-publish settings for a property.
    When enabled, the property will be automatically pushed to the selected
    portals 10 times daily (every ~2.4 hours).
    """
    try:
        property_obj = await Property.objects.aget(id=property_id)

        # Update settings
        property_obj.auto_publish_enabled = request.auto_publish_enabled
        property_obj.auto_publish_portals = request.auto_publish_portals
        await property_obj.asave()

        return AutoPublishSettingsResponse(
            property_id=str(property_obj.id),
            auto_publish_enabled=property_obj.auto_publish_enabled,
            auto_publish_portals=property_obj.auto_publish_portals or [],
            last_auto_publish=getattr(property_obj, "last_auto_publish", None),
        )

    except Property.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Property not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update auto-publish settings: {str(e)}",
        )


@router.post(
    "/properties/{property_id}/push-now",
    response_model=PushNowResponse,
    summary="Immediately push property to selected portals",
)
async def push_property_now(
    property_id: UUID,
    request: PushNowRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """
    Immediately push a property to the specified portals.
    This bypasses the auto-publish schedule and pushes right away.
    """
    try:
        property_obj = await Property.objects.aget(id=property_id)

        if not request.portals:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one portal must be specified",
            )

        jobs_created = 0

        for portal in request.portals:
            # Check if there's an existing publish job
            existing_job = await PublishJob.objects.filter(
                property=property_obj, portal=portal, status="published"
            ).afirst()

            if existing_job:
                # Update existing job - trigger refresh
                existing_job.status = "publishing"
                await existing_job.asave()

                # Add background task to refresh on portal
                if portal == "immoscout24":
                    background_tasks.add_task(
                        _refresh_property_on_portal,
                        str(property_id),
                        portal,
                        str(current_user.tenant_id),
                        str(current_user.id),
                    )
            else:
                # Create new publish job
                new_job = await PublishJob.objects.acreate(
                    property=property_obj,
                    portal=portal,
                    status="pending",
                    created_by=current_user,
                )

                # Add background task to publish
                if portal == "immoscout24":
                    background_tasks.add_task(
                        immoscout_service.publish_property,
                        str(property_id),
                        str(current_user.tenant_id),
                        str(current_user.id),
                    )
                # Add more portals here as they're implemented

            jobs_created += 1

        # Update last push timestamp
        property_obj.last_auto_publish = datetime.now()
        await property_obj.asave()

        return PushNowResponse(
            success=True,
            message=f"Property pushed to {len(request.portals)} portal(s)",
            jobs_created=jobs_created,
            portals=request.portals,
        )

    except Property.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Property not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to push property: {str(e)}",
        )


async def _refresh_property_on_portal(
    property_id: str, portal: str, tenant_id: str, user_id: str
):
    """
    Background task to refresh property on a portal.
    This updates the listing with any changes and resets the "freshness" indicator.
    """
    try:
        if portal == "immoscout24":
            # For ImmoScout24, we use their update API
            await immoscout_service.update_property(property_id, tenant_id, user_id)
        # Add more portals here

        # Update job status back to published
        job = await PublishJob.objects.filter(
            property_id=property_id, portal=portal
        ).afirst()

        if job:
            job.status = "published"
            job.published_at = datetime.now()
            await job.asave()

    except Exception as e:
        print(f"Error refreshing property on {portal}: {e}")
        # Update job with error
        job = await PublishJob.objects.filter(
            property_id=property_id, portal=portal
        ).afirst()

        if job:
            job.status = "error"
            job.error_message = str(e)
            await job.asave()
