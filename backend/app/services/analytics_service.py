"""
Analytics Service
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from django.db import models
from django.db.models import Count, Sum, Avg

from app.db.models import Property, Contact, Task, Document, Appointment


class AnalyticsService:
    """Analytics service for dashboard and reporting"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_dashboard_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get dashboard analytics"""
        
        # Default date range if not provided
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Properties analytics
        properties_total = Property.objects.filter(tenant_id=self.tenant_id).count()
        properties_active = Property.objects.filter(
            tenant_id=self.tenant_id, 
            status='active'
        ).count()
        properties_new = Property.objects.filter(
            tenant_id=self.tenant_id,
            created_at__gte=start_date
        ).count()
        
        # Contacts analytics
        contacts_total = Contact.objects.filter(tenant_id=self.tenant_id).count()
        contacts_new = Contact.objects.filter(
            tenant_id=self.tenant_id,
            created_at__gte=start_date
        ).count()
        high_priority_contacts = Contact.objects.filter(
            tenant_id=self.tenant_id,
            lead_score__gte=80
        ).count()
        
        # Tasks analytics
        tasks_total = Task.objects.filter(tenant_id=self.tenant_id).count()
        tasks_completed = Task.objects.filter(
            tenant_id=self.tenant_id,
            status='done'
        ).count()
        tasks_overdue = Task.objects.filter(
            tenant_id=self.tenant_id,
            due_date__lt=datetime.utcnow(),
            status__in=['todo', 'in_progress', 'review']
        ).count()
        
        # Documents analytics
        documents_total = Document.objects.filter(tenant_id=self.tenant_id).count()
        documents_uploaded = Document.objects.filter(
            tenant_id=self.tenant_id,
            uploaded_at__gte=start_date
        ).count()
        
        # Appointments analytics
        appointments_total = Appointment.objects.filter(tenant_id=self.tenant_id).count()
        appointments_upcoming = Appointment.objects.filter(
            tenant_id=self.tenant_id,
            start_datetime__gte=datetime.utcnow(),
            status='confirmed'
        ).count()
        
        return {
            "properties": {
                "total": properties_total,
                "active": properties_active,
                "new": properties_new
            },
            "contacts": {
                "total": contacts_total,
                "new": contacts_new,
                "high_priority": high_priority_contacts
            },
            "tasks": {
                "total": tasks_total,
                "completed": tasks_completed,
                "overdue": tasks_overdue
            },
            "documents": {
                "total": documents_total,
                "uploaded": documents_uploaded
            },
            "appointments": {
                "total": appointments_total,
                "upcoming": appointments_upcoming
            },
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        }
    
    async def get_property_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get property analytics"""
        
        queryset = Property.objects.filter(tenant_id=self.tenant_id)
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        # Property counts by type
        by_type = queryset.values('property_type').annotate(count=Count('id'))
        
        # Property counts by status
        by_status = queryset.values('status').annotate(count=Count('id'))
        
        # Average price by type
        avg_price_by_type = queryset.values('property_type').annotate(
            avg_price=Avg('price')
        ).filter(price__isnull=False)
        
        # Price distribution
        price_ranges = [
            (0, 200000, "Under €200k"),
            (200000, 400000, "€200k - €400k"),
            (400000, 600000, "€400k - €600k"),
            (600000, 800000, "€600k - €800k"),
            (800000, float('inf'), "Over €800k")
        ]
        
        price_distribution = []
        for min_price, max_price, label in price_ranges:
            count = queryset.filter(
                price__gte=min_price,
                price__lt=max_price if max_price != float('inf') else None
            ).count()
            price_distribution.append({
                "range": label,
                "count": count
            })
        
        return {
            "by_type": list(by_type),
            "by_status": list(by_status),
            "avg_price_by_type": list(avg_price_by_type),
            "price_distribution": price_distribution
        }
    
    async def get_contact_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get contact analytics"""
        
        queryset = Contact.objects.filter(tenant_id=self.tenant_id)
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        # Contact counts by status
        by_status = queryset.values('status').annotate(count=Count('id'))
        
        # Lead score distribution
        lead_score_ranges = [
            (0, 20, "Low (0-20)"),
            (21, 40, "Low-Medium (21-40)"),
            (41, 60, "Medium (41-60)"),
            (61, 80, "Medium-High (61-80)"),
            (81, 100, "High (81-100)")
        ]
        
        lead_score_distribution = []
        for min_score, max_score, label in lead_score_ranges:
            count = queryset.filter(
                lead_score__gte=min_score,
                lead_score__lte=max_score
            ).count()
            lead_score_distribution.append({
                "range": label,
                "count": count
            })
        
        # Budget distribution
        budget_ranges = [
            (0, 200000, "Under €200k"),
            (200000, 400000, "€200k - €400k"),
            (400000, 600000, "€400k - €600k"),
            (600000, 800000, "€600k - €800k"),
            (800000, float('inf'), "Over €800k")
        ]
        
        budget_distribution = []
        for min_budget, max_budget, label in budget_ranges:
            count = queryset.filter(
                budget_min__gte=min_budget,
                budget_max__lte=max_budget if max_budget != float('inf') else None
            ).count()
            budget_distribution.append({
                "range": label,
                "count": count
            })
        
        return {
            "by_status": list(by_status),
            "lead_score_distribution": lead_score_distribution,
            "budget_distribution": budget_distribution
        }
    
    async def get_task_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get task analytics"""
        
        queryset = Task.objects.filter(tenant_id=self.tenant_id)
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        # Task counts by status
        by_status = queryset.values('status').annotate(count=Count('id'))
        
        # Task counts by priority
        by_priority = queryset.values('priority').annotate(count=Count('id'))
        
        # Completion rate over time
        completion_rate = queryset.filter(status='done').count() / queryset.count() * 100 if queryset.count() > 0 else 0
        
        # Average completion time
        completed_tasks = queryset.filter(status='done')
        avg_completion_time = None
        if completed_tasks.exists():
            # This would need a completed_at field in the Task model
            # For now, we'll use created_at as a proxy
            pass
        
        return {
            "by_status": list(by_status),
            "by_priority": list(by_priority),
            "completion_rate": completion_rate,
            "avg_completion_time": avg_completion_time
        }
