"""
Analytics API Endpoints
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query

from app.api.deps import require_read_scope, get_tenant_id
from app.core.security import TokenData
from app.services.analytics_service import AnalyticsService
from app.services.kpi_service import KPIService

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analytics"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get dashboard analytics"""
    
    analytics_service = AnalyticsService(tenant_id)
    analytics = await analytics_service.get_dashboard_analytics(
        start_date=start_date,
        end_date=end_date
    )
    
    return analytics


@router.get("/properties")
async def get_property_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analytics"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get property analytics"""
    
    analytics_service = AnalyticsService(tenant_id)
    analytics = await analytics_service.get_property_analytics(
        start_date=start_date,
        end_date=end_date
    )
    
    return analytics


@router.get("/properties/top")
async def get_top_properties(
    limit: int = Query(5, ge=1, le=50, description="Number of top properties to return"),
    metric: str = Query("views", description="Metric to rank by: views, inquiries, favorites"),
    timeframe: str = Query("month", description="Timeframe: week, month, quarter, year"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get top performing properties"""
    
    analytics_service = AnalyticsService(tenant_id)
    top_properties = await analytics_service.get_top_properties(
        limit=limit,
        metric=metric,
        timeframe=timeframe
    )
    
    return top_properties


@router.get("/contacts")
async def get_contact_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analytics"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get contact analytics"""
    
    analytics_service = AnalyticsService(tenant_id)
    analytics = await analytics_service.get_contact_analytics(
        start_date=start_date,
        end_date=end_date
    )
    
    return analytics


@router.get("/tasks")
async def get_task_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analytics"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get task analytics"""
    
    analytics_service = AnalyticsService(tenant_id)
    analytics = await analytics_service.get_task_analytics(
        start_date=start_date,
        end_date=end_date
    )
    
    return analytics


@router.get("/kpi")
async def get_kpi_dashboard(
    timeframe: str = Query('month', description="Timeframe: week, month, quarter, year"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get KPI dashboard with live data"""
    
    kpi_service = KPIService(tenant_id)
    kpi_data = await kpi_service.get_kpi_dashboard(timeframe=timeframe)
    
    return kpi_data
