"""
KPI Service - Berechnet Live-KPIs aus echten Daten
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from django.db.models import Count, Avg, Sum, F, Q
from asgiref.sync import sync_to_async

from app.db.models import Property, Task


class KPIService:
    """KPI Service für Live-Daten"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_kpi_dashboard(
        self,
        timeframe: str = 'month'
    ) -> Dict[str, Any]:
        """Get complete KPI dashboard with live data"""
        
        # Calculate date ranges based on timeframe
        end_date = datetime.utcnow()
        
        if timeframe == 'week':
            start_date = end_date - timedelta(days=7)
        elif timeframe == 'quarter':
            start_date = end_date - timedelta(days=90)
        elif timeframe == 'year':
            start_date = end_date - timedelta(days=365)
        else:  # month (default)
            start_date = end_date - timedelta(days=30)
        
        # Get basic KPI data
        kpi_data = await self._calculate_basic_kpis(start_date, end_date)
        
        return kpi_data
    
    async def _calculate_basic_kpis(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Calculate basic KPIs"""
        
        @sync_to_async
        def get_kpis_sync():
            # Get property counts
            total_properties = Property.objects.filter(tenant_id=self.tenant_id).count()
            active_properties = Property.objects.filter(
                tenant_id=self.tenant_id, 
                status='aktiv'
            ).count()
            
            # Get contact counts (placeholder for now)
            total_contacts = 0
            
            # Get task counts
            total_tasks = Task.objects.filter(tenant_id=self.tenant_id).count()
            completed_tasks = Task.objects.filter(
                tenant_id=self.tenant_id,
                status='done'
            ).count()
            
            # Calculate completion rate
            completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            return {
                'total_properties': total_properties,
                'active_properties': active_properties,
                'total_contacts': total_contacts,
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'completion_rate': round(completion_rate, 2),
                'timeframe': 'month'
            }
        
        return await get_kpis_sync()