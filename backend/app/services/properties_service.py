"""
Properties Service
"""
from typing import Optional, List, Tuple
from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q

from app.db.models import Property, Address, ContactPerson, PropertyFeatures, PropertyImage
from app.schemas.properties import (
    PropertyResponse, CreatePropertyRequest, UpdatePropertyRequest,
    Address as AddressSchema, ContactPerson as ContactPersonSchema,
    PropertyFeatures as PropertyFeaturesSchema, PropertyImage as PropertyImageSchema
)
from app.core.errors import NotFoundError
from app.services.audit import AuditService


class PropertiesService:
    """Properties service for business logic"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_properties(
        self,
        offset: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        property_type: Optional[str] = None,
        status: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        city: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ) -> Tuple[List[PropertyResponse], int]:
        """Get properties with filters and pagination"""
        
        queryset = Property.objects.filter(tenant_id=self.tenant_id)
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )
        
        if property_type:
            queryset = queryset.filter(property_type=property_type)
        
        if status:
            queryset = queryset.filter(status=status)
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        if city:
            queryset = queryset.filter(location__icontains=city)
        
        # Apply sorting
        if sort_by:
            if sort_order == "desc":
                sort_by = f"-{sort_by}"
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by("-created_at")
        
        total = queryset.count()
        properties = list(queryset[offset:offset + limit])
        
        return [await self._build_property_response(prop) for prop in properties], total
    
    async def get_property(self, property_id: str) -> Optional[PropertyResponse]:
        """Get a specific property"""
        
        try:
            property_obj = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
            return await self._build_property_response(property_obj)
        except Property.DoesNotExist:
            return None
    
    async def create_property(
        self, 
        property_data: CreatePropertyRequest, 
        created_by_id: str
    ) -> PropertyResponse:
        """Create a new property"""
        
        user = User.objects.get(id=created_by_id)
        
        property_obj = Property.objects.create(
            tenant_id=self.tenant_id,
            title=property_data.title,
            description=property_data.description or '',
            property_type=property_data.property_type,
            price=property_data.price,
            location=property_data.location,
            living_area=property_data.living_area,
            rooms=property_data.rooms,
            bathrooms=property_data.bathrooms,
            year_built=property_data.year_built,
            created_by=user
        )
        
        # Create address if provided
        if property_data.address:
            Address.objects.create(
                property=property_obj,
                street=property_data.address.street,
                city=property_data.address.city,
                zip_code=property_data.address.zip_code,
                state=property_data.address.state,
                country=property_data.address.country
            )
        
        # Create contact person if provided
        if property_data.contact_person:
            ContactPerson.objects.create(
                property=property_obj,
                name=property_data.contact_person.name,
                email=property_data.contact_person.email,
                phone=property_data.contact_person.phone,
                role=property_data.contact_person.role
            )
        
        # Create features if provided
        if property_data.features:
            PropertyFeatures.objects.create(
                property=property_obj,
                bedrooms=property_data.features.bedrooms,
                bathrooms=property_data.features.bathrooms,
                year_built=property_data.features.year_built,
                energy_class=property_data.features.energy_class,
                heating_type=property_data.features.heating_type,
                parking_spaces=property_data.features.parking_spaces,
                balcony=property_data.features.balcony,
                garden=property_data.features.garden,
                elevator=property_data.features.elevator
            )
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="create",
            resource_type="property",
            resource_id=str(property_obj.id),
            new_values={"title": property_obj.title, "property_type": property_obj.property_type}
        )
        
        return await self._build_property_response(property_obj)
    
    async def update_property(
        self, 
        property_id: str, 
        property_data: UpdatePropertyRequest, 
        updated_by_id: str
    ) -> Optional[PropertyResponse]:
        """Update a property"""
        
        try:
            property_obj = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
        except Property.DoesNotExist:
            return None
        
        user = User.objects.get(id=updated_by_id)
        
        # Store old values for audit
        old_values = {
            "title": property_obj.title,
            "status": property_obj.status,
            "property_type": property_obj.property_type
        }
        
        # Update fields
        update_data = property_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field not in ['address', 'contact_person', 'features']:
                setattr(property_obj, field, value)
        
        property_obj.save()
        
        # Update address if provided
        if 'address' in update_data and update_data['address']:
            address_data = update_data['address']
            address, created = Address.objects.get_or_create(property=property_obj)
            address.street = address_data['street']
            address.city = address_data['city']
            address.zip_code = address_data['zip_code']
            address.state = address_data['state']
            address.country = address_data['country']
            address.save()
        
        # Update contact person if provided
        if 'contact_person' in update_data and update_data['contact_person']:
            contact_data = update_data['contact_person']
            contact_person, created = ContactPerson.objects.get_or_create(property=property_obj)
            contact_person.name = contact_data['name']
            contact_person.email = contact_data['email']
            contact_person.phone = contact_data['phone']
            contact_person.role = contact_data['role']
            contact_person.save()
        
        # Update features if provided
        if 'features' in update_data and update_data['features']:
            features_data = update_data['features']
            features, created = PropertyFeatures.objects.get_or_create(property=property_obj)
            for field, value in features_data.items():
                setattr(features, field, value)
            features.save()
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="update",
            resource_type="property",
            resource_id=property_id,
            old_values=old_values,
            new_values=update_data
        )
        
        return await self._build_property_response(property_obj)
    
    async def delete_property(self, property_id: str, deleted_by_id: str) -> None:
        """Delete a property"""
        
        try:
            property_obj = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
        except Property.DoesNotExist:
            raise NotFoundError("Property not found")
        
        user = User.objects.get(id=deleted_by_id)
        
        # Audit log
        AuditService.audit_action(
            user=user,
            action="delete",
            resource_type="property",
            resource_id=property_id,
            old_values={"title": property_obj.title, "property_type": property_obj.property_type}
        )
        
        property_obj.delete()
    
    async def _build_property_response(self, property_obj: Property) -> PropertyResponse:
        """Build PropertyResponse from Property model"""
        
        # Get address
        address = None
        try:
            addr = property_obj.address
            address = AddressSchema(
                street=addr.street,
                city=addr.city,
                zip_code=addr.zip_code,
                state=addr.state,
                country=addr.country
            )
        except Address.DoesNotExist:
            pass
        
        # Get contact person
        contact_person = None
        try:
            contact = property_obj.contact_persons.first()
            if contact:
                contact_person = ContactPersonSchema(
                    id=str(contact.id),
                    name=contact.name,
                    email=contact.email,
                    phone=contact.phone,
                    role=contact.role
                )
        except ContactPerson.DoesNotExist:
            pass
        
        # Get features
        features = None
        try:
            feat = property_obj.features
            features = PropertyFeaturesSchema(
                bedrooms=feat.bedrooms,
                bathrooms=feat.bathrooms,
                year_built=feat.year_built,
                energy_class=feat.energy_class,
                heating_type=feat.heating_type,
                parking_spaces=feat.parking_spaces,
                balcony=feat.balcony,
                garden=feat.garden,
                elevator=feat.elevator
            )
        except PropertyFeatures.DoesNotExist:
            pass
        
        # Get images
        images = []
        for img in property_obj.images.all():
            images.append(PropertyImageSchema(
                id=str(img.id),
                url=img.url,
                alt_text=img.alt_text,
                is_primary=img.is_primary,
                order=img.order
            ))
        
        return PropertyResponse(
            id=str(property_obj.id),
            title=property_obj.title,
            description=property_obj.description,
            status=property_obj.status,
            property_type=property_obj.property_type,
            price=float(property_obj.price) if property_obj.price else None,
            location=property_obj.location,
            living_area=property_obj.living_area,
            rooms=property_obj.rooms,
            bathrooms=property_obj.bathrooms,
            year_built=property_obj.year_built,
            address=address,
            contact_person=contact_person,
            features=features,
            images=images,
            created_at=property_obj.created_at,
            updated_at=property_obj.updated_at,
            created_by=str(property_obj.created_by.id)
        )
