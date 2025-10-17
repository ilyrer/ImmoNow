"""
Properties Service
"""
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime, timedelta
from django.db import models
from django.db.models import Q, Count, Avg
from django.core.files.uploadedfile import UploadedFile
from asgiref.sync import sync_to_async
import os

from app.db.models import Property, Address, ContactPerson, PropertyFeatures, PropertyImage, PropertyDocument, User
from app.schemas.properties import (
    PropertyResponse, CreatePropertyRequest, UpdatePropertyRequest,
    Address as AddressSchema, ContactPerson as ContactPersonSchema,
    ContactPersonCreate,
    PropertyFeatures as PropertyFeaturesSchema, PropertyImage as PropertyImageSchema,
    PropertyDocument as PropertyDocumentSchema
)
from app.core.errors import NotFoundError
from app.services.audit import AuditService
from app.core.billing_guard import BillingGuard


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
        rooms_min: Optional[int] = None,
        rooms_max: Optional[int] = None,
        bedrooms_min: Optional[int] = None,
        bedrooms_max: Optional[int] = None,
        bathrooms_min: Optional[int] = None,
        bathrooms_max: Optional[int] = None,
        living_area_min: Optional[int] = None,
        living_area_max: Optional[int] = None,
        plot_area_min: Optional[int] = None,
        plot_area_max: Optional[int] = None,
        year_built_min: Optional[int] = None,
        year_built_max: Optional[int] = None,
        energy_class: Optional[str] = None,
        heating_type: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ) -> Tuple[List[PropertyResponse], int]:
        """Get properties with filters and pagination"""
        
        @sync_to_async
        def get_properties_sync():
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
            
            # Room filters
            if rooms_min:
                queryset = queryset.filter(rooms__gte=rooms_min)
            
            if rooms_max:
                queryset = queryset.filter(rooms__lte=rooms_max)
            
            if bedrooms_min:
                queryset = queryset.filter(bedrooms__gte=bedrooms_min)
            
            if bedrooms_max:
                queryset = queryset.filter(bedrooms__lte=bedrooms_max)
            
            if bathrooms_min:
                queryset = queryset.filter(bathrooms__gte=bathrooms_min)
            
            if bathrooms_max:
                queryset = queryset.filter(bathrooms__lte=bathrooms_max)
            
            # Area filters
            if living_area_min:
                queryset = queryset.filter(living_area__gte=living_area_min)
            
            if living_area_max:
                queryset = queryset.filter(living_area__lte=living_area_max)
            
            if plot_area_min:
                queryset = queryset.filter(plot_area__gte=plot_area_min)
            
            if plot_area_max:
                queryset = queryset.filter(plot_area__lte=plot_area_max)
            
            # Building info filters
            if year_built_min:
                queryset = queryset.filter(year_built__gte=year_built_min)
            
            if year_built_max:
                queryset = queryset.filter(year_built__lte=year_built_max)
            
            if energy_class:
                queryset = queryset.filter(energy_class__iexact=energy_class)
            
            if heating_type:
                queryset = queryset.filter(heating_type__icontains=heating_type)
            
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
            properties = list(queryset[offset:offset + limit])
            
            return properties, total
        
        properties, total = await get_properties_sync()
        return [await self._build_property_response(prop) for prop in properties], total
    
    async def get_property(self, property_id: str) -> Optional[PropertyResponse]:
        """Get a specific property"""
        
        @sync_to_async
        def get_property_sync():
            try:
                return Property.objects.get(id=property_id, tenant_id=self.tenant_id)
            except Property.DoesNotExist:
                return None
        
        property_obj = await get_property_sync()
        if property_obj:
            return await self._build_property_response(property_obj)
        return None
    
    async def create_property(
        self, 
        property_data: CreatePropertyRequest, 
        created_by_id: str
    ) -> PropertyResponse:
        """Create a new property"""
        
        # Billing Guard: Prüfe Property-Limit ZUERST
        await BillingGuard.check_limit(self.tenant_id, 'properties', 'create')
        
        @sync_to_async
        def create_property_sync():
            user = User.objects.get(id=created_by_id)
            
            property_obj = Property.objects.create(
                tenant_id=self.tenant_id,
                title=property_data.title,
                description=property_data.description or '',
                property_type=property_data.property_type,
                status=property_data.status or 'vorbereitung',
                # Price fields
                price=property_data.price,
                price_currency=property_data.price_currency or 'EUR',
                price_type=property_data.price_type or 'sale',
                location=property_data.location,
                # Area fields
                living_area=property_data.living_area,
                total_area=property_data.total_area,
                plot_area=property_data.plot_area,
                # Room fields
                rooms=property_data.rooms,
                bedrooms=property_data.bedrooms,
                bathrooms=property_data.bathrooms,
                floors=property_data.floors,
                # Building info
                year_built=property_data.year_built,
                energy_class=property_data.energy_class,
                energy_consumption=property_data.energy_consumption,
                heating_type=property_data.heating_type,
                # Location coordinates
                coordinates_lat=property_data.coordinates_lat,
                coordinates_lng=property_data.coordinates_lng,
                # Additional data
                amenities=property_data.amenities or [],
                tags=property_data.tags or [],
                created_by=user
            )
            
            # Create address if provided
            if property_data.address:
                addr = property_data.address
                # Handle both postal_code and zip_code
                zip_code = addr.postal_code or addr.zip_code or ''
                Address.objects.create(
                    property=property_obj,
                    street=addr.street,
                    house_number=addr.house_number or '',
                    city=addr.city,
                    zip_code=zip_code,
                    postal_code=zip_code,
                    state=addr.state or '',
                    country=addr.country or 'Deutschland'
                )
            
            # Create contact person if provided
            if property_data.contact_person:
                cp = property_data.contact_person
                ContactPerson.objects.create(
                    property=property_obj,
                    name=cp.name,  # Already built by validator from first_name + last_name
                    email=cp.email,
                    phone=cp.phone,
                    role=cp.role
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
            
            return property_obj
        
        property_obj = await create_property_sync()
        return await self._build_property_response(property_obj)
    
    async def update_property(
        self, 
        property_id: str, 
        property_data: UpdatePropertyRequest, 
        updated_by_id: str
    ) -> Optional[PropertyResponse]:
        """Update a property"""
        
        @sync_to_async
        def update_property_sync():
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
                address.street = address_data.get('street', address.street)
                address.city = address_data.get('city', address.city)
                address.zip_code = address_data.get('zip_code', address.zip_code)
                address.postal_code = address_data.get('postal_code', address_data.get('zip_code', address.postal_code))
                address.state = address_data.get('state', address.state)
                address.country = address_data.get('country', address.country)
                address.save()
            
            # Update contact person if provided
            if 'contact_person' in update_data and update_data['contact_person']:
                contact_data = update_data['contact_person']
                contact_person, created = ContactPerson.objects.get_or_create(property=property_obj)
                contact_person.name = contact_data.get('name', contact_person.name)
                contact_person.email = contact_data.get('email', contact_person.email)
                contact_person.phone = contact_data.get('phone', contact_person.phone)
                contact_person.role = contact_data.get('role', contact_person.role)
                contact_person.save()
            
            # Update features if provided - either from explicit features object OR from flat fields
            features, created = PropertyFeatures.objects.get_or_create(property=property_obj)
            
            # Update from explicit features object if provided
            if 'features' in update_data and update_data['features']:
                features_data = update_data['features']
                for field, value in features_data.items():
                    setattr(features, field, value)
            
            # Sync from flat fields to features (for backward compatibility)
            if 'bedrooms' in update_data:
                features.bedrooms = update_data['bedrooms']
            if 'bathrooms' in update_data:
                features.bathrooms = update_data['bathrooms']
            if 'year_built' in update_data:
                features.year_built = update_data['year_built']
            if 'energy_class' in update_data:
                features.energy_class = update_data['energy_class']
            if 'heating_type' in update_data:
                features.heating_type = update_data['heating_type']
            
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
            
            return property_obj
        
        property_obj = await update_property_sync()
        if property_obj:
            return await self._build_property_response(property_obj)
        return None
    
    async def delete_property(self, property_id: str, deleted_by_id: str) -> None:
        """Delete a property"""
        
        @sync_to_async
        def delete_property_sync():
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
        
        await delete_property_sync()
    
    async def _build_property_response(self, property_obj: Property) -> PropertyResponse:
        """Build PropertyResponse from Property model"""
        
        @sync_to_async
        def build_response_sync():
            # Get address
            address = None
            try:
                addr = property_obj.address
                address = AddressSchema(
                    street=addr.street,
                    house_number=addr.house_number,
                    city=addr.city,
                    zip_code=addr.zip_code,
                    postal_code=addr.postal_code or addr.zip_code,
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
                # Price fields
                price=float(property_obj.price) if property_obj.price else None,
                price_currency=property_obj.price_currency,
                price_type=property_obj.price_type,
                location=property_obj.location,
                # Area fields
                living_area=property_obj.living_area,
                total_area=property_obj.total_area,
                plot_area=property_obj.plot_area,
                # Room fields
                rooms=property_obj.rooms,
                bedrooms=property_obj.bedrooms,
                bathrooms=property_obj.bathrooms,
                floors=property_obj.floors,
                # Building info
                year_built=property_obj.year_built,
                energy_class=property_obj.energy_class,
                energy_consumption=property_obj.energy_consumption,
                heating_type=property_obj.heating_type,
                # Location coordinates
                coordinates_lat=float(property_obj.coordinates_lat) if property_obj.coordinates_lat else None,
                coordinates_lng=float(property_obj.coordinates_lng) if property_obj.coordinates_lng else None,
                # Additional data
                amenities=property_obj.amenities or [],
                tags=property_obj.tags or [],
                address=address,
                contact_person=contact_person,
                features=features,
                images=images,
                created_at=property_obj.created_at,
                updated_at=property_obj.updated_at,
                created_by=str(property_obj.created_by.id)
            )
        
        return await build_response_sync()
    
    async def get_property_metrics(self, property_id: str) -> Dict[str, Any]:
        """Get property performance metrics"""
        
        @sync_to_async
        def get_metrics_sync():
            try:
                property_obj = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
            except Property.DoesNotExist:
                raise NotFoundError("Property not found")
            
            # Calculate days on market
            days_on_market = (datetime.now().date() - property_obj.created_at.date()).days
            
            # TODO: Replace with real analytics data when available
            # For now, return calculated/estimated metrics
            
            # Generate chart data for last 30 days
            chart_data = []
            for i in range(30):
                date = datetime.now().date() - timedelta(days=29-i)
                # Simple simulation: views increase over time
                views = max(0, i * 2 + (i % 7))
                inquiries = max(0, i // 3 + (i % 5))
                visits = max(0, i // 5)
                
                chart_data.append({
                    "date": date.isoformat(),
                    "views": views,
                    "inquiries": inquiries,
                    "visits": visits,
                    "favorites": max(0, i // 7)
                })
            
            # Calculate totals
            total_views = sum(d["views"] for d in chart_data)
            total_inquiries = sum(d["inquiries"] for d in chart_data)
            total_visits = sum(d["visits"] for d in chart_data)
            total_favorites = sum(d["favorites"] for d in chart_data)
            
            # Calculate conversion rate
            conversion_rate = (total_visits / total_views * 100) if total_views > 0 else 0
            
            # Average view duration (simulated)
            avg_view_duration = 125  # seconds
            
            return {
                "views": total_views,
                "inquiries": total_inquiries,
                "visits": total_visits,
                "favorites": total_favorites,
                "daysOnMarket": days_on_market,
                "averageViewDuration": avg_view_duration,
                "conversionRate": round(conversion_rate, 2),
                "chartData": chart_data
            }
        
        return await get_metrics_sync()
        
        return await get_metrics_sync()
    
    async def upload_images(
        self, 
        property_id: str, 
        files: List[UploadedFile],
        uploaded_by_id: str
    ) -> List[PropertyImageSchema]:
        """Upload property images"""
        
        @sync_to_async
        def upload_images_sync():
            try:
                property_obj = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
            except Property.DoesNotExist:
                raise NotFoundError("Property not found")
            
            user = User.objects.get(id=uploaded_by_id)
            
            # Get current max order
            max_order = property_obj.images.aggregate(models.Max('order'))['order__max'] or 0
            
            uploaded_images = []
            for idx, file in enumerate(files):
                # Save file
                image = PropertyImage.objects.create(
                    property=property_obj,
                    file=file,
                    alt_text=file.name,
                    order=max_order + idx + 1,
                    size=file.size,
                    mime_type=file.content_type or 'image/jpeg',
                    uploaded_by=user
                )
                
                # Generate URL from file path
                if image.file:
                    image.url = image.file.url
                    image.save()
                
                uploaded_images.append(PropertyImageSchema(
                    id=str(image.id),
                    url=image.url,
                    thumbnail_url=image.thumbnail_url,
                    alt_text=image.alt_text,
                    is_primary=image.is_primary,
                    order=image.order,
                    size=image.size,
                    mime_type=image.mime_type,
                    uploaded_at=image.uploaded_at,
                    uploaded_by=str(user.id) if user else None
                ))
            
            # Audit log
            AuditService.audit_action(
                user=user,
                action="upload_images",
                resource_type="property",
                resource_id=property_id,
                new_values={"count": len(files)}
            )
            
            return uploaded_images
        
        return await upload_images_sync()
    
    async def upload_documents(
        self, 
        property_id: str, 
        files: List[UploadedFile],
        uploaded_by_id: str
    ) -> List[PropertyDocumentSchema]:
        """Upload property documents"""
        
        @sync_to_async
        def upload_documents_sync():
            try:
                property_obj = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
            except Property.DoesNotExist:
                raise NotFoundError("Property not found")
            
            user = User.objects.get(id=uploaded_by_id)
            
            uploaded_documents = []
            for file in files:
                # Save file
                document = PropertyDocument.objects.create(
                    property=property_obj,
                    file=file,
                    name=file.name,
                    size=file.size,
                    mime_type=file.content_type or 'application/pdf',
                    uploaded_by=user
                )
                
                # Generate URL from file path
                if document.file:
                    document.url = document.file.url
                    document.save()
                
                uploaded_documents.append(PropertyDocumentSchema(
                    id=str(document.id),
                    url=document.url,
                    name=document.name,
                    document_type=document.document_type,
                    size=document.size,
                    mime_type=document.mime_type,
                    uploaded_at=document.uploaded_at,
                    uploaded_by=str(user.id) if user else None
                ))
            
            # Audit log
            AuditService.audit_action(
                user=user,
                action="upload_documents",
                resource_type="property",
                resource_id=property_id,
                new_values={"count": len(files)}
            )
            
            return uploaded_documents
        
        return await upload_documents_sync()
    
    async def set_primary_image(self, property_id: str, image_id: str) -> None:
        """Set an image as primary for the property"""
        
        @sync_to_async
        def set_primary_sync():
            try:
                property_obj = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
            except Property.DoesNotExist:
                raise NotFoundError("Property not found")
            
            try:
                image = PropertyImage.objects.get(id=image_id, property=property_obj)
            except PropertyImage.DoesNotExist:
                raise NotFoundError("Image not found")
            
            # Remove primary flag from all other images
            PropertyImage.objects.filter(property=property_obj).update(is_primary=False)
            
            # Set this image as primary
            image.is_primary = True
            image.save()
        
        await set_primary_sync()
    
    async def delete_image(self, property_id: str, image_id: str) -> None:
        """Delete a property image"""
        
        @sync_to_async
        def delete_image_sync():
            try:
                property_obj = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
            except Property.DoesNotExist:
                raise NotFoundError("Property not found")
            
            try:
                image = PropertyImage.objects.get(id=image_id, property=property_obj)
            except PropertyImage.DoesNotExist:
                raise NotFoundError("Image not found")
            
            # Delete file if exists
            if image.file:
                image.file.delete()
            
            image.delete()
        
        await delete_image_sync()
    
    async def delete_document(self, property_id: str, document_id: str) -> None:
        """Delete a property document"""
        
        @sync_to_async
        def delete_document_sync():
            try:
                property_obj = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
            except Property.DoesNotExist:
                raise NotFoundError("Property not found")
            
            try:
                document = PropertyDocument.objects.get(id=document_id, property=property_obj)
            except PropertyDocument.DoesNotExist:
                raise NotFoundError("Document not found")
            
            # Delete file if exists
            if document.file:
                document.file.delete()
            
            document.delete()
        
        await delete_document_sync()
