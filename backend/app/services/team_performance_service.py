"""
Team Performance Service
Optimized aggregations with caching for production-ready performance
"""
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from django.db.models import Q, Count, Sum, Avg, Max, Min, F, Case, When, IntegerField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from asgiref.sync import sync_to_async
from django.core.cache import cache
from django.conf import settings

from app.db.models import (
    UserProfile, Task, Property, Appointment, Contact, Attendee,
    User, Tenant
)
from app.schemas.team_performance import (
    TeamPerformanceResponse, MemberStatsResponse, ActivityFeedResponse,
    LeaderboardResponse, TeamMetricsResponse, MemberStats, MemberBasicInfo,
    ActivityItem, LeaderboardEntry
)
from app.core.errors import NotFoundError, ValidationError


class TeamPerformanceService:
    """Service for team performance analytics with optimized queries and caching"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.cache_timeout = 300  # 5 minutes
    
    def _get_cache_key(self, key_type: str, *args) -> str:
        """Generate cache key with tenant isolation"""
        return f"team:{self.tenant_id}:{key_type}:{':'.join(str(arg) for arg in args)}"
    
    async def _cache_get(self, cache_key: str):
        """Get from cache"""
        return await sync_to_async(cache.get)(cache_key)
    
    async def _cache_set(self, cache_key: str, value: Any, timeout: Optional[int] = None):
        """Set cache value"""
        if timeout is None:
            timeout = self.cache_timeout
        await sync_to_async(cache.set)(cache_key, value, timeout)
    
    async def _cache_delete_pattern(self, pattern: str):
        """Delete cache entries matching pattern"""
        # Note: This is a simplified version. In production, use Redis with pattern matching
        await sync_to_async(cache.delete_many)([pattern])
    
    def _get_timeframe_filter(self, timeframe: str) -> Tuple[datetime, datetime]:
        """Get date range for timeframe"""
        now = datetime.utcnow()
        
        if timeframe == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now
        elif timeframe == 'week':
            start_date = now - timedelta(days=7)
            end_date = now
        elif timeframe == 'month':
            start_date = now - timedelta(days=30)
            end_date = now
        elif timeframe == 'quarter':
            start_date = now - timedelta(days=90)
            end_date = now
        else:
            raise ValidationError(f"Invalid timeframe: {timeframe}")
        
        return start_date, end_date
    
    async def get_team_performance(self, timeframe: str = 'week') -> TeamPerformanceResponse:
        """Get team performance metrics with aggregations"""
        
        cache_key = self._get_cache_key('performance', timeframe)
        cached_data = await self._cache_get(cache_key)
        
        if cached_data:
            return TeamPerformanceResponse(**cached_data)
        
        start_date, end_date = self._get_timeframe_filter(timeframe)
        
        @sync_to_async
        def get_team_performance_sync():
            # Get all active members with optimized queries
            members = UserProfile.objects.filter(
                tenant_id=self.tenant_id,
                is_active=True
            ).select_related('user').prefetch_related(
                'user__assigned_tasks',
                'user__created_tasks'
            )
            
            member_stats = []
            total_tasks_completed = 0
            total_properties_managed = 0
            total_appointments_scheduled = 0
            total_contacts_managed = 0
            
            for member in members:
                # Get member stats with optimized queries
                stats = self._get_member_stats_sync(member, start_date, end_date)
                member_stats.append(stats)
                
                total_tasks_completed += stats.tasks_completed
                total_properties_managed += stats.properties_managed
                total_appointments_scheduled += stats.appointments_total
                total_contacts_managed += stats.contacts_managed
            
            # Calculate team performance score
            team_performance_score = 0.0
            if member_stats:
                team_performance_score = sum(s.performance_score for s in member_stats) / len(member_stats)
            
            return {
                'timeframe': timeframe,
                'total_members': len(members),
                'active_members': len(members),
                'team_performance_score': team_performance_score,
                'total_tasks_completed': total_tasks_completed,
                'total_properties_managed': total_properties_managed,
                'total_appointments_scheduled': total_appointments_scheduled,
                'total_contacts_managed': total_contacts_managed,
                'performance_trend': 'stable',  # TODO: Calculate trend
                'completion_rate_trend': 0.0,  # TODO: Calculate trend
                'members': [stats.model_dump() for stats in member_stats]
            }
        
        data = await get_team_performance_sync()
        await self._cache_set(cache_key, data)
        
        return TeamPerformanceResponse(**data)
    
    def _get_member_stats_sync(self, member: UserProfile, start_date: datetime, end_date: datetime) -> MemberStats:
        """Get member statistics synchronously with optimized queries"""
        
        user = member.user
        
        # Task metrics with optimized queries
        tasks_queryset = Task.objects.filter(
            tenant_id=self.tenant_id,
            assignee=user,
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        tasks_total = tasks_queryset.count()
        tasks_completed = tasks_queryset.filter(status='done').count()
        tasks_in_progress = tasks_queryset.filter(status='in_progress').count()
        tasks_overdue = tasks_queryset.filter(
            due_date__lt=datetime.utcnow(),
            status__in=['todo', 'in_progress', 'review']
        ).count()
        
        completion_rate = (tasks_completed / tasks_total * 100) if tasks_total > 0 else 0.0
        
        # Property metrics
        properties_queryset = Property.objects.filter(
            tenant_id=self.tenant_id,
            created_by=user
        )
        
        properties_managed = properties_queryset.count()
        properties_active = properties_queryset.filter(status='active').count()
        properties_sold = properties_queryset.filter(status='sold').count()
        
        # Appointment metrics
        appointments_queryset = Appointment.objects.filter(
            tenant_id=self.tenant_id,
            attendees__user=user,
            start_datetime__gte=start_date,
            start_datetime__lte=end_date
        ).distinct()
        
        appointments_total = appointments_queryset.count()
        appointments_upcoming = appointments_queryset.filter(
            start_datetime__gte=datetime.utcnow()
        ).count()
        appointments_completed = appointments_queryset.filter(
            start_datetime__lt=datetime.utcnow()
        ).count()
        
        # Contact metrics
        contacts_queryset = Contact.objects.filter(
            tenant_id=self.tenant_id
        )
        
        contacts_managed = contacts_queryset.count()
        contacts_new_this_month = contacts_queryset.filter(
            created_at__gte=datetime.utcnow().replace(day=1)
        ).count()
        
        # Calculate performance score
        performance_score = self._calculate_performance_score(
            completion_rate, tasks_completed, properties_sold, appointments_completed
        )
        
        # Calculate average task completion time
        completed_tasks = tasks_queryset.filter(status='done')
        avg_completion_time = 0.0
        if completed_tasks.exists():
            avg_completion_time = completed_tasks.aggregate(
                avg_time=Avg(F('updated_at') - F('created_at'))
            )['avg_time']
            if avg_completion_time:
                avg_completion_time = avg_completion_time.total_seconds() / 3600  # Convert to hours
        
        # Get last activity
        last_activity = None
        if tasks_queryset.exists():
            last_task = tasks_queryset.order_by('-updated_at').first()
            last_activity = last_task.updated_at
        
        return MemberStats(
            member=MemberBasicInfo(
                id=str(user.id),
                name=f"{user.first_name} {user.last_name}",
                email=user.email,
                avatar=member.avatar,
                role=member.role,
                department=None,  # TODO: Add department field
                is_active=member.is_active
            ),
            tasks_total=tasks_total,
            tasks_completed=tasks_completed,
            tasks_in_progress=tasks_in_progress,
            tasks_overdue=tasks_overdue,
            completion_rate=completion_rate,
            properties_managed=properties_managed,
            properties_active=properties_active,
            properties_sold=properties_sold,
            appointments_total=appointments_total,
            appointments_upcoming=appointments_upcoming,
            appointments_completed=appointments_completed,
            contacts_managed=contacts_managed,
            contacts_new_this_month=contacts_new_this_month,
            performance_score=performance_score,
            avg_task_completion_time_hours=avg_completion_time,
            monthly_target_achievement=0.0,  # TODO: Calculate target achievement
            last_activity=last_activity,
            work_hours_this_week=0.0,  # TODO: Calculate work hours
            work_hours_this_month=0.0  # TODO: Calculate work hours
        )
    
    def _calculate_performance_score(self, completion_rate: float, tasks_completed: int, 
                                   properties_sold: int, appointments_completed: int) -> float:
        """Calculate performance score based on multiple metrics"""
        
        # Weighted scoring system
        completion_weight = 0.4
        tasks_weight = 0.3
        properties_weight = 0.2
        appointments_weight = 0.1
        
        # Normalize metrics (simplified scoring)
        completion_score = min(completion_rate, 100) / 100
        tasks_score = min(tasks_completed / 10, 1.0)  # Max 10 tasks = 100%
        properties_score = min(properties_sold / 5, 1.0)  # Max 5 properties = 100%
        appointments_score = min(appointments_completed / 20, 1.0)  # Max 20 appointments = 100%
        
        performance_score = (
            completion_score * completion_weight +
            tasks_score * tasks_weight +
            properties_score * properties_weight +
            appointments_score * appointments_weight
        ) * 100
        
        return round(performance_score, 2)
    
    async def get_member_stats(self, member_id: str, timeframe: str = 'week') -> Optional[MemberStatsResponse]:
        """Get detailed member statistics"""
        
        cache_key = self._get_cache_key('member_stats', member_id, timeframe)
        cached_data = await self._cache_get(cache_key)
        
        if cached_data:
            return MemberStatsResponse(**cached_data)
        
        start_date, end_date = self._get_timeframe_filter(timeframe)
        
        @sync_to_async
        def get_member_stats_sync():
            try:
                member = UserProfile.objects.select_related('user').get(
                    user_id=member_id,
                    tenant_id=self.tenant_id,
                    is_active=True
                )
                
                stats = self._get_member_stats_sync(member, start_date, end_date)
                
                return {
                    'member_stats': stats.model_dump(),
                    'timeframe': timeframe
                }
                
            except UserProfile.DoesNotExist:
                return None
        
        data = await get_member_stats_sync()
        
        if data:
            await self._cache_set(cache_key, data)
            return MemberStatsResponse(**data)
        
        return None
    
    async def get_activity_feed(self, limit: int = 50, offset: int = 0) -> ActivityFeedResponse:
        """Get live activity feed for team"""
        
        cache_key = self._get_cache_key('activity_feed', limit, offset)
        cached_data = await self._cache_get(cache_key)
        
        if cached_data:
            return ActivityFeedResponse(**cached_data)
        
        @sync_to_async
        def get_activity_feed_sync():
            activities = []
            
            # Get recent tasks
            recent_tasks = Task.objects.filter(
                tenant_id=self.tenant_id
            ).select_related('assignee', 'created_by').order_by('-updated_at')[:limit]
            
            for task in recent_tasks:
                activities.append(ActivityItem(
                    id=f"task_{task.id}",
                    type="task_updated",
                    title=f"Task '{task.title}' updated",
                    description=f"Status changed to {task.status}",
                    member_id=str(task.assignee.id),
                    member_name=f"{task.assignee.first_name} {task.assignee.last_name}",
                    member_avatar=getattr(task.assignee.profile, 'avatar', None),
                    timestamp=task.updated_at,
                    metadata={'task_id': str(task.id), 'status': task.status}
                ))
            
            # Get recent properties
            recent_properties = Property.objects.filter(
                tenant_id=self.tenant_id
            ).select_related('created_by').order_by('-updated_at')[:limit//2]
            
            for property_obj in recent_properties:
                activities.append(ActivityItem(
                    id=f"property_{property_obj.id}",
                    type="property_updated",
                    title=f"Property '{property_obj.title}' updated",
                    description=f"Status: {property_obj.status}",
                    member_id=str(property_obj.created_by.id),
                    member_name=f"{property_obj.created_by.first_name} {property_obj.created_by.last_name}",
                    member_avatar=getattr(property_obj.created_by.profile, 'avatar', None),
                    timestamp=property_obj.updated_at,
                    metadata={'property_id': str(property_obj.id), 'status': property_obj.status}
                ))
            
            # Sort by timestamp and apply pagination
            activities.sort(key=lambda x: x.timestamp, reverse=True)
            paginated_activities = activities[offset:offset + limit]
            
            return {
                'activities': [activity.model_dump() for activity in paginated_activities],
                'total_count': len(activities),
                'has_more': len(activities) > offset + limit
            }
        
        data = await get_activity_feed_sync()
        await self._cache_set(cache_key, data, timeout=120)  # 2 minutes cache
        
        return ActivityFeedResponse(**data)
    
    async def get_team_leaderboard(self, timeframe: str = 'month', metric: str = 'performance_score') -> LeaderboardResponse:
        """Get team leaderboard with rankings"""
        
        cache_key = self._get_cache_key('leaderboard', timeframe, metric)
        cached_data = await self._cache_get(cache_key)
        
        if cached_data:
            return LeaderboardResponse(**cached_data)
        
        start_date, end_date = self._get_timeframe_filter(timeframe)
        
        @sync_to_async
        def get_leaderboard_sync():
            members = UserProfile.objects.filter(
                tenant_id=self.tenant_id,
                is_active=True
            ).select_related('user')
            
            leaderboard_entries = []
            
            for rank, member in enumerate(members, 1):
                stats = self._get_member_stats_sync(member, start_date, end_date)
                
                # Get metric value based on requested metric
                if metric == 'performance_score':
                    metric_value = stats.performance_score
                elif metric == 'tasks_completed':
                    metric_value = stats.tasks_completed
                elif metric == 'properties_managed':
                    metric_value = stats.properties_managed
                else:
                    metric_value = stats.performance_score
                
                leaderboard_entries.append(LeaderboardEntry(
                    rank=rank,
                    member=stats.member,
                    score=stats.performance_score,
                    metric_value=metric_value,
                    trend='stable'  # TODO: Calculate trend
                ))
            
            # Sort by metric value
            leaderboard_entries.sort(key=lambda x: x.metric_value, reverse=True)
            
            # Update ranks
            for rank, entry in enumerate(leaderboard_entries, 1):
                entry.rank = rank
            
            return {
                'timeframe': timeframe,
                'metric': metric,
                'entries': [entry.model_dump() for entry in leaderboard_entries]
            }
        
        data = await get_leaderboard_sync()
        await self._cache_set(cache_key, data)
        
        return LeaderboardResponse(**data)
    
    async def get_team_metrics(self) -> TeamMetricsResponse:
        """Get overall team metrics and KPIs"""
        
        cache_key = self._get_cache_key('team_metrics')
        cached_data = await self._cache_get(cache_key)
        
        if cached_data:
            return TeamMetricsResponse(**cached_data)
        
        @sync_to_async
        def get_team_metrics_sync():
            now = datetime.utcnow()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = now - timedelta(days=7)
            month_start = now - timedelta(days=30)
            
            # Team size metrics
            total_members = UserProfile.objects.filter(tenant_id=self.tenant_id).count()
            active_members = UserProfile.objects.filter(
                tenant_id=self.tenant_id,
                is_active=True
            ).count()
            new_members_this_month = UserProfile.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=month_start
            ).count()
            
            # Task metrics
            tasks_today = Task.objects.filter(
                tenant_id=self.tenant_id,
                status='done',
                updated_at__gte=today_start
            ).count()
            
            tasks_this_week = Task.objects.filter(
                tenant_id=self.tenant_id,
                status='done',
                updated_at__gte=week_start
            ).count()
            
            tasks_this_month = Task.objects.filter(
                tenant_id=self.tenant_id,
                status='done',
                updated_at__gte=month_start
            ).count()
            
            # Property metrics
            total_properties = Property.objects.filter(tenant_id=self.tenant_id).count()
            properties_sold = Property.objects.filter(
                tenant_id=self.tenant_id,
                status='sold'
            ).count()
            
            # Appointment metrics
            total_appointments = Appointment.objects.filter(tenant_id=self.tenant_id).count()
            
            # Contact metrics
            total_contacts = Contact.objects.filter(tenant_id=self.tenant_id).count()
            
            # Calculate averages
            avg_completion_rate = 0.0
            avg_task_completion_time = 0.0
            
            if active_members > 0:
                # Get completion rates for all active members
                completion_rates = []
                for member in UserProfile.objects.filter(tenant_id=self.tenant_id, is_active=True):
                    user_tasks = Task.objects.filter(
                        tenant_id=self.tenant_id,
                        assignee=member.user
                    )
                    if user_tasks.exists():
                        completed = user_tasks.filter(status='done').count()
                        total = user_tasks.count()
                        completion_rates.append((completed / total * 100) if total > 0 else 0)
                
                if completion_rates:
                    avg_completion_rate = sum(completion_rates) / len(completion_rates)
            
            # Calculate team performance score
            team_performance_score = 0.0
            if active_members > 0:
                team_performance_score = (tasks_this_month / active_members) * 10  # Simplified calculation
            
            return {
                'total_members': total_members,
                'active_members': active_members,
                'new_members_this_month': new_members_this_month,
                'team_performance_score': min(team_performance_score, 100),
                'avg_completion_rate': avg_completion_rate,
                'avg_task_completion_time_hours': avg_task_completion_time,
                'total_properties_managed': total_properties,
                'total_properties_sold': properties_sold,
                'total_appointments_scheduled': total_appointments,
                'total_contacts_managed': total_contacts,
                'tasks_completed_today': tasks_today,
                'tasks_completed_this_week': tasks_this_week,
                'tasks_completed_this_month': tasks_this_month,
                'performance_trend': 'stable',  # TODO: Calculate trend
                'completion_rate_trend': 0.0,  # TODO: Calculate trend
                'productivity_trend': 'stable'  # TODO: Calculate trend
            }
        
        data = await get_team_metrics_sync()
        await self._cache_set(cache_key, data)
        
        return TeamMetricsResponse(**data)
    
    async def get_dashboard_summary(self, timeframe: str) -> Dict[str, Any]:
        """Get comprehensive dashboard summary"""
        cache_key = self._get_cache_key("dashboard_summary", timeframe)
        cached_data = await self._cache_get(cache_key)
        
        if cached_data:
            return cached_data
        
        # Get all relevant data
        performance_data = await self.get_team_performance(timeframe)
        metrics_data = await self.get_team_metrics()
        financial_data = await self.get_financial_overview(timeframe)
        quick_actions = await self.get_quick_actions()
        
        summary = {
            "performance": performance_data,
            "metrics": metrics_data,
            "financial": financial_data,
            "quick_actions": quick_actions,
            "last_updated": datetime.now().isoformat()
        }
        
        await self._cache_set(cache_key, summary)
        return summary

    async def get_financial_overview(self, timeframe: str) -> Dict[str, Any]:
        """Get financial overview including total value and revenue metrics"""
        cache_key = self._get_cache_key("financial_overview", timeframe)
        cached_data = await self._cache_get(cache_key)
        
        if cached_data:
            return cached_data
        
        # Calculate timeframe dates
        now = datetime.now()
        if timeframe == 'week':
            start_date = now - timedelta(weeks=1)
        elif timeframe == 'month':
            start_date = now - timedelta(days=30)
        elif timeframe == 'quarter':
            start_date = now - timedelta(days=90)
        else:
            start_date = now - timedelta(days=30)
        
        # Get properties with financial data
        properties = await sync_to_async(list)(
            Property.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=start_date
            ).values('id', 'price', 'status', 'created_at')
        )
        
        # Calculate financial metrics
        total_value = sum(p.get('price', 0) or 0 for p in properties)
        active_properties = len([p for p in properties if p.get('status') == 'active'])
        sold_properties = len([p for p in properties if p.get('status') == 'sold'])
        
        # Calculate revenue (simplified - in real implementation, use actual sales data)
        revenue = sum(p.get('price', 0) or 0 for p in properties if p.get('status') == 'sold')
        
        # Calculate growth (compare with previous period)
        previous_start = start_date - (now - start_date)
        previous_properties = await sync_to_async(list)(
            Property.objects.filter(
                tenant_id=self.tenant_id,
                created_at__gte=previous_start,
                created_at__lt=start_date
            ).values('price', 'status')
        )
        
        previous_value = sum(p.get('price', 0) or 0 for p in previous_properties)
        growth_percentage = 0
        if previous_value > 0:
            growth_percentage = ((total_value - previous_value) / previous_value) * 100
        
        financial_data = {
            "total_value": total_value,
            "revenue": revenue,
            "active_properties": active_properties,
            "sold_properties": sold_properties,
            "growth_percentage": round(growth_percentage, 2),
            "timeframe": timeframe,
            "currency": "EUR"
        }
        
        await self._cache_set(cache_key, financial_data)
        return financial_data

    async def get_quick_actions(self) -> List[Dict[str, Any]]:
        """Get available quick actions for the dashboard"""
        cache_key = self._get_cache_key("quick_actions")
        cached_data = await self._cache_get(cache_key)
        
        if cached_data:
            return cached_data
        
        # Get pending tasks count
        pending_tasks = await sync_to_async(
            Task.objects.filter(
                tenant_id=self.tenant_id,
                status__in=['pending', 'in_progress']
            ).count
        )()
        
        # Get upcoming appointments count
        upcoming_appointments = await sync_to_async(
            Appointment.objects.filter(
                tenant_id=self.tenant_id,
                start_datetime__gte=datetime.now()
            ).count
        )()
        
        # Get properties needing attention
        properties_needing_attention = await sync_to_async(
            Property.objects.filter(
                tenant_id=self.tenant_id,
                status='draft'
            ).count
        )()
        
        actions = [
            {
                "id": "new_project",
                "title": "Neues Projekt",
                "description": "Neue Immobilie oder Projekt erstellen",
                "icon": "plus",
                "url": "/properties/create",
                "priority": "high",
                "available": True
            },
            {
                "id": "status_report",
                "title": "Status Report",
                "description": f"{pending_tasks} offene Aufgaben, {upcoming_appointments} Termine",
                "icon": "chart",
                "url": "/reports/status",
                "priority": "medium",
                "available": True,
                "badge": pending_tasks + upcoming_appointments
            },
            {
                "id": "team_meeting",
                "title": "Team Meeting",
                "description": "Team-Meeting planen oder verwalten",
                "icon": "users",
                "url": "/team/meetings",
                "priority": "medium",
                "available": True
            },
            {
                "id": "property_review",
                "title": "Immobilien-Prüfung",
                "description": f"{properties_needing_attention} Immobilien benötigen Aufmerksamkeit",
                "icon": "home",
                "url": "/properties/review",
                "priority": "high",
                "available": properties_needing_attention > 0,
                "badge": properties_needing_attention
            }
        ]
        
        await self._cache_set(cache_key, actions)
        return actions

    async def invalidate_cache(self):
        """Invalidate all team performance cache"""
        patterns = [
            f"team:{self.tenant_id}:performance:*",
            f"team:{self.tenant_id}:member_stats:*",
            f"team:{self.tenant_id}:activity_feed:*",
            f"team:{self.tenant_id}:leaderboard:*",
            f"team:{self.tenant_id}:team_metrics",
            f"team:{self.tenant_id}:dashboard_summary:*",
            f"team:{self.tenant_id}:financial_overview:*",
            f"team:{self.tenant_id}:quick_actions"
        ]
        
        for pattern in patterns:
            await self._cache_delete_pattern(pattern)
