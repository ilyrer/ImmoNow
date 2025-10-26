"""
Property Metrics Service für View/Inquiry-Tracking
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from django.db.models import Count, Q
from asgiref.sync import sync_to_async

from app.db.models import Property, PropertyViewEvent, PropertyInquiryEvent, Contact
from app.core.errors import NotFoundError

logger = logging.getLogger(__name__)


class PropertyMetricsService:
    """Service für Property-Metrics und Analytics"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def track_property_view(
        self,
        property_id: str,
        viewer_fingerprint: Optional[str] = None,
        viewer_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        referrer: Optional[str] = None,
        source: str = 'web'
    ) -> PropertyViewEvent:
        """Track a property view event"""
        
        try:
            # Verify property exists and belongs to tenant
            property_obj = await sync_to_async(Property.objects.get)(
                id=property_id,
                tenant_id=self.tenant_id
            )
            
            # Create view event
            view_event = await sync_to_async(PropertyViewEvent.objects.create)(
                tenant_id=self.tenant_id,
                property=property_obj,
                viewer_fingerprint=viewer_fingerprint,
                viewer_ip=viewer_ip,
                user_agent=user_agent,
                referrer=referrer,
                source=source
            )
            
            logger.info(f"Tracked view for property {property_id} from {source}")
            return view_event
            
        except Property.DoesNotExist:
            raise NotFoundError(f"Property {property_id} not found")
        except Exception as e:
            logger.error(f"Failed to track property view: {e}")
            raise
    
    async def track_property_inquiry(
        self,
        property_id: str,
        contact_name: Optional[str] = None,
        contact_email: Optional[str] = None,
        contact_phone: Optional[str] = None,
        contact_id: Optional[str] = None,
        source: str = 'web',
        inquiry_type: str = 'general',
        message: Optional[str] = None
    ) -> PropertyInquiryEvent:
        """Track a property inquiry event"""
        
        try:
            # Verify property exists and belongs to tenant
            property_obj = await sync_to_async(Property.objects.get)(
                id=property_id,
                tenant_id=self.tenant_id
            )
            
            # Get contact if provided
            contact_obj = None
            if contact_id:
                contact_obj = await sync_to_async(Contact.objects.get)(
                    id=contact_id,
                    tenant_id=self.tenant_id
                )
            
            # Create inquiry event
            inquiry_event = await sync_to_async(PropertyInquiryEvent.objects.create)(
                tenant_id=self.tenant_id,
                property=property_obj,
                contact=contact_obj,
                contact_name=contact_name,
                contact_email=contact_email,
                contact_phone=contact_phone,
                source=source,
                inquiry_type=inquiry_type,
                message=message
            )
            
            logger.info(f"Tracked inquiry for property {property_id} from {contact_name or contact_email}")
            return inquiry_event
            
        except Property.DoesNotExist:
            raise NotFoundError(f"Property {property_id} not found")
        except Contact.DoesNotExist:
            raise NotFoundError(f"Contact {contact_id} not found")
        except Exception as e:
            logger.error(f"Failed to track property inquiry: {e}")
            raise
    
    async def get_property_metrics(self, property_id: str) -> Dict[str, Any]:
        """Get metrics for a specific property"""
        
        try:
            # Verify property exists
            property_obj = await sync_to_async(Property.objects.get)(
                id=property_id,
                tenant_id=self.tenant_id
            )
            
            # Count views
            views_count = await sync_to_async(PropertyViewEvent.objects.filter(
                tenant_id=self.tenant_id,
                property_id=property_id
            ).count)()
            
            # Count inquiries
            inquiries_count = await sync_to_async(PropertyInquiryEvent.objects.filter(
                tenant_id=self.tenant_id,
                property_id=property_id
            ).count)()
            
            # Calculate DOM (Days on Market)
            dom = (datetime.now().date() - property_obj.created_at.date()).days
            
            # Recent views (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_views = await sync_to_async(PropertyViewEvent.objects.filter(
                tenant_id=self.tenant_id,
                property_id=property_id,
                created_at__gte=thirty_days_ago
            ).count)()
            
            # Recent inquiries (last 30 days)
            recent_inquiries = await sync_to_async(PropertyInquiryEvent.objects.filter(
                tenant_id=self.tenant_id,
                property_id=property_id,
                created_at__gte=thirty_days_ago
            ).count)()
            
            # Conversion rate
            conversion_rate = (inquiries_count / views_count * 100) if views_count > 0 else 0
            
            return {
                'property_id': property_id,
                'property_title': property_obj.title,
                'views': views_count,
                'inquiries': inquiries_count,
                'dom': dom,
                'recent_views': recent_views,
                'recent_inquiries': recent_inquiries,
                'conversion_rate': round(conversion_rate, 2),
                'status': property_obj.status,
                'created_at': property_obj.created_at,
                'last_updated': datetime.now()
            }
            
        except Property.DoesNotExist:
            raise NotFoundError(f"Property {property_id} not found")
        except Exception as e:
            logger.error(f"Failed to get property metrics: {e}")
            raise
    
    async def get_top_performing_properties(
        self,
        limit: int = 10,
        period_days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get top performing properties by views and inquiries"""
        
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Get properties with view counts
            properties_with_views = await sync_to_async(list)(
                Property.objects.filter(tenant_id=self.tenant_id)
                .annotate(
                    view_count=Count('view_events', filter=Q(
                        view_events__created_at__gte=start_date,
                        view_events__created_at__lte=end_date
                    )),
                    inquiry_count=Count('inquiry_events', filter=Q(
                        inquiry_events__created_at__gte=start_date,
                        inquiry_events__created_at__lte=end_date
                    ))
                )
                .order_by('-view_count', '-inquiry_count')[:limit]
            )
            
            # Build response
            top_properties = []
            for prop in properties_with_views:
                # Calculate DOM
                dom = (datetime.now().date() - prop.created_at.date()).days
                
                # Calculate conversion rate
                conversion_rate = (prop.inquiry_count / prop.view_count * 100) if prop.view_count > 0 else 0
                
                top_properties.append({
                    'property_id': str(prop.id),
                    'title': prop.title,
                    'location': prop.location,
                    'price': float(prop.price) if prop.price else 0,
                    'status': prop.status,
                    'views': prop.view_count,
                    'inquiries': prop.inquiry_count,
                    'dom': dom,
                    'conversion_rate': round(conversion_rate, 2),
                    'property_type': prop.property_type,
                    'created_at': prop.created_at
                })
            
            return top_properties
            
        except Exception as e:
            logger.error(f"Failed to get top performing properties: {e}")
            raise
    
    async def get_property_analytics_summary(self) -> Dict[str, Any]:
        """Get overall property analytics summary for tenant"""
        
        try:
            # Total properties
            total_properties = await sync_to_async(Property.objects.filter(
                tenant_id=self.tenant_id
            ).count)()
            
            # Total views
            total_views = await sync_to_async(PropertyViewEvent.objects.filter(
                tenant_id=self.tenant_id
            ).count)()
            
            # Total inquiries
            total_inquiries = await sync_to_async(PropertyInquiryEvent.objects.filter(
                tenant_id=self.tenant_id
            ).count)()
            
            # Average views per property
            avg_views = total_views / total_properties if total_properties > 0 else 0
            
            # Average inquiries per property
            avg_inquiries = total_inquiries / total_properties if total_properties > 0 else 0
            
            # Overall conversion rate
            conversion_rate = (total_inquiries / total_views * 100) if total_views > 0 else 0
            
            # Recent activity (last 30 days)
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_views = await sync_to_async(PropertyViewEvent.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=thirty_days_ago
            ).count)()
            
            recent_inquiries = await sync_to_async(PropertyInquiryEvent.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=thirty_days_ago
            ).count)()
            
            return {
                'total_properties': total_properties,
                'total_views': total_views,
                'total_inquiries': total_inquiries,
                'avg_views_per_property': round(avg_views, 1),
                'avg_inquiries_per_property': round(avg_inquiries, 1),
                'conversion_rate': round(conversion_rate, 2),
                'recent_views_30d': recent_views,
                'recent_inquiries_30d': recent_inquiries,
                'last_updated': datetime.now()
            }
            
        except Exception as e:
            logger.error(f"Failed to get property analytics summary: {e}")
            raise
    
    async def get_property_view_trend(
        self,
        property_id: str,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get view trend for a property over time"""
        
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Get daily view counts
            daily_views = await sync_to_async(list)(
                PropertyViewEvent.objects.filter(
                    tenant_id=self.tenant_id,
                    property_id=property_id,
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).extra(
                    select={'date': 'DATE(created_at)'}
                ).values('date').annotate(
                    count=Count('id')
                ).order_by('date')
            )
            
            # Fill missing dates with 0
            trend_data = []
            current_date = start_date.date()
            end_date_only = end_date.date()
            
            daily_dict = {item['date']: item['count'] for item in daily_views}
            
            while current_date <= end_date_only:
                count = daily_dict.get(current_date, 0)
                trend_data.append({
                    'date': current_date.isoformat(),
                    'views': count
                })
                current_date += timedelta(days=1)
            
            return trend_data
            
        except Exception as e:
            logger.error(f"Failed to get property view trend: {e}")
            raise
