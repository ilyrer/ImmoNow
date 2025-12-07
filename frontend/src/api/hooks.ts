/**
 * React Query Hooks for API Integration
 * Centralized hooks for all API endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api/client';
import type {
  // Auth Types
  LoginRequest, LoginResponse, RegisterRequest, RegisterResponse,
  RefreshTokenRequest, TokenRefreshResponse, UserResponse, TenantUserInfo,
  
  // Property Types
  PropertyResponse, CreatePropertyRequest, UpdatePropertyRequest,
  
  // Document Types
  DocumentResponse, DocumentFolderResponse, CreateFolderRequest,
  UploadMetadataRequest, UpdateDocumentRequest, DocumentAnalyticsResponse,
  
  // Task Types
  TaskResponse, CreateTaskRequest, UpdateTaskRequest,
  
  // Contact Types
  ContactResponse, CreateContactRequest, UpdateContactRequest,
  
  // Analytics Types
  DashboardAnalyticsResponse, PropertyAnalyticsResponse,
  ContactAnalyticsResponse, TaskAnalyticsResponse,
  
  // Communications Types
  ConversationResponse, CreateConversationRequest, SendMessageRequest,
  UpdateMessageRequest, MarkAsReadRequest,
  
  // Social Types
  SocialAccountResponse, SocialPostResponse, CreatePostRequest,
  UpdatePostRequest, SocialAnalyticsResponse,
  
  // Finance Types
  FinancingCalculationRequest, FinancingCalculationResponse,
  InvestmentAnalysisRequest, InvestmentAnalysisResponse,
  BankComparisonRequest, BankComparisonResponse,
  FinancingScenario, CreateScenarioRequest, UpdateScenarioRequest,
  
  // Plans Types
  PlanResponse,
  
  // Reset Password Types
  ResetPasswordRequest,
  
  // Common Types
  PaginatedResponse
} from './types.gen';

// Query Keys
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
    tenant: ['auth', 'tenant'] as const,
  },
  
  // Properties
  properties: {
    all: ['properties'] as const,
    list: (params?: any) => ['properties', 'list', params] as const,
    detail: (id: string) => ['properties', 'detail', id] as const,
  },
  
  // Documents
  documents: {
    all: ['documents'] as const,
    list: (params?: any) => ['documents', 'list', params] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
    folders: ['documents', 'folders'] as const,
    analytics: ['documents', 'analytics'] as const,
  },
  
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    list: (params?: any) => ['tasks', 'list', params] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
  
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    list: (params?: any) => ['contacts', 'list', params] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
  
  // Analytics
  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
    properties: ['analytics', 'properties'] as const,
    contacts: ['analytics', 'contacts'] as const,
    tasks: ['analytics', 'tasks'] as const,
  },
  
  // Communications
  communications: {
    conversations: ['communications', 'conversations'] as const,
    conversation: (id: string) => ['communications', 'conversation', id] as const,
    messages: (conversationId: string) => ['communications', 'messages', conversationId] as const,
  },
  
  // Social
  social: {
    accounts: ['social', 'accounts'] as const,
    posts: ['social', 'posts'] as const,
    post: (id: string) => ['social', 'post', id] as const,
    analytics: ['social', 'analytics'] as const,
    queue: ['social', 'queue'] as const,
  },
  
  // Finance
  finance: {
    scenarios: ['finance', 'scenarios'] as const,
    scenario: (id: string) => ['finance', 'scenario', id] as const,
  },
  plans: {
    list: () => ['plans'] as const,
  },
};

// Auth Hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (data) => {
      console.log('🔐 useLogin: Starting login request...');
      const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data);
      console.log('✅ useLogin: Login response received:', response);
      
      // Tokens werden NICHT hier gespeichert - das macht der AuthContext
      // Hier nur die Response zurückgeben
      return response;
    },
    onSuccess: (data) => {
      console.log('🎉 useLogin: Login successful, invalidating queries...');
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.tenant });
    },
    onError: (error) => {
      console.error('❌ useLogin: Login failed:', error);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', data);
      
      // Store tokens and tenant info
      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('tenant_id', response.tenant.id);
        localStorage.setItem('authToken', response.access_token);
        localStorage.setItem('refreshToken', response.refresh_token);
        localStorage.setItem('tenantId', response.tenant.id);
        localStorage.setItem('tenantSlug', response.tenant.slug);
        
        // Set in API client
        apiClient.setAuthToken(response.access_token, response.tenant.id);
      }
      
      return response;
    },
    onSuccess: (data) => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.tenant });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.post('/api/v1/auth/logout');
      
      // Clear all tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('tenantSlug');
      
      // Clear API client
      apiClient.clearAuth();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
};

export const useRefreshToken = () => {
  return useMutation<TokenRefreshResponse, Error, RefreshTokenRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<TokenRefreshResponse>('/api/v1/auth/refresh', data);
      
      // Update tokens
      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('authToken', response.access_token);
        
        if (response.tenant) {
          localStorage.setItem('tenant_id', response.tenant.id);
          localStorage.setItem('tenantId', response.tenant.id);
          localStorage.setItem('tenantSlug', response.tenant.slug);
        }
        
        // Set in API client
        const tenantId = localStorage.getItem('tenantId');
        if (tenantId) {
          apiClient.setAuthToken(response.access_token, tenantId);
        } else {
          apiClient.setAuthToken(response.access_token);
        }
      }
      
      return response;
    },
  });
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  
  const loginMutation = useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.tenant });
    },
  });
  
  const registerMutation = useMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', data);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.tenant });
    },
  });
  
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.post('/api/v1/auth/logout');
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
  
  return {
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
};

export const useCurrentUser = (options?: { enabled?: boolean }) => {
  return useQuery<UserResponse>({
    queryKey: queryKeys.auth.me,
    queryFn: () => apiClient.get<UserResponse>('/api/v1/auth/me'),
    enabled: options?.enabled ?? true, // Standard: enabled, aber kann überschrieben werden
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Bei 401 Fehlern nicht retry
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useCurrentTenant = (options?: { enabled?: boolean }) => {
  return useQuery<TenantUserInfo>({
    queryKey: queryKeys.auth.tenant,
    queryFn: () => apiClient.get<TenantUserInfo>('/api/v1/auth/me/tenant'),
    enabled: options?.enabled ?? true, // Standard: enabled, aber kann überschrieben werden
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Bei 401 Fehlern nicht retry
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Property Hooks
export const useProperties = (params?: any) => {
  return useQuery<PaginatedResponse<PropertyResponse>>({
    queryKey: queryKeys.properties.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<PropertyResponse>>('/api/v1/properties', { params }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useProperty = (id: string) => {
  return useQuery<PropertyResponse>({
    queryKey: queryKeys.properties.detail(id),
    queryFn: () => apiClient.get<PropertyResponse>(`/api/v1/properties/${id}`),
    enabled: !!id,
  });
};

export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation<PropertyResponse, Error, CreatePropertyRequest>({
    mutationFn: async (data) => {
      return apiClient.post<PropertyResponse>('/api/v1/properties', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    },
  });
};

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation<PropertyResponse, Error, { id: string; data: UpdatePropertyRequest }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.put<PropertyResponse>(`/api/v1/properties/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/api/v1/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    },
  });
};

// Document Hooks
export const useDocuments = (params?: any) => {
  return useQuery<PaginatedResponse<DocumentResponse>>({
    queryKey: queryKeys.documents.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<DocumentResponse>>('/api/v1/documents', { params }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDocumentFolders = () => {
  return useQuery<DocumentFolderResponse[]>({
    queryKey: queryKeys.documents.folders,
    queryFn: () => apiClient.get<DocumentFolderResponse[]>('/api/v1/documents/folders'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDocumentAnalytics = () => {
  return useQuery<DocumentAnalyticsResponse>({
    queryKey: queryKeys.documents.analytics,
    queryFn: () => apiClient.get<DocumentAnalyticsResponse>('/api/v1/documents/analytics'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation<DocumentResponse, Error, { file: File; metadata: UploadMetadataRequest }>({
    mutationFn: async ({ file, metadata }) => {
      return apiClient.uploadFile<DocumentResponse>('/api/v1/documents/upload', file, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.analytics });
    },
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation<DocumentFolderResponse, Error, CreateFolderRequest>({
    mutationFn: async (data) => {
      return apiClient.post<DocumentFolderResponse>('/api/v1/documents/folders', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.folders });
    },
  });
};

// Task Hooks
export const useTasks = (params?: any) => {
  return useQuery<PaginatedResponse<TaskResponse>>({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<TaskResponse>>('/api/v1/tasks', { params }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation<TaskResponse, Error, CreateTaskRequest>({
    mutationFn: async (data) => {
      return apiClient.post<TaskResponse>('/api/v1/tasks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation<TaskResponse, Error, { id: string; data: UpdateTaskRequest }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.put<TaskResponse>(`/api/v1/tasks/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

// Contact Hooks
export const useContacts = (params?: any) => {
  return useQuery<PaginatedResponse<ContactResponse>>({
    queryKey: queryKeys.contacts.list(params),
    queryFn: () => apiClient.get<PaginatedResponse<ContactResponse>>('/api/v1/contacts', { params }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useContact = (id: string) => {
  return useQuery<ContactResponse>({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => apiClient.get<ContactResponse>(`/api/v1/contacts/${id}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!id, // Only fetch if id is provided
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ContactResponse, Error, CreateContactRequest>({
    mutationFn: async (data) => {
      return apiClient.post<ContactResponse>('/api/v1/contacts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ContactResponse, Error, { id: string; data: UpdateContactRequest }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.put<ContactResponse>(`/api/v1/contacts/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

// Analytics Hooks
export const useDashboardAnalytics = (startDate?: string, endDate?: string) => {
  return useQuery<DashboardAnalyticsResponse>({
    queryKey: [...queryKeys.analytics.dashboard, startDate, endDate],
    queryFn: () => apiClient.get<DashboardAnalyticsResponse>('/api/v1/analytics/dashboard', {
      params: { start_date: startDate, end_date: endDate }
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePropertyAnalytics = (startDate?: string, endDate?: string) => {
  return useQuery<PropertyAnalyticsResponse>({
    queryKey: [...queryKeys.analytics.properties, startDate, endDate],
    queryFn: () => apiClient.get<PropertyAnalyticsResponse>('/api/v1/analytics/properties', {
      params: { start_date: startDate, end_date: endDate }
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useContactAnalytics = (startDate?: string, endDate?: string) => {
  return useQuery<ContactAnalyticsResponse>({
    queryKey: [...queryKeys.analytics.contacts, startDate, endDate],
    queryFn: () => apiClient.get<ContactAnalyticsResponse>('/api/v1/analytics/contacts', {
      params: { start_date: startDate, end_date: endDate }
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTaskAnalytics = (startDate?: string, endDate?: string) => {
  return useQuery<TaskAnalyticsResponse>({
    queryKey: [...queryKeys.analytics.tasks, startDate, endDate],
    queryFn: () => apiClient.get<TaskAnalyticsResponse>('/api/v1/analytics/tasks', {
      params: { start_date: startDate, end_date: endDate }
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Communications Hooks
export const useConversations = (params?: any) => {
  return useQuery<PaginatedResponse<ConversationResponse>>({
    queryKey: [...queryKeys.communications.conversations, params],
    queryFn: () => apiClient.get<PaginatedResponse<ConversationResponse>>('/api/v1/communications/conversations', { params }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ConversationResponse, Error, CreateConversationRequest>({
    mutationFn: async (data) => {
      return apiClient.post<ConversationResponse>('/api/v1/communications/conversations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.conversations });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, SendMessageRequest>({
    mutationFn: async (data) => {
      return apiClient.post(`/api/v1/communications/conversations/${data.conversation_id}/messages`, data);
    },
    onSuccess: (_, { conversation_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.messages(conversation_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.conversations });
    },
  });
};

// Social Hooks
export const useSocialAccounts = (platform?: string) => {
  return useQuery<SocialAccountResponse[]>({
    queryKey: [...queryKeys.social.accounts, platform],
    queryFn: () => apiClient.get<SocialAccountResponse[]>('/api/v1/social/accounts', {
      params: { platform }
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSocialPosts = (params?: any) => {
  return useQuery<PaginatedResponse<SocialPostResponse>>({
    queryKey: [...queryKeys.social.posts, params],
    queryFn: () => apiClient.get<PaginatedResponse<SocialPostResponse>>('/api/v1/social/posts', { params }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateSocialPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation<SocialPostResponse, Error, CreatePostRequest>({
    mutationFn: async (data) => {
      return apiClient.post<SocialPostResponse>('/api/v1/social/posts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.social.posts });
    },
  });
};

export const useSocialAnalytics = (startDate?: string, endDate?: string, platform?: string) => {
  return useQuery<SocialAnalyticsResponse>({
    queryKey: [...queryKeys.social.analytics, startDate, endDate, platform],
    queryFn: () => apiClient.get<SocialAnalyticsResponse>('/api/v1/social/analytics', {
      params: { start_date: startDate, end_date: endDate, platform }
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Finance Hooks
export const useFinancingCalculation = () => {
  return useMutation<FinancingCalculationResponse, Error, FinancingCalculationRequest>({
    mutationFn: async (data) => {
      return apiClient.post<FinancingCalculationResponse>('/api/v1/finance/calculate', data);
    },
  });
};

export const useInvestmentAnalysis = () => {
  return useMutation<InvestmentAnalysisResponse, Error, InvestmentAnalysisRequest>({
    mutationFn: async (data) => {
      return apiClient.post<InvestmentAnalysisResponse>('/api/v1/finance/analyze-investment', data);
    },
  });
};

export const useBankComparison = () => {
  return useMutation<BankComparisonResponse, Error, BankComparisonRequest>({
    mutationFn: async (data) => {
      return apiClient.post<BankComparisonResponse>('/api/v1/finance/compare-banks', data);
    },
  });
};

export const useFinancingScenarios = (params?: any) => {
  return useQuery<PaginatedResponse<FinancingScenario>>({
    queryKey: [...queryKeys.finance.scenarios, params],
    queryFn: () => apiClient.get<PaginatedResponse<FinancingScenario>>('/api/v1/finance/scenarios', { params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateFinancingScenario = () => {
  const queryClient = useQueryClient();
  
  return useMutation<FinancingScenario, Error, CreateScenarioRequest>({
    mutationFn: async (data) => {
      return apiClient.post<FinancingScenario>('/api/v1/finance/scenarios', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.scenarios });
    },
  });
};

export const useUpdateFinancingScenario = () => {
  const queryClient = useQueryClient();
  
  return useMutation<FinancingScenario, Error, { id: string; data: UpdateScenarioRequest }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.put<FinancingScenario>(`/api/v1/finance/scenarios/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.scenario(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.scenarios });
    },
  });
};

// Plans Hooks
export const usePlans = () => {
  return useQuery<PlanResponse[]>({
    queryKey: queryKeys.plans.list(),
    queryFn: () => apiClient.get<PlanResponse[]>('/api/v1/plans'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Reset Password Hooks
export const useResetPassword = () => {
  return useMutation<void, Error, ResetPasswordRequest>({
    mutationFn: async (data) => {
      await apiClient.post('/api/v1/auth/reset-password', data);
    },
  });
};

// Delete Contact Hook
export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/api/v1/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list() });
    },
  });
};