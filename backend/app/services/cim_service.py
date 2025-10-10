"""
CIM Service
"""
from typing import Optional, List
from datetime import datetime, timedelta
from django.db import models
from django.db.models import Q, Count

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
        
        # Recent properties
        properties_query = Property.objects.filter(tenant_id=self.tenant_id)
        if property_status:
            properties_query = properties_query.filter(status=property_status)
        
        recent_properties = []
        for prop in properties_query.order_by('-created_at')[:limit]:
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
        
        # Recent contacts
        contacts_query = Contact.objects.filter(tenant_id=self.tenant_id)
        if contact_status:
            contacts_query = contacts_query.filter(status=contact_status)
        
        recent_contacts = []
        for contact in contacts_query.order_by('-created_at')[:limit]:
            budget_min = float(contact.budget_min) if contact.budget_min else None
            budget_max = float(contact.budget_max) if contact.budget_max else None
            
            if budget_min and budget_max:
                budget_formatted = f"€{budget_min:,.0f} - €{budget_max:,.0f}"
            elif budget_min:
                budget_formatted = f"€{budget_min:,.0f}+"
            elif budget_max:
                budget_formatted = f"up to €{budget_max:,.0f}"
            else:
                budget_formatted = "N/A"
            
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
                last_contact=None,  # TODO: Implement last contact tracking
                last_action="Created",  # TODO: Implement last action tracking
                lead_score=contact.lead_score,
                matching_properties=[],  # TODO: Implement matching properties
                matching_count=0  # TODO: Implement matching count
            )
            recent_contacts.append(recent_contact)
        
        # Perfect matches (simplified)
        perfect_matches = []
        # TODO: Implement actual matching algorithm
        
        # Summary statistics
        total_properties = Property.objects.filter(tenant_id=self.tenant_id).count()
        active_properties = Property.objects.filter(
            tenant_id=self.tenant_id, 
            status='active'
        ).count()
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_properties_last_30_days = Property.objects.filter(
            tenant_id=self.tenant_id,
            created_at__gte=thirty_days_ago
        ).count()
        
        total_contacts = Contact.objects.filter(tenant_id=self.tenant_id).count()
        new_leads_last_30_days = Contact.objects.filter(
            tenant_id=self.tenant_id,
            created_at__gte=thirty_days_ago
        ).count()
        
        high_priority_contacts = Contact.objects.filter(
            tenant_id=self.tenant_id,
            lead_score__gte=80
        ).count()
        
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
