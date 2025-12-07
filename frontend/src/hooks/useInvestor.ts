/**
 * Investor Hooks
 * React Query Hooks für Investor Service
 */

import { useQuery } from '@tanstack/react-query';
import { investorService } from '../services/investor';
import { InvestorAssetResponse, PortfolioKPIsResponse } from '../lib/api/types';

// Query Keys gemäß Backend Contract
export const investorKeys = {
  all: ['investor'] as const,
  portfolio: () => [...investorKeys.all, 'portfolio'] as const,
};

/**
 * Hook für Investor-Portfolio
 */
export const useInvestorPortfolio = () => {
  return useQuery({
    queryKey: investorKeys.portfolio(),
    queryFn: () => investorService.getPortfolio(),
    staleTime: 300_000, // 5 Minuten Cache
  });
};
