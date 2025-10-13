"""
Analytics Pydantic Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.common import PaginatedResponse


class DashboardAnalyticsResponse(BaseModel):
    """Dashboard analytics response"""
    total_properties: int
    active_properties: int
    total_contacts: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    total_documents: int
    recent_activities: List[Dict[str, Any]]
    property_value_trend: List[Dict[str, Any]]
    contact_conversion_rate: float
    task_completion_rate: float
    monthly_revenue: Optional[float] = None
    monthly_expenses: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class PropertyAnalyticsResponse(BaseModel):
    """Property analytics response"""
    total_properties: int
    properties_by_type: Dict[str, int]
    properties_by_status: Dict[str, int]
    average_price: float
    price_range: Dict[str, float]
    properties_by_location: Dict[str, int]
    monthly_listings: List[Dict[str, Any]]
    conversion_rate: float
    average_days_on_market: float
    
    model_config = ConfigDict(from_attributes=True)


class ContactAnalyticsResponse(BaseModel):
    """Contact analytics response"""
    total_contacts: int
    contacts_by_source: Dict[str, int]
    contacts_by_status: Dict[str, int]
    lead_score_distribution: Dict[str, int]
    conversion_rate: float
    average_response_time: float
    monthly_new_contacts: List[Dict[str, Any]]
    top_performing_sources: List[Dict[str, Any]]
    
    model_config = ConfigDict(from_attributes=True)


class TaskAnalyticsResponse(BaseModel):
    """Task analytics response"""
    total_tasks: int
    tasks_by_status: Dict[str, int]
    tasks_by_priority: Dict[str, int]
    tasks_by_assignee: Dict[str, int]
    completion_rate: float
    average_completion_time: float
    overdue_tasks: int
    monthly_task_creation: List[Dict[str, Any]]
    productivity_metrics: Dict[str, Any]
    
    model_config = ConfigDict(from_attributes=True)


class KPIMetric(BaseModel):
    """KPI metric model"""
    name: str
    value: float
    target: Optional[float] = None
    unit: str
    trend: str  # "up", "down", "stable"
    change_percentage: Optional[float] = None
    period: str  # "daily", "weekly", "monthly", "yearly"
    
    model_config = ConfigDict(from_attributes=True)


class ChartDataPoint(BaseModel):
    """Chart data point model"""
    label: str
    value: float
    date: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)


class ChartResponse(BaseModel):
    """Chart response model"""
    title: str
    type: str  # "line", "bar", "pie", "area"
    data: List[ChartDataPoint]
    x_axis_label: Optional[str] = None
    y_axis_label: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)


class AnalyticsOverviewResponse(BaseModel):
    """Analytics overview response"""
    dashboard: DashboardAnalyticsResponse
    kpis: List[KPIMetric]
    charts: List[ChartResponse]
    last_updated: datetime
    
    model_config = ConfigDict(from_attributes=True)
