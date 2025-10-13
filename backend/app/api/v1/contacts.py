"""
Contacts API Endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query

from app.api.deps import (
    require_read_scope, require_write_scope, require_delete_scope,
    get_tenant_id
)
from app.core.security import TokenData
from app.core.errors import NotFoundError
from app.schemas.contacts import (
    ContactResponse, ContactListResponse,
    CreateContactRequest, UpdateContactRequest
)
from app.schemas.common import PaginatedResponse
from app.schemas.properties import PropertyResponse
from app.core.pagination import PaginationParams, get_pagination_offset, validate_sort_field
from app.services.contacts_service import ContactsService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ContactResponse])
async def get_contacts(
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, description="Search term"),
    status: Optional[str] = Query(None, description="Status filter"),
    company: Optional[str] = Query(None, description="Company filter"),
    min_budget: Optional[float] = Query(None, description="Minimum budget filter"),
    max_budget: Optional[float] = Query(None, description="Maximum budget filter"),
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get paginated list of contacts with filters"""
    
    # Validate sort field
    allowed_sort_fields = ["created_at", "name", "email", "lead_score", "budget_min"]
    sort_by = validate_sort_field(allowed_sort_fields, sort_by)
    
    # Calculate pagination offset
    offset = get_pagination_offset(pagination.page, pagination.size)
    
    # Get contacts from service
    contacts_service = ContactsService(tenant_id)
    contacts, total = await contacts_service.get_contacts(
        offset=offset,
        limit=pagination.size,
        search=search,
        status=status,
        company=company,
        min_budget=min_budget,
        max_budget=max_budget,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return PaginatedResponse.create(
        items=contacts,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("", response_model=ContactResponse, status_code=201)
async def create_contact(
    contact_data: CreateContactRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Create a new contact"""
    
    contacts_service = ContactsService(tenant_id)
    contact = await contacts_service.create_contact(contact_data)
    
    return contact


@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get a specific contact"""
    
    contacts_service = ContactsService(tenant_id)
    contact = await contacts_service.get_contact(contact_id)
    
    if not contact:
        raise NotFoundError("Contact not found")
    
    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    contact_data: UpdateContactRequest,
    current_user: TokenData = Depends(require_write_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Update a contact"""
    
    contacts_service = ContactsService(tenant_id)
    contact = await contacts_service.update_contact(contact_id, contact_data)
    
    if not contact:
        raise NotFoundError("Contact not found")
    
    return contact


@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    contact_id: str,
    current_user: TokenData = Depends(require_delete_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Delete a contact"""
    
    contacts_service = ContactsService(tenant_id)
    await contacts_service.delete_contact(contact_id)


@router.get("/{contact_id}/matching-properties", response_model=List[PropertyResponse])
async def get_contact_matching_properties(
    contact_id: str,
    limit: int = Query(10, ge=1, le=50, description="Maximum number of matching properties"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get matching properties for a contact based on their budget and preferences"""
    
    contacts_service = ContactsService(tenant_id)
    
    # Get the contact first
    contact = await contacts_service.get_contact(contact_id)
    if not contact:
        raise NotFoundError("Contact not found")
    
    # Get matching properties
    matching_properties = await contacts_service.get_matching_properties(contact_id, limit)
    
    return matching_properties
