/**
 * Legacy API Hooks - Deprecated
 * These hooks are kept for backward compatibility but should not be used in new code.
 * Use the new hooks in src/hooks/ instead.
 */

import { useQuery, useMutation } from '@tanstack/react-query';

// Mock API hooks for backward compatibility
export const useForgotPassword = () => {
  console.warn("Legacy useForgotPassword called. Please use src/contexts/AuthContext.tsx");
  return useMutation({
    mutationFn: async (email: string) => { 
      console.log("Legacy forgot password called with:", email);
      return { success: true };
    }
  });
};

export const usePlans = () => {
  console.warn("Legacy usePlans called. Please use specific plan hooks.");
  return { data: { plans: [] }, isLoading: false, error: null };
};

export const useResetPassword = () => {
  console.warn("Legacy useResetPassword called. Please use src/contexts/AuthContext.tsx");
  return useMutation({
    mutationFn: async (data: any) => { 
      console.log("Legacy reset password called with:", data);
      return { success: true };
    }
  });
};

export const useCheckout = () => {
  console.warn("Legacy useCheckout called. Please use specific checkout hooks.");
  return useMutation({
    mutationFn: async (data: any) => { 
      console.log("Legacy checkout called with:", data);
      return { success: true };
    }
  });
};

export const useApiHooks = () => {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
};

export const useApiServices = () => {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
};

// Legacy dashboard overview hooks - for backward compatibility
export const useProjectOverview = () => {
  console.warn("Legacy useProjectOverview called. Use modern analytics hooks instead.");
  return useQuery({
    queryKey: ['legacy-project-overview'],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
};

export const useTaskOverview = () => {
  console.warn("Legacy useTaskOverview called. Use modern task hooks instead.");
  return useQuery({
    queryKey: ['legacy-task-overview'],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
};

export const useTeamOverview = () => {
  console.warn("Legacy useTeamOverview called. Use modern team hooks instead.");
  return useQuery({
    queryKey: ['legacy-team-overview'],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
};

export const usePropertyOverview = () => {
  console.warn("Legacy usePropertyOverview called. Use modern property hooks instead.");
  return useQuery({
    queryKey: ['legacy-property-overview'],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
};

export const useDeadlineOverview = () => {
  console.warn("Legacy useDeadlineOverview called. Use modern deadline hooks instead.");
  return useQuery({
    queryKey: ['legacy-deadline-overview'],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
};

export const useActivityStats = () => {
  console.warn("Legacy useActivityStats called. Use modern analytics hooks instead.");
  return useQuery({
    queryKey: ['legacy-activity-stats'],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
};

export const usePerformanceOverview = () => {
  console.warn("Legacy usePerformanceOverview called. Use modern performance hooks instead.");
  return useQuery({
    queryKey: ['legacy-performance-overview'],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
};

export default {
  useApiHooks,
  useApiServices,
};
