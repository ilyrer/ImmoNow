/**
 * Investor Hooks - Enterprise Edition
 * Comprehensive React Query hooks for investor features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investorService, GenerateReportRequest, ReservePackageRequest, ROISimulationRequest } from '../services/investor';

// Query Keys
export const investorKeys = {
  all: ['investor'] as const,
  portfolio: () => [...investorKeys.all, 'portfolio'] as const,
  positions: () => [...investorKeys.all, 'positions'] as const,
  performance: (range: string) => [...investorKeys.all, 'performance', range] as const,
  vacancyAnalytics: () => [...investorKeys.all, 'analytics', 'vacancy'] as const,
  costAnalytics: () => [...investorKeys.all, 'analytics', 'costs'] as const,
  reports: () => [...investorKeys.all, 'reports'] as const,
  marketplacePackages: () => [...investorKeys.all, 'marketplace', 'packages'] as const,
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

/**
 * Hook für Investor-Positionen
 */
export const useInvestorPositions = () => {
  return useQuery({
    queryKey: investorKeys.positions(),
    queryFn: () => investorService.getPositions(),
    staleTime: 300_000,
  });
};

/**
 * Hook für Performance-Daten
 */
export const useInvestorPerformance = (range: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return useQuery({
    queryKey: investorKeys.performance(range),
    queryFn: () => investorService.getPerformance(range),
    staleTime: 300_000,
  });
};

/**
 * Hook für Leerstand-Analytics
 */
export const useVacancyAnalytics = () => {
  return useQuery({
    queryKey: investorKeys.vacancyAnalytics(),
    queryFn: () => investorService.getVacancyAnalytics(),
    staleTime: 600_000, // 10 Minuten Cache
  });
};

/**
 * Hook für Kosten-Analytics
 */
export const useCostAnalytics = () => {
  return useQuery({
    queryKey: investorKeys.costAnalytics(),
    queryFn: () => investorService.getCostAnalytics(),
    staleTime: 600_000,
  });
};

/**
 * Hook für Reports-Liste
 */
export const useInvestorReports = () => {
  return useQuery({
    queryKey: investorKeys.reports(),
    queryFn: () => investorService.getReports(),
    staleTime: 300_000,
  });
};

/**
 * Hook für Report-Generierung
 */
export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateReportRequest) => investorService.generateReport(request),
    onSuccess: () => {
      // Invalidate reports list
      queryClient.invalidateQueries({ queryKey: investorKeys.reports() });
    },
  });
};

/**
 * Hook für Marketplace-Packages
 */
export const useMarketplacePackages = () => {
  return useQuery({
    queryKey: investorKeys.marketplacePackages(),
    queryFn: () => investorService.getMarketplacePackages(),
    staleTime: 600_000,
  });
};

/**
 * Hook für Package-Reservierung
 */
export const useReservePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, request }: { packageId: string; request: ReservePackageRequest }) =>
      investorService.reservePackage(packageId, request),
    onSuccess: () => {
      // Invalidate packages list
      queryClient.invalidateQueries({ queryKey: investorKeys.marketplacePackages() });
    },
  });
};

/**
 * Hook für ROI-Simulation
 */
export const useROISimulation = () => {
  return useMutation({
    mutationFn: (request: ROISimulationRequest) => investorService.simulateROI(request),
  });
};
