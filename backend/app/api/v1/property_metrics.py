"""
Property Metrics API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import List, Optional
from datetime import datetime, timedelta

from app.api.deps import require_read_scope, require_write_scope, get_tenant_id
from app.core.security import TokenData
from app.services.property_metrics_service import PropertyMetricsService
from app.core.errors import NotFoundError

router = APIRouter()


@router.post("/properties/{property_id}/track-view")
async def track_property_view(
    property_id: str,
    request: Request,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Track a property view event"""
    
    try:
        # Extract viewer information from request
        viewer_ip = request.client.host if request.client else None
        user_agent = request.headers.get('user-agent')
        referrer = request.headers.get('referer')
        
        # Generate anonymous fingerprint (simplified)
        viewer_fingerprint = f"{viewer_ip}_{user_agent}".replace(' ', '')[:64] if viewer_ip else None
        
        metrics_service = PropertyMetricsService(tenant_id)
        view_event = await metrics_service.track_property_view(
            property_id=property_id,
            viewer_fingerprint=viewer_fingerprint,
            viewer_ip=viewer_ip,
            user_agent=user_agent,
            referrer=referrer,
            source='web'
        )
        
        return {
            "status": "success",
            "event_id": str(view_event.id),
            "property_id": property_id,
            "tracked_at": view_event.created_at
        }
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track view: {str(e)}"
        )


@router.post("/properties/{property_id}/track-inquiry")
async def track_property_inquiry(
    property_id: str,
    contact_name: Optional[str] = None,
    contact_email: Optional[str] = None,
    contact_phone: Optional[str] = None,
    contact_id: Optional[str] = None,
    source: str = 'web',
    inquiry_type: str = 'general',
    message: Optional[str] = None,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Track a property inquiry event"""
    
    try:
        metrics_service = PropertyMetricsService(tenant_id)
        inquiry_event = await metrics_service.track_property_inquiry(
            property_id=property_id,
            contact_name=contact_name,
            contact_email=contact_email,
            contact_phone=contact_phone,
            contact_id=contact_id,
            source=source,
            inquiry_type=inquiry_type,
            message=message
        )
        
        return {
            "status": "success",
            "event_id": str(inquiry_event.id),
            "property_id": property_id,
            "tracked_at": inquiry_event.created_at
        }
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track inquiry: {str(e)}"
        )


@router.get("/properties/{property_id}/metrics")
async def get_property_metrics(
    property_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get metrics for a specific property"""
    
    try:
        metrics_service = PropertyMetricsService(tenant_id)
        metrics = await metrics_service.get_property_metrics(property_id)
        
        return metrics
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get property metrics: {str(e)}"
        )


@router.get("/analytics/properties/top")
async def get_top_performing_properties(
    limit: int = Query(10, ge=1, le=50, description="Number of properties to return"),
    period_days: int = Query(30, ge=1, le=365, description="Period in days"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get top performing properties by views and inquiries"""
    
    try:
        metrics_service = PropertyMetricsService(tenant_id)
        top_properties = await metrics_service.get_top_performing_properties(
            limit=limit,
            period_days=period_days
        )
        
        return {
            "top_properties": top_properties,
            "period_days": period_days,
            "limit": limit,
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get top performing properties: {str(e)}"
        )


@router.get("/analytics/properties/summary")
async def get_property_analytics_summary(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get overall property analytics summary"""
    
    try:
        metrics_service = PropertyMetricsService(tenant_id)
        summary = await metrics_service.get_property_analytics_summary()
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics summary: {str(e)}"
        )


@router.get("/properties/{property_id}/view-trend")
async def get_property_view_trend(
    property_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days for trend"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get view trend for a property over time"""
    
    try:
        metrics_service = PropertyMetricsService(tenant_id)
        trend = await metrics_service.get_property_view_trend(
            property_id=property_id,
            days=days
        )
        
        return {
            "property_id": property_id,
            "trend_data": trend,
            "period_days": days,
            "generated_at": datetime.now()
        }
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get view trend: {str(e)}"
        )
