/**
 * Investor Service - Enterprise Edition
 * Complete implementation of all investor endpoints
 */

import { apiClient } from '../api/config';
import {
  InvestorAssetResponse,
  PortfolioKPIsResponse
} from '../lib/api/types';

// Additional types for comprehensive investor features
export interface InvestorPosition {
  id: string;
  property_id: string;
  property_title: string;
  address: string;
  city: string;
  type: string;
  sqm: number;
  purchase_date: string;
  purchase_price: number;
  current_value: number;
  monthly_rent: number;
  occupancy_rate: number;
  roi: number;
  cashflow: number;
  maintenance_costs: number;
  property_tax: number;
  insurance: number;
  net_yield: number;
  status: string;
}

export interface PerformanceDataPoint {
  date: string;
  value: number;
  roi: number;
  cashflow: number;
  vacancy_rate: number;
}

export interface PerformanceResponse {
  period: string;
  data_points: PerformanceDataPoint[];
  total_return: number;
  annualized_return: number;
  volatility: number;
  sharpe_ratio: number;
}

export interface VacancyAnalyticsResponse {
  current_vacancy_rate: number;
  average_vacancy_rate: number;
  vacancy_trend: any[];
  properties_by_vacancy: any[];
  vacancy_costs: number;
  recommendations: string[];
}

export interface CostAnalyticsResponse {
  total_costs: number;
  costs_by_category: Record<string, number>;
  cost_trend: any[];
  cost_per_sqm: number;
  maintenance_efficiency: number;
  recommendations: string[];
}

export interface InvestorReportResponse {
  id: string;
  title: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  status: string;
  file_url?: string;
  summary: Record<string, any>;
}

export interface GenerateReportRequest {
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period_start: string;
  period_end: string;
  include_properties?: string[];
}

export interface MarketplacePackageResponse {
  id: string;
  title: string;
  description: string;
  location: string;
  total_value: number;
  expected_roi: number;
  min_investment: number;
  max_investors: number;
  current_investors: number;
  status: string;
  created_at: string;
  expires_at: string;
  property_count: number;
  property_types: string[];
}

export interface ReservePackageRequest {
  investment_amount: number;
  notes?: string;
}

export interface ROISimulationRequest {
  property_value: number;
  down_payment: number;
  interest_rate: number;
  loan_term_years: number;
  monthly_rent: number;
  vacancy_rate: number;
  maintenance_rate: number;
  property_tax_rate: number;
  insurance_rate: number;
  management_fee_rate: number;
  appreciation_rate: number;
}

export interface ROISimulationResponse {
  monthly_cashflow: number;
  annual_cashflow: number;
  annual_roi: number;
  total_return_5y: number;
  total_return_10y: number;
  break_even_months: number;
  net_present_value: number;
  internal_rate_return: number;
  cash_on_cash_return: number;
  scenarios: any[];
}

class InvestorService {
  /**
   * GET /api/v1/investor/portfolio - Portfolio-Daten
   */
  async getPortfolio(): Promise<{
    assets: InvestorAssetResponse[];
    kpis: PortfolioKPIsResponse;
  }> {
    const response = await apiClient.get<{
      assets: InvestorAssetResponse[];
      kpis: PortfolioKPIsResponse;
    }>('/api/v1/investor/portfolio');
    return response;
  }

  /**
   * GET /api/v1/investor/positions - Individual positions
   */
  async getPositions(): Promise<InvestorPosition[]> {
    return await apiClient.get<InvestorPosition[]>('/api/v1/investor/positions');
  }

  /**
   * GET /api/v1/investor/performance - Performance data
   */
  async getPerformance(range: 'day' | 'week' | 'month' | 'year'): Promise<PerformanceResponse> {
    return await apiClient.get<PerformanceResponse>(`/api/v1/investor/performance?range=${range}`);
  }

  /**
   * GET /api/v1/investor/analytics/vacancy - Vacancy analytics
   */
  async getVacancyAnalytics(): Promise<VacancyAnalyticsResponse> {
    return await apiClient.get<VacancyAnalyticsResponse>('/api/v1/investor/analytics/vacancy');
  }

  /**
   * GET /api/v1/investor/analytics/costs - Cost analytics
   */
  async getCostAnalytics(): Promise<CostAnalyticsResponse> {
    return await apiClient.get<CostAnalyticsResponse>('/api/v1/investor/analytics/costs');
  }

  /**
   * GET /api/v1/investor/reports - Get reports list
   */
  async getReports(): Promise<InvestorReportResponse[]> {
    return await apiClient.get<InvestorReportResponse[]>('/api/v1/investor/reports');
  }

  /**
   * POST /api/v1/investor/reports/generate - Generate new report
   */
  async generateReport(request: GenerateReportRequest): Promise<InvestorReportResponse> {
    return await apiClient.post<InvestorReportResponse>('/api/v1/investor/reports/generate', request);
  }

  /**
   * GET /api/v1/investor/reports/:id/export - Export report
   */
  async exportReport(reportId: string, format: 'pdf' | 'csv' | 'excel'): Promise<Blob> {
    return await apiClient.get<Blob>(`/api/v1/investor/reports/${reportId}/export?format=${format}`, {
      responseType: 'blob'
    } as any);
  }

  /**
   * GET /api/v1/investor/marketplace/packages - Get marketplace packages
   */
  async getMarketplacePackages(): Promise<MarketplacePackageResponse[]> {
    return await apiClient.get<MarketplacePackageResponse[]>('/api/v1/investor/marketplace/packages');
  }

  /**
   * POST /api/v1/investor/marketplace/packages/:id/reserve - Reserve package
   */
  async reservePackage(packageId: string, request: ReservePackageRequest): Promise<any> {
    return await apiClient.post(`/api/v1/investor/marketplace/packages/${packageId}/reserve`, request);
  }

  /**
   * POST /api/v1/investor/simulations/roi - Simulate ROI
   */
  async simulateROI(request: ROISimulationRequest): Promise<ROISimulationResponse> {
    return await apiClient.post<ROISimulationResponse>('/api/v1/investor/simulations/roi', request);
  }
}

export const investorService = new InvestorService();
export default investorService;
