"""
Contacts Service
"""
from typing import Optional, List, Tuple
from django.db import models
from django.db.models import Q
from asgiref.sync import sync_to_async

from app.db.models import Contact, Property
from app.schemas.contacts import (
    ContactResponse, CreateContactRequest, UpdateContactRequest
)
from app.schemas.properties import PropertyResponse
from app.core.errors import NotFoundError
from app.services.audit import AuditService
from app.services.llm_service import LLMService


class ContactsService:
    """Contacts service for business logic"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.llm_service = LLMService(tenant_id)
    
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
                last_contact=contact_data.last_contact
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
        """Get matching properties for a contact based on budget and preferences"""
        
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
                return contact, []
            
            budget_min = float(contact.budget_min) if contact.budget_min else 0
            
            # Add 10% tolerance to upper limit
            budget_upper_limit = budget * 1.1
            
            # Extract preferences from JSON
            preferences = contact.preferences or {}
            desired_property_type = preferences.get('property_type')
            desired_location = preferences.get('location') or contact.location
            min_rooms = preferences.get('min_rooms')
            max_rooms = preferences.get('max_rooms')
            min_size = preferences.get('min_size')
            max_size = preferences.get('max_size')
            
            # Build base queryset
            queryset = Property.objects.filter(
                tenant_id=self.tenant_id,
                price__isnull=False,
            ).exclude(
                status__in=['verkauft', 'zurückgezogen']
            )
            
            # Apply budget filter
            queryset = queryset.filter(
                price__gte=budget_min,
                price__lte=budget_upper_limit
            )
            
            # Apply preference filters
            if desired_property_type:
                queryset = queryset.filter(property_type=desired_property_type)
            
            if desired_location:
                queryset = queryset.filter(
                    models.Q(location__icontains=desired_location) |
                    models.Q(address__city__icontains=desired_location)
                )
            
            if min_rooms:
                queryset = queryset.filter(rooms__gte=min_rooms)
            if max_rooms:
                queryset = queryset.filter(rooms__lte=max_rooms)
            if min_size:
                queryset = queryset.filter(living_area__gte=min_size)
            if max_size:
                queryset = queryset.filter(living_area__lte=max_size)
            
            properties = list(queryset.select_related('address'))
            
            # Calculate match scores
            scored_properties = []
            for prop in properties:
                score = self._calculate_property_match_score(contact, prop)
                scored_properties.append((score, prop))
            
            # Sort by score descending
            scored_properties.sort(key=lambda x: x[0], reverse=True)
            
            # Return top matches with scores
            return contact, [(prop, score) for score, prop in scored_properties[:limit]]
        
        contact, properties_with_scores = await get_matching_sync()
        
        # Build responses with match scores
        responses = []
        for prop, score in properties_with_scores:
            response = self._build_property_response(prop)
            response.match_score = round(score, 1)
            response.match_reason = self._generate_match_reason(score, contact, prop)
            responses.append(response)
        
        # Use LLM for enhanced insights on top match (if available)
        if responses and len(responses) > 0:
            try:
                top_match = responses[0]
                contact_dict = {
                    'name': contact.name,
                    'budget_min': float(contact.budget_min) if contact.budget_min else 0,
                    'budget': float(contact.budget) if contact.budget else (float(contact.budget_max) if contact.budget_max else 0),
                    'preferences': contact.preferences or {},
                    'lead_score': contact.lead_score,
                    'priority': contact.priority,
                    'status': contact.status
                }
                
                # Get property from first element
                top_prop = properties_with_scores[0][0]
                property_dict = {
                    'title': top_prop.title,
                    'property_type': top_prop.property_type,
                    'price': float(top_prop.price) if top_prop.price else 0,
                    'living_area': top_prop.living_area,
                    'rooms': top_prop.rooms,
                    'location': top_prop.location,
                    'status': top_prop.status
                }
                
                llm_analysis = await self.llm_service.analyze_property_contact_match(
                    property_dict,
                    contact_dict,
                    top_match.match_score
                )
                
                # Enhance top match with LLM insights
                top_match.match_reason = f"{llm_analysis.get('summary', top_match.match_reason)} (KI-Analyse)"
                
            except Exception as e:
                # LLM analysis is optional - continue without it
                pass
        
        return responses
    
    def _generate_match_reason(self, score: float, contact: Contact, property_obj: Property) -> str:
        """Generate human-readable match reason"""
        reasons = []
        
        # Budget match
        budget = float(contact.budget) if contact.budget else (float(contact.budget_max) if contact.budget_max else 0)
        if budget > 0 and property_obj.price:
            price = float(property_obj.price)
            diff_pct = abs(price - budget) / budget * 100
            if diff_pct <= 5:
                reasons.append("Perfekter Budget-Fit")
            elif diff_pct <= 10:
                reasons.append("Guter Budget-Fit")
            elif diff_pct <= 20:
                reasons.append("Budget passt")
        
        # Preferences match
        preferences = contact.preferences or {}
        if preferences.get('property_type') == property_obj.property_type:
            type_labels = {'apartment': 'Wohnung', 'house': 'Haus', 'commercial': 'Gewerbe'}
            reasons.append(f"Gewünschter Typ: {type_labels.get(property_obj.property_type, property_obj.property_type)}")
        
        if contact.location or preferences.get('location'):
            reasons.append("Bevorzugte Lage")
        
        if contact.lead_score >= 70:
            reasons.append("Qualifizierter Lead")
        
        if contact.priority in ['high', 'urgent']:
            reasons.append("Hohe Priorität")
        
        return " • ".join(reasons) if reasons else f"{int(score)}% Match"
    
    def _calculate_property_match_score(self, contact: Contact, property_obj: Property) -> float:
        """Calculate match score between contact and property (0-100)"""
        score = 0.0
        
        # Budget fit (30 points max)
        budget = float(contact.budget) if contact.budget else (float(contact.budget_max) if contact.budget_max else 0)
        if budget > 0 and property_obj.price:
            price = float(property_obj.price)
            budget_diff_pct = abs(price - budget) / budget
            if budget_diff_pct <= 0.05:  # Within 5%
                score += 30
            elif budget_diff_pct <= 0.10:  # Within 10%
                score += 25
            elif budget_diff_pct <= 0.15:  # Within 15%
                score += 20
            elif budget_diff_pct <= 0.20:  # Within 20%
                score += 10
        
        # Preferences match (40 points max)
        preferences = contact.preferences or {}
        
        # Property type match (15 points)
        if preferences.get('property_type') == property_obj.property_type:
            score += 15
        
        # Location match (10 points)
        desired_location = preferences.get('location') or contact.location
        if desired_location:
            if desired_location.lower() in (property_obj.location or '').lower():
                score += 10
            elif hasattr(property_obj, 'address') and property_obj.address:
                if desired_location.lower() in (property_obj.address.city or '').lower():
                    score += 8
        
        # Room count match (8 points)
        min_rooms = preferences.get('min_rooms')
        max_rooms = preferences.get('max_rooms')
        if property_obj.rooms:
            if min_rooms and max_rooms:
                if min_rooms <= property_obj.rooms <= max_rooms:
                    score += 8
                elif abs(property_obj.rooms - min_rooms) <= 1 or abs(property_obj.rooms - max_rooms) <= 1:
                    score += 4
            elif min_rooms and property_obj.rooms >= min_rooms:
                score += 6
            elif max_rooms and property_obj.rooms <= max_rooms:
                score += 6
        
        # Size match (7 points)
        min_size = preferences.get('min_size')
        max_size = preferences.get('max_size')
        if property_obj.living_area:
            if min_size and max_size:
                if min_size <= property_obj.living_area <= max_size:
                    score += 7
                elif abs(property_obj.living_area - min_size) <= 10 or abs(property_obj.living_area - max_size) <= 10:
                    score += 4
            elif min_size and property_obj.living_area >= min_size:
                score += 5
            elif max_size and property_obj.living_area <= max_size:
                score += 5
        
        # Lead score bonus (20 points max)
        if contact.lead_score:
            score += min(20, contact.lead_score / 5)
        
        # Priority bonus (10 points max)
        priority_scores = {'urgent': 10, 'high': 7, 'medium': 4, 'low': 2}
        score += priority_scores.get(contact.priority, 0)
        
        return min(100.0, score)

    async def get_matching_contacts_for_property(
        self,
        property_id: str,
        limit: int = 10,
    ) -> List[ContactResponse]:
        """Finde Kontakte, deren Budget und Präferenzen zur Immobilie passen."""

        @sync_to_async
        def get_matching_sync():
            try:
                prop = Property.objects.get(id=property_id, tenant_id=self.tenant_id)
            except Property.DoesNotExist:
                raise NotFoundError("Property not found")

            price = float(prop.price) if prop.price else None
            if price is None:
                return prop, []

            lower = price * 0.8  # 20% Toleranz nach unten
            upper = price * 1.2  # 20% Toleranz nach oben

            # Build base queryset
            qs = Contact.objects.filter(tenant_id=self.tenant_id)
            
            # Budget filter
            qs = qs.filter(
                models.Q(budget__gte=lower, budget__lte=upper)
                | (
                    models.Q(budget__isnull=True)
                    & models.Q(budget_max__gte=lower)
                    & models.Q(budget_min__lte=upper)
                )
            )
            
            # Get all matching contacts
            contacts = list(qs.select_related())
            
            # Calculate match scores
            scored_contacts = []
            for contact in contacts:
                score = self._calculate_contact_match_score(contact, prop)
                scored_contacts.append((score, contact))
            
            # Sort by score descending
            scored_contacts.sort(key=lambda x: x[0], reverse=True)
            
            # Return top matches
            return prop, [(contact, score) for score, contact in scored_contacts[:limit]]

        prop, contacts_with_scores = await get_matching_sync()
        
        # Build responses with match scores
        responses = []
        for contact, score in contacts_with_scores:
            response = self._build_contact_response(contact)
            response.match_score = round(score, 1)
            response.match_reason = self._generate_match_reason(score, contact, prop)
            responses.append(response)
        
        return responses
    
    def _calculate_contact_match_score(self, contact: Contact, property_obj: Property) -> float:
        """Calculate match score between contact and property (0-100)"""
        score = 0.0
        
        # Budget fit (30 points max)
        budget = float(contact.budget) if contact.budget else (float(contact.budget_max) if contact.budget_max else 0)
        if budget > 0 and property_obj.price:
            price = float(property_obj.price)
            budget_diff_pct = abs(price - budget) / budget
            if budget_diff_pct <= 0.05:  # Within 5%
                score += 30
            elif budget_diff_pct <= 0.10:  # Within 10%
                score += 25
            elif budget_diff_pct <= 0.15:  # Within 15%
                score += 20
            elif budget_diff_pct <= 0.20:  # Within 20%
                score += 10
        
        # Preferences match (40 points max)
        preferences = contact.preferences or {}
        
        # Property type match (15 points)
        if preferences.get('property_type') == property_obj.property_type:
            score += 15
        elif not preferences.get('property_type'):
            # No preference = slight bonus
            score += 5
        
        # Location match (10 points)
        desired_location = preferences.get('location') or contact.location
        if desired_location:
            if desired_location.lower() in (property_obj.location or '').lower():
                score += 10
            elif hasattr(property_obj, 'address') and property_obj.address:
                if desired_location.lower() in (property_obj.address.city or '').lower():
                    score += 8
        
        # Room count match (8 points)
        min_rooms = preferences.get('min_rooms')
        max_rooms = preferences.get('max_rooms')
        if property_obj.rooms:
            if min_rooms and max_rooms:
                if min_rooms <= property_obj.rooms <= max_rooms:
                    score += 8
            elif min_rooms:
                if property_obj.rooms >= min_rooms:
                    score += 6
            elif max_rooms:
                if property_obj.rooms <= max_rooms:
                    score += 6
        
        # Size match (7 points)
        min_size = preferences.get('min_size')
        max_size = preferences.get('max_size')
        if property_obj.living_area:
            if min_size and max_size:
                if min_size <= property_obj.living_area <= max_size:
                    score += 7
            elif min_size:
                if property_obj.living_area >= min_size:
                    score += 5
            elif max_size:
                if property_obj.living_area <= max_size:
                    score += 5
        
        # Lead score bonus (20 points max)
        if contact.lead_score:
            score += min(20, contact.lead_score / 5)
        
        # Priority bonus (10 points max)
        priority_scores = {'urgent': 10, 'high': 7, 'medium': 4, 'low': 2}
        score += priority_scores.get(contact.priority, 0)
        
        return min(100.0, score)
    
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
            preferences=contact.preferences,
            lead_score=contact.lead_score,
            last_contact=contact.last_contact,
            created_at=contact.created_at,
            updated_at=contact.updated_at
        )
