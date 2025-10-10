"""
Contacts Service
"""
from typing import Optional, List, Tuple
from django.db import models
from django.db.models import Q

from app.db.models import Contact
from app.schemas.contacts import (
    ContactResponse, CreateContactRequest, UpdateContactRequest
)
from app.core.errors import NotFoundError
from app.services.audit import AuditService


class ContactsService:
    """Contacts service for business logic"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_contacts(
        self,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        status: Optional[str] = None,
        company: Optional[str] = None,
        min_budget: Optional[float] = None,
        max_budget: Optional[float] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ) -> Tuple[List[ContactResponse], int]:
        """Get contacts with filters and pagination"""
        
        queryset = Contact.objects.filter(tenant_id=self.tenant_id)
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(company__icontains=search)
            )
        
        if status:
            queryset = queryset.filter(status=status)
        
        if company:
            queryset = queryset.filter(company__icontains=company)
        
        if min_budget:
            queryset = queryset.filter(budget_min__gte=min_budget)
        
        if max_budget:
            queryset = queryset.filter(budget_max__lte=max_budget)
        
        # Apply sorting
        if sort_by:
            if sort_order == "desc":
                sort_by = f"-{sort_by}"
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by("-created_at")
        
        total = queryset.count()
        contacts = list(queryset[offset:offset + limit])
        
        return [self._build_contact_response(contact) for contact in contacts], total
    
    async def get_contact(self, contact_id: str) -> Optional[ContactResponse]:
        """Get a specific contact"""
        
        try:
            contact = Contact.objects.get(id=contact_id, tenant_id=self.tenant_id)
            return self._build_contact_response(contact)
        except Contact.DoesNotExist:
            return None
    
    async def create_contact(self, contact_data: CreateContactRequest) -> ContactResponse:
        """Create a new contact"""
        
        contact = Contact.objects.create(
            tenant_id=self.tenant_id,
            name=contact_data.name,
            email=contact_data.email,
            phone=contact_data.phone,
            company=contact_data.company,
            budget_min=contact_data.budget_min,
            budget_max=contact_data.budget_max,
            budget_currency=contact_data.budget_currency,
            preferences=contact_data.preferences
        )
        
        return self._build_contact_response(contact)
    
    async def update_contact(
        self, 
        contact_id: str, 
        contact_data: UpdateContactRequest
    ) -> Optional[ContactResponse]:
        """Update a contact"""
        
        try:
            contact = Contact.objects.get(id=contact_id, tenant_id=self.tenant_id)
        except Contact.DoesNotExist:
            return None
        
        # Update fields
        update_data = contact_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)
        
        contact.save()
        
        return self._build_contact_response(contact)
    
    async def delete_contact(self, contact_id: str) -> None:
        """Delete a contact"""
        
        try:
            contact = Contact.objects.get(id=contact_id, tenant_id=self.tenant_id)
        except Contact.DoesNotExist:
            raise NotFoundError("Contact not found")
        
        contact.delete()
    
    def _build_contact_response(self, contact: Contact) -> ContactResponse:
        """Build ContactResponse from Contact model"""
        
        return ContactResponse(
            id=str(contact.id),
            name=contact.name,
            email=contact.email,
            phone=contact.phone,
            company=contact.company,
            status=contact.status,
            budget_min=float(contact.budget_min) if contact.budget_min else None,
            budget_max=float(contact.budget_max) if contact.budget_max else None,
            budget_currency=contact.budget_currency,
            preferences=contact.preferences,
            lead_score=contact.lead_score,
            created_at=contact.created_at,
            updated_at=contact.updated_at
        )
