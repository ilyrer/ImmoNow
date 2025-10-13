"""
KPI Pydantic Schemas
"""
from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict


class KPIMetricResponse(BaseModel):
    """Single KPI metric response"""
    metric: str
    current: float
    previous: float
    target: float
    trend: str  # 'up', 'down', 'stable'
    unit: str  # 'percentage', 'days', 'euro', 'count'
    
    model_config = ConfigDict(from_attributes=True)


class ConversionFunnelStage(BaseModel):
    """Conversion funnel stage"""
    stage: str
    count: int
    conversion_rate: float
    dropoff: float
    
    model_config = ConfigDict(from_attributes=True)


class TimeToCloseData(BaseModel):
    """Time to close data point"""
    month: str
    avg_days: float
    target: int
    fastest: int
    slowest: int
    properties: int
    
    model_config = ConfigDict(from_attributes=True)


class VacancyData(BaseModel):
    """Vacancy data by property type"""
    property_type: str
    total_units: int
    vacant_units: int
    vacancy_rate: float
    avg_vacancy_time: int
    rent_loss: float
    
    model_config = ConfigDict(from_attributes=True)


class PerformanceRadar(BaseModel):
    """Performance radar metric"""
    metric: str
    score: float
    max_score: float
    
    model_config = ConfigDict(from_attributes=True)


class KPIDashboardResponse(BaseModel):
    """Complete KPI dashboard response"""
    kpi_metrics: List[KPIMetricResponse]
    conversion_funnel: List[ConversionFunnelStage]
    time_to_close: List[TimeToCloseData]
    vacancy_analysis: List[VacancyData]
    performance_radar: List[PerformanceRadar]
    
    model_config = ConfigDict(from_attributes=True)
