"""
CIM Service
"""
from typing import Optional, List
from datetime import datetime, timedelta
from django.db import models
from django.db.models import Q, Count
from asgiref.sync import sync_to_async

from app.db.models import Property, Contact, Tenant
from app.schemas.cim import (
    CIMOverviewResponse, RecentPropertySummary, RecentContactSummary,
    PerfectMatch, CIMSummary
)


class CIMService:
    """CIM service for central information model"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_overview(
        self,
        limit: int = 10,
        days_back: int = 30,
        property_status: Optional[str] = None,
        contact_status: Optional[str] = None
    ) -> CIMOverviewResponse:
        """Get CIM dashboard overview"""
        
        # Recent properties - wrap sync DB calls in sync_to_async
        properties_query = Property.objects.filter(tenant_id=self.tenant_id)
        if property_status:
            properties_query = properties_query.filter(status=property_status)
        
        # Fetch properties synchronously
        properties_list = await sync_to_async(list)(
            properties_query.order_by('-created_at')[:limit]
        )
        
        recent_properties = []
        for prop in properties_list:
            recent_property = RecentPropertySummary(
                id=str(prop.id),
                title=prop.title,
                address=prop.location,
                price=float(prop.price) if prop.price else None,
                price_formatted=f"€{prop.price:,.0f}" if prop.price else "N/A",
                status=prop.status,
                status_label=prop.status.title(),
                created_at=prop.created_at,
                last_contact=None,  # TODO: Implement last contact tracking
                lead_quality='medium',  # TODO: Implement lead quality calculation
                lead_quality_label='Medium',
                contact_count=0,  # TODO: Implement contact count
                match_score=None  # TODO: Implement match score
            )
            recent_properties.append(recent_property)
        
        # Recent contacts - wrap sync DB calls in sync_to_async
        contacts_query = Contact.objects.filter(tenant_id=self.tenant_id)
        if contact_status:
            contacts_query = contacts_query.filter(status=contact_status)
        
        # Fetch contacts synchronously
        contacts_list = await sync_to_async(list)(
            contacts_query.order_by('-created_at')[:limit]
        )
        
        recent_contacts = []
        for contact in contacts_list:
            # Use main budget field, fallback to budget_max for migration
            budget = float(contact.budget) if contact.budget else None
            if budget is None and contact.budget_max:
                budget = float(contact.budget_max)
            
            budget_min = float(contact.budget_min) if contact.budget_min else None
            budget_max = float(contact.budget_max) if contact.budget_max else None
            
            # Format budget string
            if budget:
                budget_formatted = f"bis zu €{budget:,.0f}"
            elif budget_min and budget_max:
                budget_formatted = f"€{budget_min:,.0f} - €{budget_max:,.0f}"
            elif budget_min:
                budget_formatted = f"€{budget_min:,.0f}+"
            elif budget_max:
                budget_formatted = f"bis zu €{budget_max:,.0f}"
            else:
                budget_formatted = "Kein Budget angegeben"
            
            # Find matching properties based on budget
            matching_properties = []
            matching_count = 0
            
            search_budget = budget if budget else budget_max
            if search_budget:
                # Find properties within budget range (with 10% flexibility)
                budget_upper_limit = search_budget * 1.1  # 10% tolerance
                budget_lower_limit = budget_min if budget_min else 0
                
                matching_props = await sync_to_async(list)(
                    Property.objects.filter(
                        tenant_id=self.tenant_id,
                        status='active',
                        price__gte=budget_lower_limit,
                        price__lte=budget_upper_limit
                    ).order_by('-created_at')[:5]
                )
                
                matching_properties = [str(prop.id) for prop in matching_props]
                matching_count = len(matching_properties)
            
            recent_contact = RecentContactSummary(
                id=str(contact.id),
                name=contact.name,
                email=contact.email,
                phone=contact.phone,
                status=contact.status,
                status_label=contact.status.title(),
                budget_min=budget_min,
                budget_max=budget_max,
                budget_currency=contact.budget_currency,
                budget_formatted=budget_formatted,
                created_at=contact.created_at,
                last_contact=contact.last_contact,
                last_action="Erstellt",
                lead_score=contact.lead_score,
                matching_properties=matching_properties,
                matching_count=matching_count
            )
            recent_contacts.append(recent_contact)
        
        # Perfect matches - find contacts with budget and matching properties
        perfect_matches = []
        
        # Get contacts with budget defined
        contacts_with_budget = await sync_to_async(list)(
            Contact.objects.filter(
                tenant_id=self.tenant_id
            ).exclude(
                budget__isnull=True, budget_max__isnull=True
            ).order_by('-lead_score')[:20]
        )
        
        for contact in contacts_with_budget:
            # Use main budget field, fallback to budget_max
            budget = float(contact.budget) if contact.budget else None
            if budget is None and contact.budget_max:
                budget = float(contact.budget_max)
                
            if not budget or budget <= 0:
                continue
            
            # Find matching properties
            budget_upper_limit = budget * 1.1
            budget_lower_limit = float(contact.budget_min) if contact.budget_min else 0
            
            matching_props = await sync_to_async(list)(
                Property.objects.filter(
                    tenant_id=self.tenant_id,
                    status='active',
                    price__gte=budget_lower_limit,
                    price__lte=budget_upper_limit
                ).order_by('-created_at')[:3]
            )
            
            # Create perfect match entries
            for prop in matching_props:
                # Calculate match score based on budget fit and lead score
                price_diff = abs(float(prop.price) - budget) if prop.price else budget
                price_fit = max(0, 100 - (price_diff / budget * 100))
                match_score = (price_fit * 0.7) + (contact.lead_score * 0.3)
                
                # Determine lead quality
                if contact.lead_score >= 70:
                    lead_quality = 'Hot'
                elif contact.lead_score >= 40:
                    lead_quality = 'Warm'
                else:
                    lead_quality = 'Cold'
                
                budget_str = f"€{budget:,.0f}" if budget else "N/A"
                price_str = f"€{float(prop.price):,.0f}" if prop.price else "N/A"
                
                perfect_match = PerfectMatch(
                    contact_id=str(contact.id),
                    contact_name=contact.name,
                    contact_budget=budget_str,
                    property_id=str(prop.id),
                    property_title=prop.title,
                    property_price=price_str,
                    match_score=round(match_score, 1),
                    lead_quality=lead_quality,
                    contact_lead_score=contact.lead_score
                )
                perfect_matches.append(perfect_match)
        
        # Sort by match score and limit
        perfect_matches.sort(key=lambda x: x.match_score, reverse=True)
        perfect_matches = perfect_matches[:10]
        
        # Summary statistics - wrap all count queries
        total_properties = await sync_to_async(
            Property.objects.filter(tenant_id=self.tenant_id).count
        )()
        
        active_properties = await sync_to_async(
            Property.objects.filter(tenant_id=self.tenant_id, status='active').count
        )()
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_properties_last_30_days = await sync_to_async(
            Property.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=thirty_days_ago
            ).count
        )()
        
        total_contacts = await sync_to_async(
            Contact.objects.filter(tenant_id=self.tenant_id).count
        )()
        
        new_leads_last_30_days = await sync_to_async(
            Contact.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=thirty_days_ago
            ).count
        )()
        
        high_priority_contacts = await sync_to_async(
            Contact.objects.filter(
                tenant_id=self.tenant_id,
                lead_score__gte=80
            ).count
        )()
        
        summary = CIMSummary(
            total_properties=total_properties,
            active_properties=active_properties,
            new_properties_last_30_days=new_properties_last_30_days,
            total_contacts=total_contacts,
            new_leads_last_30_days=new_leads_last_30_days,
            high_priority_contacts=high_priority_contacts,
            matched_contacts_properties=0  # TODO: Implement matching count
        )
        
        return CIMOverviewResponse(
            recent_properties=recent_properties,
            recent_contacts=recent_contacts,
            perfect_matches=perfect_matches,
            summary=summary,
            generated_at=datetime.utcnow()
        )
