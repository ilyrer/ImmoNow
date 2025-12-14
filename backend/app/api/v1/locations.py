"""
Location Market Data API Endpoints
CRUD operations for dynamic location management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
import logging

from app.api.deps import require_read_scope, require_write_scope, require_admin_scope
from app.core.security import TokenData
from app.schemas.location import (
    LocationMarketDataCreate,
    LocationMarketDataUpdate,
    LocationMarketDataResponse,
    LocationSearchResult,
    LocationListResponse,
)
from app.db.models.location import LocationMarketData
from asgiref.sync import sync_to_async

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/search",
    response_model=List[LocationSearchResult],
    summary="Search Locations",
    description="Search for cities/towns by name (autocomplete)",
    tags=["Locations"],
)
async def search_locations(
    query: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Max results"),
    current_user: TokenData = Depends(require_read_scope),
):
    """
    Search for locations by city name (case-insensitive, partial match)
    Used for autocomplete in AVM forms
    """
    try:
        locations = await sync_to_async(list)(
            LocationMarketData.search_cities(query, limit)
        )

        return [
            LocationSearchResult(
                id=loc.id,
                city=loc.city,
                state=loc.state,
                postal_code_start=loc.postal_code_start,
                population=loc.population,
                base_price_per_sqm=float(loc.base_price_per_sqm),
            )
            for loc in locations
        ]
    except Exception as e:
        logger.error(f"Error searching locations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search locations: {str(e)}",
        )


@router.get(
    "/by-postal-code/{postal_code}",
    response_model=Optional[LocationMarketDataResponse],
    summary="Get Location by Postal Code",
    description="Find location by postal code",
    tags=["Locations"],
)
async def get_location_by_postal_code(
    postal_code: str, current_user: TokenData = Depends(require_read_scope)
):
    """
    Get location data by postal code
    Used for automatic city detection in AVM
    """
    try:
        location = await sync_to_async(LocationMarketData.get_by_postal_code)(
            postal_code
        )

        if not location:
            return None

        return LocationMarketDataResponse.from_orm_obj(location)
    except Exception as e:
        logger.error(f"Error fetching location by postal code: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch location: {str(e)}",
        )


@router.get(
    "/",
    response_model=LocationListResponse,
    summary="List All Locations",
    description="Get paginated list of all locations",
    tags=["Locations"],
)
async def list_locations(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    search: Optional[str] = Query(None, description="Filter by city name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: TokenData = Depends(require_read_scope),
):
    """
    List all locations with pagination and filters
    """
    try:
        queryset = (
            LocationMarketData.objects.filter(is_active=True)
            if is_active is None
            else LocationMarketData.objects.filter(is_active=is_active)
        )

        if search:
            queryset = queryset.filter(city__icontains=search)

        total = await sync_to_async(queryset.count)()

        start = (page - 1) * page_size
        end = start + page_size

        locations = await sync_to_async(list)(
            queryset.order_by("-population", "city")[start:end]
        )

        return LocationListResponse(
            items=[LocationMarketDataResponse.from_orm_obj(loc) for loc in locations],
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        logger.error(f"Error listing locations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list locations: {str(e)}",
        )


@router.get(
    "/{location_id}",
    response_model=LocationMarketDataResponse,
    summary="Get Location by ID",
    description="Retrieve detailed location information",
    tags=["Locations"],
)
async def get_location(
    location_id: int, current_user: TokenData = Depends(require_read_scope)
):
    """
    Get detailed location information by ID
    """
    try:
        location = await sync_to_async(LocationMarketData.objects.get)(
            id=location_id, is_active=True
        )

        return LocationMarketDataResponse.from_orm_obj(location)
    except LocationMarketData.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with ID {location_id} not found",
        )
    except Exception as e:
        logger.error(f"Error fetching location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch location: {str(e)}",
        )


@router.post(
    "/",
    response_model=LocationMarketDataResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Location",
    description="Create a new location with market data (admin only)",
    tags=["Locations"],
)
async def create_location(
    location_data: LocationMarketDataCreate,
    current_user: TokenData = Depends(require_admin_scope),
):
    """
    Create a new location (admin only)
    """
    try:
        location = await sync_to_async(LocationMarketData.objects.create)(
            city=location_data.city,
            state=location_data.state,
            country=location_data.country,
            postal_code_start=location_data.postal_code_start,
            postal_code_end=location_data.postal_code_end,
            base_price_per_sqm=location_data.base_price_per_sqm,
            is_premium_location=location_data.is_premium_location,
            is_suburban=location_data.is_suburban,
            population=location_data.population,
            location_type=location_data.location_type,
            is_active=location_data.is_active,
        )

        logger.info(f"Created new location: {location.city} by user {current_user.sub}")

        return LocationMarketDataResponse.from_orm_obj(location)
    except Exception as e:
        logger.error(f"Error creating location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create location: {str(e)}",
        )


@router.put(
    "/{location_id}",
    response_model=LocationMarketDataResponse,
    summary="Update Location",
    description="Update existing location (admin only)",
    tags=["Locations"],
)
async def update_location(
    location_id: int,
    location_data: LocationMarketDataUpdate,
    current_user: TokenData = Depends(require_admin_scope),
):
    """
    Update an existing location (admin only)
    """
    try:
        location = await sync_to_async(LocationMarketData.objects.get)(id=location_id)

        # Update only provided fields
        update_data = location_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(location, field, value)

        await sync_to_async(location.save)()

        logger.info(
            f"Updated location {location_id}: {location.city} by user {current_user.sub}"
        )

        return LocationMarketDataResponse.from_orm_obj(location)
    except LocationMarketData.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with ID {location_id} not found",
        )
    except Exception as e:
        logger.error(f"Error updating location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update location: {str(e)}",
        )


@router.delete(
    "/{location_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Location",
    description="Soft-delete a location (admin only)",
    tags=["Locations"],
)
async def delete_location(
    location_id: int,
    hard_delete: bool = Query(
        False, description="Permanently delete (default: soft delete)"
    ),
    current_user: TokenData = Depends(require_admin_scope),
):
    """
    Delete a location (admin only)
    By default, performs soft delete (sets is_active=False)
    """
    try:
        location = await sync_to_async(LocationMarketData.objects.get)(id=location_id)

        if hard_delete:
            await sync_to_async(location.delete)()
            logger.warning(
                f"Hard deleted location {location_id}: {location.city} by user {current_user.sub}"
            )
        else:
            location.is_active = False
            await sync_to_async(location.save)()
            logger.info(
                f"Soft deleted location {location_id}: {location.city} by user {current_user.sub}"
            )

        return None
    except LocationMarketData.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with ID {location_id} not found",
        )
    except Exception as e:
        logger.error(f"Error deleting location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete location: {str(e)}",
        )
