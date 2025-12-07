/**
 * KPI Service - API calls for KPI dashboard
 */
import api from './api.service';

export interface KPIMetric {
  metric: string;
  current: number;
  previous: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: 'percentage' | 'days' | 'euro' | 'count';
}

export interface ConversionFunnelStage {
  stage: string;
  count: number;
  conversion_rate: number;
  dropoff: number;
}

export interface TimeToCloseData {
  month: string;
  avg_days: number;
  target: number;
  fastest: number;
  slowest: number;
  properties: number;
}

export interface VacancyData {
  property_type: string;
  total_units: number;
  vacant_units: number;
  vacancy_rate: number;
  avg_vacancy_time: number;
  rent_loss: number;
}

export interface PerformanceRadar {
  metric: string;
  score: number;
  max_score: number;
}

export interface KPIDashboardResponse {
  kpi_metrics: KPIMetric[];
  conversion_funnel: ConversionFunnelStage[];
  time_to_close: TimeToCloseData[];
  vacancy_analysis: VacancyData[];
  performance_radar: PerformanceRadar[];
}

class KPIService {
  /**
   * Get KPI dashboard data
   */
  async getKPIDashboard(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<KPIDashboardResponse> {
    const response = await api.get(`/api/v1/analytics/kpi?timeframe=${timeframe}`);
    return response as KPIDashboardResponse;
  }
}

export default new KPIService();
