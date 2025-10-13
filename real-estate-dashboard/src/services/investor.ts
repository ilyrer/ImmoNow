/**
 * Investor Service
 * Implementiert alle Investor-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
import {
  InvestorAssetResponse,
  PortfolioKPIsResponse
} from '../lib/api/types';

class InvestorService {
  /**
   * GET /investor/portfolio - Portfolio-Daten
   */
  async getPortfolio(): Promise<{
    assets: InvestorAssetResponse[];
    kpis: PortfolioKPIsResponse;
  }> {
    const response = await apiClient.get<{
      assets: InvestorAssetResponse[];
      kpis: PortfolioKPIsResponse;
    }>('/investor/portfolio');
    return response;
  }
}

export const investorService = new InvestorService();
export default investorService;
