/**
 * AVM Hooks
 * React Query Hooks für AVM Service
 */

import { useMutation } from '@tanstack/react-query';
import { avmService } from '../services/avm';
import { AvmRequest, AvmResponse } from '../lib/api/types';

// Query Keys gemäß Backend Contract
export const avmKeys = {
  all: ['avm'] as const,
  valuate: (payload: AvmRequest) => [...avmKeys.all, 'valuate', JSON.stringify(payload)] as const,
};

/**
 * Hook für AVM-Bewertung
 */
export const useAvmValuation = () => {
  return useMutation({
    mutationFn: async (payload: AvmRequest) => {
      const res = await avmService.valuate(payload);
      // Normalisiere auf bisherige Erwartung der View
      return res;
    },
  });
};
