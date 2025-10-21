/**
 * Investor Service
 * Implementiert alle Investor-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
import {
  InvestorAssetResponse,
  PortfolioKPIsResponse,
  InvestorPortfolioResponse,
  InvestorReportResponse,
  MarketplacePackageResponse,
  ROISimulationResponse,
  SavedSimulationResponse,
  VacancyAnalyticsResponse,
  CostAnalyticsResponse
} from '../lib/api/types';

class InvestorService {
  /**
   * GET /investor/portfolio - Portfolio-Daten
   */
  async getPortfolio(): Promise<InvestorPortfolioResponse> {
    return await apiClient.get<InvestorPortfolioResponse>('/api/v1/investor/portfolio');
  }

  /**
   * GET /investor/positions - Investor Positionen
   */
  async getPositions(): Promise<InvestorAssetResponse[]> {
    return await apiClient.get<InvestorAssetResponse[]>('/api/v1/investor/positions');
  }

  /**
   * GET /investor/performance - Performance-Daten
   */
  async getPerformance(period: string): Promise<any> {
    return await apiClient.get(`/api/v1/investor/performance?period=${period}`);
  }

  /**
   * GET /investor/analytics - Analytics-Daten
   */
  async getAnalytics(type: string): Promise<any> {
    return await apiClient.get(`/api/v1/investor/analytics?type=${type}`);
  }

  /**
   * GET /investor/reports - Investor Reports
   */
  async getReports(): Promise<InvestorReportResponse[]> {
    return await apiClient.get<InvestorReportResponse[]>('/api/v1/investor/reports');
  }

  /**
   * POST /investor/reports/generate - Report generieren
   */
  async generateReport(data: {
    report_type: string;
    period_start: string;
    period_end: string;
    include_charts?: boolean;
    include_recommendations?: boolean;
  }): Promise<InvestorReportResponse> {
    return await apiClient.post<InvestorReportResponse>('/api/v1/investor/reports/generate', data);
  }

  /**
   * GET /investor/marketplace/packages - Marketplace Pakete
   */
  async getMarketplacePackages(): Promise<MarketplacePackageResponse[]> {
    return await apiClient.get<MarketplacePackageResponse[]>('/api/v1/investor/marketplace/packages');
  }

  /**
   * POST /investor/marketplace/{package_id}/reserve - Paket reservieren
   */
  async reservePackage(packageId: string, data: {
    investment_amount: number;
    contact_preference?: string;
  }): Promise<any> {
    return await apiClient.post(`/api/v1/investor/marketplace/${packageId}/reserve`, data);
  }

  /**
   * POST /investor/simulations/roi - ROI Simulation
   */
  async simulateROI(data: {
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
  }): Promise<ROISimulationResponse> {
    return await apiClient.post<ROISimulationResponse>('/api/v1/investor/simulations/roi', data);
  }

  /**
   * GET /investor/simulations - Gespeicherte Simulationen laden
   */
  async getSavedSimulations(): Promise<SavedSimulationResponse[]> {
    return await apiClient.get<SavedSimulationResponse[]>('/api/v1/investor/simulations');
  }

  /**
   * POST /investor/simulations - Simulation speichern
   */
  async saveSimulation(data: {
    name: string;
    scenario: string;
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
  }): Promise<SavedSimulationResponse> {
    return await apiClient.post<SavedSimulationResponse>('/api/v1/investor/simulations', data);
  }

  /**
   * DELETE /investor/simulations/{id} - Simulation löschen
   */
  async deleteSimulation(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/investor/simulations/${id}`);
  }

  /**
   * GET /investor/analytics/vacancy - Leerstandsanalysen
   */
  async getVacancyAnalytics(): Promise<VacancyAnalyticsResponse> {
    return await apiClient.get<VacancyAnalyticsResponse>('/api/v1/investor/analytics/vacancy');
  }

  /**
   * GET /investor/analytics/costs - Kostenanalysen
   */
  async getCostAnalytics(): Promise<CostAnalyticsResponse> {
    return await apiClient.get<CostAnalyticsResponse>('/api/v1/investor/analytics/costs');
  }
}

export const investorService = new InvestorService();
export default investorService;
