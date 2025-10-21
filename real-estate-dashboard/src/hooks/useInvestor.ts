/**
 * Investor Hooks
 * React Query Hooks für Investor Service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investorService } from '../services/investor';
import { 
  InvestorAssetResponse, 
  PortfolioKPIsResponse, 
  InvestorReportResponse, 
  MarketplacePackageResponse, 
  ROISimulationResponse,
  SavedSimulationResponse,
  VacancyAnalyticsResponse,
  CostAnalyticsResponse
} from '../lib/api/types';
import { toast } from 'react-hot-toast';

// Query Keys gemäß Backend Contract
export const investorKeys = {
  all: ['investor'] as const,
  portfolio: () => [...investorKeys.all, 'portfolio'] as const,
  positions: () => [...investorKeys.all, 'positions'] as const,
  performance: (period?: string) => [...investorKeys.all, 'performance', period] as const,
  analytics: (type?: string) => [...investorKeys.all, 'analytics', type] as const,
  reports: () => [...investorKeys.all, 'reports'] as const,
  marketplace: () => [...investorKeys.all, 'marketplace'] as const,
  simulations: () => [...investorKeys.all, 'simulations'] as const,
  vacancyAnalytics: () => [...investorKeys.all, 'analytics', 'vacancy'] as const,
  costAnalytics: () => [...investorKeys.all, 'analytics', 'costs'] as const,
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
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Performance-Daten
 */
export const useInvestorPerformance = (period: string = 'month') => {
  return useQuery({
    queryKey: investorKeys.performance(period),
    queryFn: () => investorService.getPerformance(period),
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Analytics-Daten
 */
export const useInvestorAnalytics = (type: string = 'vacancy') => {
  return useQuery({
    queryKey: investorKeys.analytics(type),
    queryFn: () => investorService.getAnalytics(type),
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Investor-Reports
 */
export const useInvestorReports = () => {
  return useQuery({
    queryKey: investorKeys.reports(),
    queryFn: () => investorService.getReports(),
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Report-Generierung
 */
export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      report_type: string;
      period_start: string;
      period_end: string;
      include_charts?: boolean;
      include_recommendations?: boolean;
    }) => investorService.generateReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investorKeys.reports() });
      toast.success('Report wird generiert...');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Generieren: ${error.message}`);
    },
  });
};

/**
 * Hook für Marketplace-Pakete
 */
export const useMarketplacePackages = () => {
  return useQuery({
    queryKey: investorKeys.marketplace(),
    queryFn: () => investorService.getMarketplacePackages(),
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Paket-Reservierung
 */
export const useReservePackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: { investment_amount: number; contact_preference?: string } }) =>
      investorService.reservePackage(packageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investorKeys.marketplace() });
      toast.success('Paket erfolgreich reserviert');
    },
    onError: (error: any) => {
      toast.error(`Fehler bei Reservierung: ${error.message}`);
    },
  });
};

/**
 * Hook für ROI-Simulation
 */
export const useROISimulation = () => {
  return useMutation({
    mutationFn: (data: {
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
    }) => investorService.simulateROI(data),
    onSuccess: () => {
      toast.success('Simulation erfolgreich berechnet');
    },
    onError: (error: any) => {
      toast.error(`Fehler bei Simulation: ${error.message}`);
    },
  });
};

/**
 * Hook für Investor-Statistiken
 */
export const useInvestorStats = () => {
  const { data: portfolio } = useInvestorPortfolio();
  const { data: reports } = useInvestorReports();
  const { data: packages } = useMarketplacePackages();
  
  const totalValue = portfolio?.kpis?.total_value || 0;
  const averageROI = portfolio?.kpis?.average_roi || 0;
  const totalCashflow = portfolio?.kpis?.total_cashflow || 0;
  const assetCount = portfolio?.kpis?.asset_count || 0;
  const reportCount = reports?.length || 0;
  const availablePackages = packages?.filter(pkg => pkg.status === 'available').length || 0;
  
  return {
    totalValue,
    averageROI,
    totalCashflow,
    assetCount,
    reportCount,
    availablePackages,
    isLoading: !portfolio || !reports || !packages
  };
};

/**
 * Hook für gespeicherte Simulationen
 */
export const useSavedSimulations = () => {
  return useQuery({
    queryKey: investorKeys.simulations(),
    queryFn: () => investorService.getSavedSimulations(),
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Simulation speichern
 */
export const useSaveSimulation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
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
    }) => investorService.saveSimulation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investorKeys.simulations() });
      toast.success('Simulation erfolgreich gespeichert');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Speichern: ${error.message}`);
    },
  });
};

/**
 * Hook für Simulation löschen
 */
export const useDeleteSimulation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => investorService.deleteSimulation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investorKeys.simulations() });
      toast.success('Simulation erfolgreich gelöscht');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });
};

/**
 * Hook für Leerstandsanalysen
 */
export const useVacancyAnalytics = () => {
  return useQuery({
    queryKey: investorKeys.vacancyAnalytics(),
    queryFn: () => investorService.getVacancyAnalytics(),
    staleTime: 300_000, // 5 Minuten Cache
  });
};

/**
 * Hook für Kostenanalysen
 */
export const useCostAnalytics = () => {
  return useQuery({
    queryKey: investorKeys.costAnalytics(),
    queryFn: () => investorService.getCostAnalytics(),
    staleTime: 300_000, // 5 Minuten Cache
  });
};
