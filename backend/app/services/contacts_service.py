"""
Contacts Service
"""
from typing import Optional, List, Tuple
from datetime import datetime
from django.db import models
from django.db.models import Q
from asgiref.sync import sync_to_async

from app.db.models import Contact, Property, Task, Appointment
from app.schemas.contacts import (
    ContactResponse, CreateContactRequest, UpdateContactRequest
)
from app.schemas.properties import PropertyResponse
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
        
        @sync_to_async
        def get_contacts_sync():
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
                    sort_by_field = f"-{sort_by}"
                else:
                    sort_by_field = sort_by
                queryset = queryset.order_by(sort_by_field)
            else:
                queryset = queryset.order_by("-created_at")
            
            total = queryset.count()
            contacts = list(queryset[offset:offset + limit])
            
            return contacts, total
        
        contacts, total = await get_contacts_sync()
        return [self._build_contact_response(contact) for contact in contacts], total
    
    async def get_contact(self, contact_id: str) -> Optional[ContactResponse]:
        """Get a specific contact"""
        
        @sync_to_async
        def get_contact_sync():
            try:
                return Contact.objects.get(id=contact_id, tenant_id=self.tenant_id)
            except Contact.DoesNotExist:
                return None
        
        contact = await get_contact_sync()
        if contact:
            return self._build_contact_response(contact)
        return None
    
    async def create_contact(self, contact_data: CreateContactRequest) -> ContactResponse:
        """Create a new contact"""
        
        @sync_to_async
        def create_contact_sync():
            return Contact.objects.create(
                tenant_id=self.tenant_id,
                name=contact_data.name,
                email=contact_data.email,
                phone=contact_data.phone,
                company=contact_data.company,
                category=contact_data.category,
                status=contact_data.status,
                priority=contact_data.priority,
                location=contact_data.location,
                avatar=contact_data.avatar,
                budget=contact_data.budget,
                budget_currency=contact_data.budget_currency,
                preferences=contact_data.preferences,
                additional_info=contact_data.additional_info,
                address=contact_data.address,
                notes=contact_data.notes,
                last_contact=contact_data.last_contact,
            )
        
        contact = await create_contact_sync()
        return self._build_contact_response(contact)
    
    async def update_contact(
        self, 
        contact_id: str, 
        contact_data: UpdateContactRequest
    ) -> Optional[ContactResponse]:
        """Update a contact"""
        
        @sync_to_async
        def update_contact_sync():
            try:
                contact = Contact.objects.get(id=contact_id, tenant_id=self.tenant_id)
            except Contact.DoesNotExist:
                return None
            
            # Update fields
            update_data = contact_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(contact, field, value)
            
            contact.save()
            
            return contact
        
        contact = await update_contact_sync()
        if contact:
            return self._build_contact_response(contact)
        return None
    
    async def delete_contact(self, contact_id: str) -> None:
        """Delete a contact"""
        
        @sync_to_async
        def delete_contact_sync():
            try:
                contact = Contact.objects.get(id=contact_id, tenant_id=self.tenant_id)
            except Contact.DoesNotExist:
                raise NotFoundError("Contact not found")
            
            contact.delete()
        
        await delete_contact_sync()
    
    async def get_matching_properties(
        self, 
        contact_id: str, 
        limit: int = 10
    ) -> List[PropertyResponse]:
        """Get matching properties for a contact based on budget"""
        
        @sync_to_async
        def get_matching_sync():
            try:
                contact = Contact.objects.get(id=contact_id, tenant_id=self.tenant_id)
            except Contact.DoesNotExist:
                raise NotFoundError("Contact not found")
            
            # Use main budget field, fallback to budget_max
            budget = float(contact.budget) if contact.budget else None
            if budget is None and contact.budget_max:
                budget = float(contact.budget_max)
            
            # If no budget, return empty list
            if not budget:
                return []
            
            budget_min = float(contact.budget_min) if contact.budget_min else 0
            
            # Add 10% tolerance to upper limit
            budget_upper_limit = budget * 1.1
            
            # Find matching properties
            queryset = Property.objects.filter(
                tenant_id=self.tenant_id,
                status='active',
                price__gte=budget_min,
                price__lte=budget_upper_limit
            ).order_by('-created_at')[:limit]
            
            return list(queryset)
        
        properties = await get_matching_sync()
        return [self._build_property_response(prop) for prop in properties]
    
    def _build_property_response(self, property_obj: Property) -> PropertyResponse:
        """Build PropertyResponse from Property model"""
        
        return PropertyResponse(
            id=str(property_obj.id),
            title=property_obj.title,
            description=property_obj.description,
            property_type=property_obj.property_type,
            status=property_obj.status,
            price=float(property_obj.price) if property_obj.price else None,
            location=property_obj.location,
            address=property_obj.address,
            area=float(property_obj.area) if property_obj.area else None,
            rooms=property_obj.rooms,
            bedrooms=property_obj.bedrooms,
            bathrooms=property_obj.bathrooms,
            year_built=property_obj.year_built,
            features=property_obj.features or [],
            images=property_obj.images or [],
            main_image=property_obj.main_image,
            created_at=property_obj.created_at,
            updated_at=property_obj.updated_at
        )
    
    def _build_contact_response(self, contact: Contact) -> ContactResponse:
        """Build ContactResponse from Contact model"""
        
        # Migration logic: use budget_max as budget if budget is not set
        budget = float(contact.budget) if contact.budget else None
        if budget is None and contact.budget_max:
            budget = float(contact.budget_max)
        
        return ContactResponse(
            id=str(contact.id),
            name=contact.name,
            email=contact.email,
            phone=contact.phone,
            company=contact.company,
            category=contact.category,
            status=contact.status,
            priority=contact.priority,
            location=contact.location,
            avatar=contact.avatar,
            budget=budget,
            budget_currency=contact.budget_currency,
            budget_min=float(contact.budget_min) if contact.budget_min else None,
            budget_max=float(contact.budget_max) if contact.budget_max else None,
            preferences=contact.preferences or {},
            additional_info=contact.additional_info or {},
            address=contact.address or {},
            notes=contact.notes,
            lead_score=contact.lead_score,
            last_contact=contact.last_contact,
            created_at=contact.created_at,
            updated_at=contact.updated_at,
        )

    async def get_contact_activities(
        self, contact_id: str, limit: int = 100
    ) -> List[dict]:
        """
        Return recent activities for a contact (appointments + tasks tagged with contact).
        Structure matches lead scoring expectations: type, status, timestamps.
        """

        @sync_to_async
        def fetch():
            activities: List[dict] = []

            appointments = (
                Appointment.objects.filter(
                    tenant_id=self.tenant_id, contact_id=contact_id
                )
                .order_by("-start_datetime")[:limit]
            )
            for appt in appointments:
                activities.append(
                    {
                        "id": str(appt.id),
                        "type": appt.type,
                        "status": appt.status,
                        "title": appt.title,
                        "description": appt.description,
                        "created_at": appt.created_at,
                        "scheduled_at": appt.start_datetime,
                        "completed_at": appt.end_datetime
                        if appt.status in ["completed", "cancelled"]
                        else None,
                    }
                )

            tasks = (
                Task.objects.filter(
                    tenant_id=self.tenant_id, tags__contains=[f"contact:{contact_id}"]
                )
                .order_by("-created_at")[:limit]
            )
            for task in tasks:
                activities.append(
                    {
                        "id": str(task.id),
                        "type": "task",
                        "status": task.status,
                        "title": task.title,
                        "description": task.description,
                        "created_at": task.created_at,
                        "scheduled_at": task.due_date,
                        "completed_at": task.updated_at
                        if task.status in ["done", "completed"]
                        else None,
                    }
                )

            return activities

        activities = await fetch()
        activities = sorted(
            activities,
            key=lambda a: (
                a.get("created_at")
                or a.get("scheduled_at")
                or datetime.utcnow()
            ),
            reverse=True,
        )
        return activities[:limit]
