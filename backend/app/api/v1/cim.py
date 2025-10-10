"""
CIM API Endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query

from app.api.deps import require_read_scope, get_tenant_id
from app.core.security import TokenData
from app.schemas.cim import CIMOverviewResponse
from app.services.cim_service import CIMService

router = APIRouter()


@router.get("/overview", response_model=CIMOverviewResponse)
async def get_cim_overview(
    limit: Optional[int] = Query(10, ge=1, le=100, description="Limit for recent items"),
    days_back: Optional[int] = Query(30, ge=1, le=365, description="Days back for recent items"),
    property_status: Optional[str] = Query(None, description="Property status filter"),
    contact_status: Optional[str] = Query(None, description="Contact status filter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get CIM dashboard overview"""
    
    cim_service = CIMService(tenant_id)
    overview = await cim_service.get_overview(
        limit=limit,
        days_back=days_back,
        property_status=property_status,
        contact_status=contact_status
    )
    
    return overview
