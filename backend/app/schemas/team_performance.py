"""
Team Performance Schemas
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class MemberBasicInfo(BaseModel):
    """Basic member information"""
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    role: str
    department: Optional[str] = None
    is_active: bool


class MemberStats(BaseModel):
    """Member performance statistics"""
    member: MemberBasicInfo
    
    # Task metrics
    tasks_total: int = 0
    tasks_completed: int = 0
    tasks_in_progress: int = 0
    tasks_overdue: int = 0
    completion_rate: float = 0.0
    
    # Property metrics
    properties_managed: int = 0
    properties_active: int = 0
    properties_sold: int = 0
    
    # Appointment metrics
    appointments_total: int = 0
    appointments_upcoming: int = 0
    appointments_completed: int = 0
    
    # Contact metrics
    contacts_managed: int = 0
    contacts_new_this_month: int = 0
    
    # Performance metrics
    performance_score: float = 0.0
    avg_task_completion_time_hours: float = 0.0
    monthly_target_achievement: float = 0.0
    
    # Time-based metrics
    last_activity: Optional[datetime] = None
    work_hours_this_week: float = 0.0
    work_hours_this_month: float = 0.0


class TeamPerformanceResponse(BaseModel):
    """Team performance overview"""
    timeframe: str
    total_members: int
    active_members: int
    
    # Team metrics
    team_performance_score: float = 0.0
    total_tasks_completed: int = 0
    total_properties_managed: int = 0
    total_appointments_scheduled: int = 0
    total_contacts_managed: int = 0
    
    # Performance trends
    performance_trend: str = "stable"  # up, down, stable
    completion_rate_trend: float = 0.0
    
    # Member stats
    members: List[MemberStats] = []
    
    # Time-based aggregations
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class MemberStatsResponse(BaseModel):
    """Detailed member statistics response"""
    member_stats: MemberStats
    timeframe: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityItem(BaseModel):
    """Single activity item"""
    id: str
    type: str  # task_created, task_completed, property_added, appointment_scheduled, etc.
    title: str
    description: str
    member_id: str
    member_name: str
    member_avatar: Optional[str] = None
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class ActivityFeedResponse(BaseModel):
    """Activity feed response"""
    activities: List[ActivityItem]
    total_count: int
    has_more: bool
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    rank: int
    member: MemberBasicInfo
    score: float
    metric_value: float
    trend: str = "stable"  # up, down, stable


class LeaderboardResponse(BaseModel):
    """Team leaderboard response"""
    timeframe: str
    metric: str
    entries: List[LeaderboardEntry]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class TeamMetricsResponse(BaseModel):
    """Overall team metrics and KPIs"""
    # Team size metrics
    total_members: int
    active_members: int
    new_members_this_month: int
    
    # Performance metrics
    team_performance_score: float
    avg_completion_rate: float
    avg_task_completion_time_hours: float
    
    # Business metrics
    total_properties_managed: int
    total_properties_sold: int
    total_appointments_scheduled: int
    total_contacts_managed: int
    
    # Time-based metrics
    tasks_completed_today: int
    tasks_completed_this_week: int
    tasks_completed_this_month: int
    
    # Trends
    performance_trend: str
    completion_rate_trend: float
    productivity_trend: str
    
    generated_at: datetime = Field(default_factory=datetime.utcnow)
