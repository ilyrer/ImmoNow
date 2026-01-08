/**
 * React Query Hooks for API Integration
 * Centralized hooks for all API endpoints
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './config';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';
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
    channels: ['communications', 'channels'] as const,
    channelMessages: (channelId: string, params?: any) => ['communications', 'channels', channelId, params] as const,
    search: (query: string) => ['communications', 'search', query] as const,
  },

  // Social
  social: {
    accounts: ['social', 'accounts'] as const,
    posts: ['social', 'posts'] as const,
    post: (id: string) => ['social', 'post', id] as const,
    analytics: ['social', 'analytics'] as const,
    queue: ['social', 'queue'] as const,
    platforms: ['social', 'platforms'] as const,
    rateLimits: ['social', 'rate-limits'] as const,
    dashboard: ['social', 'dashboard'] as const,
  },

  // Property Auto-Publish
  autoPublish: {
    settings: (propertyId: string) => ['auto-publish', 'settings', propertyId] as const,
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
      logger.debug('Starting login request', 'useLogin');
      const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data);
      logger.debug('Login response received', 'useLogin');

      // Tokens werden NICHT hier gespeichert - das macht der AuthContext
      // Hier nur die Response zurückgeben
      return response;
    },
    onSuccess: (data) => {
      logger.info('Login successful, invalidating queries', 'useLogin');
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.tenant });
    },
    onError: (error) => {
      logger.error('Login failed', 'useLogin', error);
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
        storage.set('auth_token', response.access_token);
        storage.set('tenant_id', response.tenant.id);
        storage.set('authToken', response.access_token);
        storage.set('refreshToken', response.refresh_token);
        storage.set('tenantId', response.tenant.id);
        storage.set('tenantSlug', response.tenant.slug);

        // Set in API client
        apiClient.setAuthToken(response.access_token, response.tenant.id);
        logger.info('Login successful', 'useLogin', { tenantId: response.tenant.id });
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
      storage.remove('auth_token');
      storage.remove('tenant_id');
      storage.remove('authToken');
      storage.remove('refreshToken');
      storage.remove('tenantId');
      storage.remove('tenantSlug');

      // Clear API client
      apiClient.clearAuth();
      logger.info('Logout successful', 'useLogout');
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
        storage.set('auth_token', response.access_token);
        storage.set('authToken', response.access_token);

        if (response.tenant) {
          storage.set('tenant_id', response.tenant.id);
          storage.set('tenantId', response.tenant.id);
          storage.set('tenantSlug', response.tenant.slug);
        }

        // Set in API client
        const tenantId = storage.get<string>('tenantId');
        if (tenantId) {
          apiClient.setAuthToken(response.access_token, tenantId);
        } else {
          apiClient.setAuthToken(response.access_token);
        }
        logger.debug('Token refreshed', 'useRefreshToken');
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

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return apiClient.delete(`/api/v1/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

// Lead Score & AI Insights Hooks
export const useLeadScore = (contactId: string) => {
  return useQuery<any>({
    queryKey: ['contacts', 'lead-score', contactId],
    queryFn: () => apiClient.get(`/api/v1/contacts/${contactId}/lead-score`),
    staleTime: 5 * 60 * 1000, // 5 minutes - score calculation is resource-intensive
    enabled: !!contactId,
  });
};

export const useAiInsights = (contactId: string) => {
  return useQuery<any>({
    queryKey: ['contacts', 'ai-insights', contactId],
    queryFn: () => apiClient.get(`/api/v1/contacts/${contactId}/ai-insights`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!contactId,
  });
};

export const useNextAction = (contactId: string, goal?: string) => {
  return useQuery<any>({
    queryKey: ['contacts', 'next-action', contactId, goal],
    queryFn: () => apiClient.post(`/api/v1/contacts/${contactId}/next-action`, { goal }),
    staleTime: 1 * 60 * 1000, // 1 minute - recommendations should be fresh
    enabled: !!contactId,
  });
};

export const useComposeEmail = () => {
  return useMutation<any, Error, { contactId: string; goal: string }>({
    mutationFn: async ({ contactId, goal }) => {
      return apiClient.post(`/api/v1/contacts/${contactId}/compose-email`, { goal });
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

// Communications Hooks (Channels/Messages)
export type ChannelMember = { user_id: string; role: string; joined_at: string };
export type Channel = {
  id: string;
  name: string;
  topic?: string | null;
  team_id?: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  members: ChannelMember[];
};

export type Attachment = {
  id: string;
  file_url: string;
  file_name: string;
  file_type?: string | null;
  file_size?: number | null;
  created_at: string;
};

export type ResourceLink = {
  id: string;
  resource_type: 'contact' | 'property';
  resource_id: string;
  label?: string | null;
  created_at: string;
};

export type Reaction = { id: string; emoji: string; user_id: string; created_at: string };

export type ChannelMessage = {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
  has_attachments: boolean;
  is_deleted: boolean;
  edited_at?: string | null;
  created_at: string;
  updated_at: string;
  attachments: Attachment[];
  reactions: Reaction[];
  resource_links: ResourceLink[];
};

export const useChannels = (params?: any) => {
  return useQuery<Channel[]>({
    queryKey: [...queryKeys.communications.channels, params],
    queryFn: () => apiClient.get<Channel[]>('/api/v1/communications/channels', { params }),
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation<Channel, Error, { name: string; topic?: string; team_id?: string; is_private?: boolean; member_ids?: string[] }>({
    mutationFn: async (data) => apiClient.post<Channel>('/api/v1/communications/channels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channels });
    },
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation<Channel, Error, { id: string; data: { name?: string; topic?: string; is_private?: boolean } }>({
    mutationFn: async ({ id, data }) => apiClient.patch<Channel>(`/api/v1/communications/channels/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channels });
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channelMessages(id) });
    },
  });
};

export const useDeleteChannel = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => apiClient.delete(`/api/v1/communications/channels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channels });
    },
  });
};

export const useAddChannelMember = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { channel_id: string; user_id: string; role?: string }>({
    mutationFn: async ({ channel_id, user_id, role = 'member' }) =>
      apiClient.post(`/api/v1/communications/channels/${channel_id}/members`, { user_id, role }),
    onSuccess: (_, { channel_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channels });
    },
  });
};

export const useUpdateChannelMember = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { channel_id: string; member_user_id: string; role: string }>({
    mutationFn: async ({ channel_id, member_user_id, role }) =>
      apiClient.patch(`/api/v1/communications/channels/${channel_id}/members/${member_user_id}`, { role }),
    onSuccess: (_, { channel_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channels });
    },
  });
};

export const useRemoveChannelMember = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { channel_id: string; member_user_id: string }>({
    mutationFn: async ({ channel_id, member_user_id }) =>
      apiClient.delete(`/api/v1/communications/channels/${channel_id}/members/${member_user_id}`),
    onSuccess: (_, { channel_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channels });
    },
  });
};

export const useChannelMessages = (channelId: string, params?: any) => {
  return useQuery<PaginatedResponse<ChannelMessage>>({
    queryKey: queryKeys.communications.channelMessages(channelId, params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<ChannelMessage>>(`/api/v1/communications/channels/${channelId}/messages`, {
        params,
      }),
    enabled: !!channelId,
    staleTime: 30 * 1000,
  });
};

export const useSendChannelMessage = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ChannelMessage,
    Error,
    { channel_id: string; content: string; parent_id?: string; attachments?: any[]; resource_links?: any[] }
  >({
    mutationFn: async ({ channel_id, ...rest }) =>
      apiClient.post<ChannelMessage>(`/api/v1/communications/channels/${channel_id}/messages`, rest),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channelMessages(variables.channel_id) });
    },
  });
};

export const useEditChannelMessage = () => {
  const queryClient = useQueryClient();
  return useMutation<ChannelMessage, Error, { message_id: string; content: string; channel_id: string }>({
    mutationFn: async ({ message_id, content }) => apiClient.patch<ChannelMessage>(`/api/v1/communications/messages/${message_id}`, { content }),
    onSuccess: (_, { channel_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channelMessages(channel_id) });
    },
  });
};

export const useDeleteChannelMessage = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { message_id: string; channel_id: string }>({
    mutationFn: async ({ message_id }) => apiClient.delete(`/api/v1/communications/messages/${message_id}`),
    onSuccess: (_, { channel_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channelMessages(channel_id) });
    },
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();
  return useMutation<ChannelMessage, Error, { message_id: string; emoji: string; channel_id: string }>({
    mutationFn: async ({ message_id, emoji }) =>
      apiClient.post<ChannelMessage>(`/api/v1/communications/messages/${message_id}/reactions`, { emoji }),
    onSuccess: (_, { channel_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channelMessages(channel_id) });
    },
  });
};

export const useRemoveReaction = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { message_id: string; emoji: string; channel_id: string }>({
    mutationFn: async ({ message_id, emoji }) =>
      apiClient.delete(`/api/v1/communications/messages/${message_id}/reactions`, { params: { emoji } }),
    onSuccess: (_, { channel_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communications.channelMessages(channel_id) });
    },
  });
};

export const useSearchMessages = (query: string) => {
  return useQuery<any>({
    queryKey: queryKeys.communications.search(query),
    queryFn: () => apiClient.get(`/api/v1/communications/search`, { params: { q: query } }),
    enabled: !!query,
    staleTime: 30 * 1000,
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

export const useSocialAnalytics = (period?: string, platform?: string) => {
  return useQuery<SocialAnalyticsResponse>({
    queryKey: [...queryKeys.social.analytics, period, platform],
    queryFn: () => apiClient.get<SocialAnalyticsResponse>('/api/v1/social/analytics', {
      params: { period, platform }
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// ============================================================================
// SocialHub Dashboard Stats Hook
// ============================================================================

interface DashboardStats {
  connected_accounts: number;
  published_posts: number;
  scheduled_posts: number;
  pending_posts: number;
  total_reach: number;
  engagement_rate: number;
  reach_change: number;
  posts_change: number;
  engagement_change: number;
}

interface RecentActivityItem {
  type: 'post_published' | 'post_scheduled' | 'account_connected';
  title: string;
  description: string;
  time: string;
  platform?: string;
}

interface DashboardResponse {
  stats: DashboardStats;
  recent_activities: RecentActivityItem[];
}

/**
 * Hook to get SocialHub dashboard statistics
 */
export const useSocialHubDashboard = () => {
  return useQuery<DashboardResponse>({
    queryKey: queryKeys.social.dashboard,
    queryFn: () => apiClient.get<DashboardResponse>('/api/v1/social/dashboard'),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};

// ============================================================================
// OAuth Hooks
// ============================================================================

interface OAuthInitResponse {
  authorization_url: string;
  state: string;
  platform: string;
}

interface OAuthCallbackRequest {
  code: string;
  state: string;
}

interface OAuthCallbackResponse {
  success: boolean;
  account_id: string;
  platform: string;
  account_name: string;
  message: string;
}

interface OAuthPlatform {
  platform: string;
  display_name: string;
  is_configured: boolean;
  scopes: string[];
  category: 'social_media' | 'real_estate';
}

interface OAuthPlatformsResponse {
  platforms: OAuthPlatform[];
  configured_count: number;
  total_count: number;
}

interface RateLimitStatus {
  platform: string;
  hourly_limit: number;
  daily_limit: number;
  hourly_used: number;
  daily_used: number;
  is_limited: boolean;
  available_tokens: number;
}

/**
 * Hook to initiate OAuth flow for a platform
 */
export const useInitOAuth = () => {
  return useMutation<OAuthInitResponse, Error, { platform: string; accountLabel?: string }>({
    mutationFn: async ({ platform, accountLabel }) => {
      const params: Record<string, string> = {};
      if (accountLabel) params.account_label = accountLabel;

      return apiClient.get<OAuthInitResponse>(`/api/v1/social/oauth/${platform}/init`, { params });
    },
  });
};

/**
 * Hook to process OAuth callback
 */
export const useOAuthCallback = () => {
  const queryClient = useQueryClient();

  return useMutation<OAuthCallbackResponse, Error, OAuthCallbackRequest>({
    mutationFn: async (data) => {
      return apiClient.post<OAuthCallbackResponse>('/api/v1/social/oauth/callback', data);
    },
    onSuccess: () => {
      // Invalidate social accounts to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.social.accounts });
    },
  });
};

/**
 * Hook to get available OAuth platforms
 */
export const useOAuthPlatforms = () => {
  return useQuery<OAuthPlatformsResponse>({
    queryKey: queryKeys.social.platforms,
    queryFn: () => apiClient.get<OAuthPlatformsResponse>('/api/v1/social/oauth/platforms'),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to get rate limit status
 */
export const useRateLimitStatus = (platform?: string) => {
  return useQuery<RateLimitStatus[]>({
    queryKey: [...queryKeys.social.rateLimits, platform],
    queryFn: () => apiClient.get<RateLimitStatus[]>('/api/v1/social/rate-limits', {
      params: platform ? { platform } : {}
    }),
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Hook to disconnect a social account
 */
export const useDisconnectSocialAccount = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (accountId) => {
      await apiClient.delete(`/api/v1/social/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.social.accounts });
    },
  });
};

// ============================================================================
// Property Auto-Publish Hooks
// ============================================================================

interface AutoPublishSettings {
  property_id?: string;
  auto_publish_enabled: boolean;
  auto_publish_portals: string[];
  last_auto_publish?: string | null;
}

interface UpdateAutoPublishRequest {
  auto_publish_enabled?: boolean;
  auto_publish_portals?: string[];
}

interface PushPropertyResponse {
  success: boolean;
  message: string;
  jobs_created: number;
  portals: string[];
}

/**
 * Hook to get auto-publish settings for a property
 */
export const useAutoPublishSettings = (propertyId: string) => {
  return useQuery<AutoPublishSettings>({
    queryKey: queryKeys.autoPublish.settings(propertyId),
    queryFn: () => apiClient.get<AutoPublishSettings>(`/api/v1/publishing/properties/${propertyId}/auto-publish`),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update auto-publish settings for a property
 */
export const useUpdateAutoPublishSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<AutoPublishSettings, Error, { propertyId: string; data: UpdateAutoPublishRequest }>({
    mutationFn: async ({ propertyId, data }) => {
      return apiClient.put<AutoPublishSettings>(`/api/v1/publishing/properties/${propertyId}/auto-publish`, data);
    },
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.autoPublish.settings(propertyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.detail(propertyId) });
    },
  });
};

/**
 * Hook to push property to portals immediately
 */
export const usePushPropertyToPortals = () => {
  const queryClient = useQueryClient();

  return useMutation<PushPropertyResponse, Error, { propertyId: string; portals?: string[] }>({
    mutationFn: async ({ propertyId, portals }) => {
      return apiClient.post<PushPropertyResponse>(`/api/v1/publishing/properties/${propertyId}/push-now`, {
        portals: portals || ['immoscout24']
      });
    },
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.autoPublish.settings(propertyId) });
    },
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

// ============================================================================
// SocialHub Scheduler & Queue Hooks
// ============================================================================

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduled_at: string;
  status: 'scheduled' | 'published' | 'failed';
  media_urls?: string[];
  created_at: string;
}

interface QueueItem {
  id: string;
  content: string;
  platforms: string[];
  scheduled_at: string;
  status: 'queued' | 'processing' | 'published' | 'failed';
  priority?: 'high' | 'medium' | 'low';
  retry_count: number;
  error?: string;
  created_at: string;
}

/**
 * Hook to get scheduled posts
 */
export const useScheduledPosts = () => {
  return useQuery<ScheduledPost[]>({
    queryKey: [...queryKeys.social.posts, 'scheduled'],
    queryFn: () => apiClient.get<ScheduledPost[]>('/api/v1/social/posts/scheduled'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get post queue
 */
export const usePostQueue = () => {
  return useQuery<QueueItem[]>({
    queryKey: [...queryKeys.social.posts, 'queue'],
    queryFn: () => apiClient.get<QueueItem[]>('/api/v1/social/posts/queue'),
    staleTime: 30 * 1000, // 30 seconds - queue updates frequently
    refetchInterval: 60 * 1000, // Refresh every minute
  });
};