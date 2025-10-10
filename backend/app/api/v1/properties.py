"""
Properties API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query

from app.api.deps import (
    require_read_scope, require_write_scope, require_delete_scope,
    get_tenant_id
)
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.properties import (
    PropertyResponse, PropertyListResponse,
    CreatePropertyRequest, UpdatePropertyRequest
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import PaginationParams, get_pagination_offset, validate_sort_field
from app.services.properties_service import PropertiesService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PropertyResponse])
async def get_properties(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search term"),
    property_type: Optional[str] = Query(None, description="Property type filter"),
    status: Optional[str] = Query(None, description="Status filter"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    city: Optional[str] = Query(None, description="City filter"),
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get paginated list of properties with filters"""
    
    # Validate sort field
    allowed_sort_fields = ["created_at", "title", "price", "living_area", "rooms"]
    sort_by = validate_sort_field(allowed_sort_fields, sort_by)
    
    # Calculate pagination offset
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    # Get properties from service
    properties_service = PropertiesService(tenant_id)
    properties, total = await properties_service.get_properties(
        offset=offset,
        limit=pagination.size,
        search=search,
        property_type=property_type,
        status=status,
        min_price=min_price,
        max_price=max_price,
        city=city,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return PaginatedResponse.create(
        items=properties,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("", response_model=PropertyResponse, status_code=201)
async def create_property(
    property_data: CreatePropertyRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new property"""
    
    properties_service = PropertiesService(tenant_id)
    property_obj = await properties_service.create_property(
        property_data, current_user.user_id
    )
    
    return property_obj


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific property"""
    
    properties_service = PropertiesService(tenant_id)
    property_obj = await properties_service.get_property(property_id)
    
    if not property_obj:
        raise NotFoundError("Property not found")
    
    return property_obj


@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    property_data: UpdatePropertyRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a property"""
    
    properties_service = PropertiesService(tenant_id)
    property_obj = await properties_service.update_property(
        property_id, property_data, current_user.user_id
    )
    
    if not property_obj:
        raise NotFoundError("Property not found")
    
    return property_obj


@router.delete("/{property_id}", status_code=204)
async def delete_property(
    property_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a property"""
    
    properties_service = PropertiesService(tenant_id)
    await properties_service.delete_property(property_id, current_user.user_id)
