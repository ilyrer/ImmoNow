/**
 * AVM Hooks
 * React Query Hooks für AVM Service
 */

import { useMutation } from '@tanstack/react-query';
import { avmService } from '../services/avm';
import { AvmRequest, AvmResult } from '../lib/api/types';

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
    mutationFn: (payload: AvmRequest) => avmService.valuate(payload),
  });
};
