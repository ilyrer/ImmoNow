/**
 * CIM Hooks
 * React Query Hooks für CIM Service
 */

import { useQuery } from '@tanstack/react-query';
import { cimService, CIMOverviewParams } from '../services/cim';
import { CIMOverviewResponse } from '../lib/api/types';

// Query Keys gemäß Backend Contract
export const cimKeys = {
  all: ['cim'] as const,
  overview: (params: CIMOverviewParams) => [...cimKeys.all, 'overview', params] as const,
};

/**
 * Hook für CIM-Übersicht
 */
export const useCIMOverview = (params: CIMOverviewParams = {}) => {
  return useQuery({
    queryKey: cimKeys.overview(params),
    queryFn: () => cimService.getOverview(params),
    staleTime: 120_000, // 2 Minuten Cache
  });
};
