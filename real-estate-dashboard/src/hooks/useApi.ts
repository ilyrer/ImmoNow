/**
 * Legacy API Hooks - Deprecated
 * These hooks are kept for backward compatibility but should not be used in new code.
 * Use the new hooks in src/hooks/ instead.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// Legacy hooks for backward compatibility
export const useApi = () => {
  // TODO: Implement legacy API hooks
  return {
    // Mock implementations
    data: null,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};

export const useTasks = (params?: any) => {
  // TODO: Redirect to new useTasks hook
  return useQuery({
    queryKey: ['legacy-tasks', params],
    queryFn: () => Promise.resolve({ tasks: [], total: 0, page: 1, size: 10, pages: 0 }),
    enabled: false, // Disabled to prevent errors
  });
};

export const useCreateTask = () => {
  // TODO: Redirect to new useCreateTask hook
  return useMutation({
    mutationFn: (data: any) => Promise.resolve(data),
  });
};

export const useUpdateTask = () => {
  // TODO: Redirect to new useUpdateTask hook
  return useMutation({
    mutationFn: (data: any) => Promise.resolve(data),
  });
};

export const useMoveTask = () => {
  // TODO: Redirect to new useMoveTask hook
  return useMutation({
    mutationFn: (data: any) => Promise.resolve(data),
  });
};

export const useDeleteTask = () => {
  // TODO: Redirect to new useDeleteTask hook
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(id),
  });
};

export const useEmployees = () => {
  // TODO: Redirect to new useEmployees hook
  return useQuery({
    queryKey: ['legacy-employees'],
    queryFn: () => Promise.resolve([]),
    enabled: false, // Disabled to prevent errors
  });
};

export const useCreateEmployee = () => {
  console.warn("Legacy useCreateEmployee called. Please use specific employee hooks.");
  return useMutation({
    mutationFn: (data: any) => Promise.resolve(data),
  });
};

export const useUpdateEmployee = () => {
  console.warn("Legacy useUpdateEmployee called. Please use specific employee hooks.");
  return useMutation({
    mutationFn: (data: any) => Promise.resolve(data),
  });
};

export const useDeleteEmployee = () => {
  console.warn("Legacy useDeleteEmployee called. Please use specific employee hooks.");
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(id),
  });
};

export const useEmployeeLeaveRequests = (employeeId?: string) => {
  console.warn("Legacy useEmployeeLeaveRequests called. Please use specific employee hooks.");
  return useQuery({
    queryKey: ['legacy-employee-leave-requests', employeeId],
    queryFn: () => Promise.resolve([]),
    enabled: false, // Disabled to prevent errors
  });
};

export const useCreateEmployeeLeaveRequest = (employeeId?: string) => {
  console.warn("Legacy useCreateEmployeeLeaveRequest called. Please use specific employee hooks.");
  return useMutation({
    mutationFn: (data: any) => Promise.resolve(data),
  });
};

export const useProperties = (params?: any) => {
  // TODO: Redirect to new useProperties hook
  return useQuery({
    queryKey: ['legacy-properties', params],
    queryFn: () => Promise.resolve([]),
    enabled: false, // Disabled to prevent errors
  });
};

export const useCreateProperty = () => {
  // TODO: Redirect to new useCreateProperty hook
  return useMutation({
    mutationFn: () => Promise.resolve(),
  });
};

export const useUpdateProperty = () => {
  // TODO: Redirect to new useUpdateProperty hook
  return useMutation({
    mutationFn: () => Promise.resolve(),
  });
};

export const useDeleteProperty = () => {
  // TODO: Redirect to new useDeleteProperty hook
  return useMutation({
    mutationFn: () => Promise.resolve(),
  });
};

export const useAppointments = (params?: any) => {
  // TODO: Redirect to new useAppointments hook
  return useQuery({
    queryKey: ['legacy-appointments', params],
    queryFn: () => Promise.resolve([]),
    enabled: false, // Disabled to prevent errors
  });
};

export const useCreateAppointment = () => {
  // TODO: Redirect to new useCreateAppointment hook
  return useMutation({
    mutationFn: () => Promise.resolve(),
  });
};

export const useUpdateAppointment = () => {
  // TODO: Redirect to new useUpdateAppointment hook
  return useMutation({
    mutationFn: () => Promise.resolve(),
  });
};

export const useDeleteAppointment = () => {
  // TODO: Redirect to new useDeleteAppointment hook
  return useMutation({
    mutationFn: () => Promise.resolve(),
  });
};

// Mock hooks for components that need them
export const useInvestorPortfolioMock = () => {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
};

export const useCIMOverviewMock = () => {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
};

export const useAvmValuationMock = () => {
  return {
    mutateAsync: () => Promise.resolve(),
    isPending: false,
    error: null,
  };
};

export const useCalendarDay = () => {
  return {
    data: null,
    isLoading: false,
    error: null,
  };
};

export const useMutationApi = (mutationFn: (data: any) => Promise<any>, options?: any) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    console.warn(`Legacy useMutationApi call. Please migrate to specific mutation hooks.`);
  }, []);
  return useMutation({
    mutationFn: mutationFn,
    onSuccess: () => {
      // Invalidate all queries to force refetch for legacy compatibility
      queryClient.invalidateQueries();
    },
    ...options,
  });
};

export const useLogin = () => {
  console.warn("Legacy useLogin called. Please use src/contexts/AuthContext.tsx");
  return useMutation({
    mutationFn: async (credentials: any) => { 
      console.log("Legacy login called with:", credentials);
      return { token: "mock-token", user: { tenant_id: "mock-tenant" } };
    }
  });
};

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

export const useCheckout = () => {
  console.warn("Legacy useCheckout called. Please use specific checkout hooks.");
  return useMutation({
    mutationFn: async (data: any) => { 
      console.log("Legacy checkout called with:", data);
      return { success: true };
    }
  });
};

export const useCurrentUser = () => {
  console.warn("Legacy useCurrentUser called. Please use src/contexts/AuthContext.tsx or src/contexts/UserContext.tsx");
  return useQuery({
    queryKey: ['legacy-current-user'],
    queryFn: async () => {
      // Try to get user from apiService
      const apiService = await import('../services/api.service');
      try {
        const user = await apiService.default.getCurrentUser();
        console.log('✅ useCurrentUser loaded:', user.email);
        return user;
      } catch (error) {
        console.error('❌ useCurrentUser error:', error);
        // Fallback to mock user
        return { 
          id: '1', 
          name: 'Test User',
          first_name: 'Test',
          last_name: 'User', 
          email: 'test@example.com',
          role: 'admin',
          tenant_id: 'mock-tenant'
        };
      }
    },
    enabled: true, // ✅ Enable the query!
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDashboardAnalytics = (params?: any) => {
  console.warn("Legacy useDashboardAnalytics called. Please use specific analytics hooks.");
  return useQuery({
    queryKey: ['legacy-dashboard-analytics', params],
    queryFn: () => Promise.resolve({
      totalProperties: 0,
      totalContacts: 0,
      totalTasks: 0,
      totalAppointments: 0
    }),
    enabled: false, // Disabled to prevent errors
  });
};

export const useContacts = (params?: any) => {
  console.warn("Legacy useContacts called. Please use specific contact hooks.");
  return useQuery({
    queryKey: ['legacy-contacts', params],
    queryFn: () => Promise.resolve([]),
    enabled: false, // Disabled to prevent errors
  });
};

export const useCreateContact = () => {
  console.warn("Legacy useCreateContact called. Please use specific contact hooks.");
  return useMutation({
    mutationFn: () => Promise.resolve(),
  });
};

export const useUpdateContact = () => {
  console.warn("Legacy useUpdateContact called. Please use specific contact hooks.");
  return useMutation({
    mutationFn: () => Promise.resolve(),
  });
};

export const useDeleteContact = () => {
  console.warn("Legacy useDeleteContact called. Please use specific contact hooks.");
  return useMutation({
    mutationFn: () => Promise.resolve(),
  });
};

export const useTaskBoard = () => {
  console.warn("Legacy useTaskBoard called. Please use specific task board hooks.");
  return useQuery({
    queryKey: ['legacy-task-board'],
    queryFn: () => Promise.resolve({
      columns: [],
      tasks: [],
      filters: {}
    }),
    enabled: false, // Disabled to prevent errors
  });
};

export const useDefaultBoardColumnsMap = () => {
  console.warn("Legacy useDefaultBoardColumnsMap called. Please use specific kanban hooks.");
  return {
    data: {
      'backlog': { id: 'backlog', title: 'Backlog', color: '#gray' },
      'todo': { id: 'todo', title: 'To Do', color: '#blue' },
      'inProgress': { id: 'inProgress', title: 'In Progress', color: '#yellow' },
      'review': { id: 'review', title: 'Review', color: '#purple' },
      'done': { id: 'done', title: 'Done', color: '#green' }
    },
    isLoading: false,
    error: null
  };
};

export const QUERY_KEYS = {
  tasks: ['tasks'],
  properties: ['properties'],
  appointments: ['appointments'],
  employees: ['employees'],
  contacts: ['contacts'],
  dashboard: ['dashboard'],
  analytics: ['analytics'],
  measures: ['measures'],
  'task-board': ['task-board'],
  'current-user': ['current-user'],
};
