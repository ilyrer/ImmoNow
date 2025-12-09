"""
Properties API Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, UploadFile, File

from app.api.deps import (
    require_read_scope,
    require_write_scope,
    require_delete_scope,
    get_tenant_id,
)
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.properties import (
    PropertyResponse,
    PropertyListResponse,
    CreatePropertyRequest,
    UpdatePropertyRequest,
    PropertyImage as PropertyImageSchema,
    PropertyDocument as PropertyDocumentSchema,
)
from app.schemas.common import PaginatedResponse
from app.core.pagination import (
    PaginationParams,
    get_pagination_offset,
    validate_sort_field,
)
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
    rooms_min: Optional[int] = Query(None, description="Minimum rooms filter"),
    rooms_max: Optional[int] = Query(None, description="Maximum rooms filter"),
    bedrooms_min: Optional[int] = Query(None, description="Minimum bedrooms filter"),
    bedrooms_max: Optional[int] = Query(None, description="Maximum bedrooms filter"),
    bathrooms_min: Optional[int] = Query(None, description="Minimum bathrooms filter"),
    bathrooms_max: Optional[int] = Query(None, description="Maximum bathrooms filter"),
    living_area_min: Optional[int] = Query(
        None, description="Minimum living area filter"
    ),
    living_area_max: Optional[int] = Query(
        None, description="Maximum living area filter"
    ),
    plot_area_min: Optional[int] = Query(None, description="Minimum plot area filter"),
    plot_area_max: Optional[int] = Query(None, description="Maximum plot area filter"),
    year_built_min: Optional[int] = Query(
        None, description="Minimum year built filter"
    ),
    year_built_max: Optional[int] = Query(
        None, description="Maximum year built filter"
    ),
    energy_class: Optional[str] = Query(None, description="Energy class filter"),
    heating_type: Optional[str] = Query(None, description="Heating type filter"),
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
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
        rooms_min=rooms_min,
        rooms_max=rooms_max,
        bedrooms_min=bedrooms_min,
        bedrooms_max=bedrooms_max,
        bathrooms_min=bathrooms_min,
        bathrooms_max=bathrooms_max,
        living_area_min=living_area_min,
        living_area_max=living_area_max,
        plot_area_min=plot_area_min,
        plot_area_max=plot_area_max,
        year_built_min=year_built_min,
        year_built_max=year_built_max,
        energy_class=energy_class,
        heating_type=heating_type,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return PaginatedResponse.create(
        items=properties, total=total, page=pagination.page, size=pagination.size
    )


@router.post("", response_model=PropertyResponse, status_code=201)
async def create_property(
    property_data: CreatePropertyRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
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
    tenant_id: str = Depends(get_tenant_id),
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
    tenant_id: str = Depends(get_tenant_id),
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
    tenant_id: str = Depends(get_tenant_id),
):
    """Delete a property"""

    properties_service = PropertiesService(tenant_id)
    await properties_service.delete_property(property_id, current_user.user_id)


@router.get("/{property_id}/metrics", response_model=dict)
async def get_property_metrics(
    property_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Get property performance metrics"""

    properties_service = PropertiesService(tenant_id)
    metrics = await properties_service.get_property_metrics(property_id)

    return metrics


@router.post("/{property_id}/metrics/sync", response_model=dict)
async def sync_property_metrics(
    property_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """
    Manually trigger metrics sync from all connected portals.
    Fetches fresh data from ImmoScout24, Immowelt, etc.
    """

    properties_service = PropertiesService(tenant_id)
    result = await properties_service.sync_property_metrics_from_portals(property_id)

    return result


@router.post(
    "/{property_id}/media", response_model=List[PropertyImageSchema], status_code=201
)
async def upload_property_images(
    property_id: str,
    files: List[UploadFile] = File(..., description="Image files to upload"),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Upload images for a property

    Accepts multiple image files in multipart/form-data format.
    Supported formats: JPG, PNG, WEBP
    """

    properties_service = PropertiesService(tenant_id)

    # Convert UploadFile to Django's UploadedFile format
    from django.core.files.uploadedfile import InMemoryUploadedFile
    from io import BytesIO

    django_files = []
    for file in files:
        content = await file.read()
        django_file = InMemoryUploadedFile(
            file=BytesIO(content),
            field_name="file",
            name=file.filename or "unnamed.jpg",
            content_type=file.content_type or "image/jpeg",
            size=len(content),
            charset=None,
        )
        django_files.append(django_file)

    images = await properties_service.upload_images(
        property_id, django_files, current_user.user_id
    )

    return images


@router.post(
    "/{property_id}/documents",
    response_model=List[PropertyDocumentSchema],
    status_code=201,
)
async def upload_property_documents(
    property_id: str,
    files: List[UploadFile] = File(..., description="Document files to upload"),
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Upload documents for a property

    Accepts multiple document files in multipart/form-data format.
    Supported formats: PDF, DOC, DOCX
    """

    properties_service = PropertiesService(tenant_id)

    # Convert UploadFile to Django's UploadedFile format
    from django.core.files.uploadedfile import InMemoryUploadedFile
    from io import BytesIO

    django_files = []
    for file in files:
        content = await file.read()
        django_file = InMemoryUploadedFile(
            file=BytesIO(content),
            field_name="file",
            name=file.filename or "unnamed.pdf",
            content_type=file.content_type or "application/pdf",
            size=len(content),
            charset=None,
        )
        django_files.append(django_file)

    documents = await properties_service.upload_documents(
        property_id, django_files, current_user.user_id
    )

    return documents


@router.patch("/{property_id}/media/{image_id}/primary", status_code=204)
async def set_primary_image(
    property_id: str,
    image_id: str,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Set an image as the primary image for a property"""

    properties_service = PropertiesService(tenant_id)
    await properties_service.set_primary_image(property_id, image_id)


@router.delete("/{property_id}/media/{image_id}", status_code=204)
async def delete_property_image(
    property_id: str,
    image_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Delete a property image"""

    properties_service = PropertiesService(tenant_id)
    await properties_service.delete_image(property_id, image_id)


@router.delete("/{property_id}/documents/{document_id}", status_code=204)
async def delete_property_document(
    property_id: str,
    document_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id),
):
    """Delete a property document"""

    properties_service = PropertiesService(tenant_id)
    await properties_service.delete_document(property_id, document_id)
