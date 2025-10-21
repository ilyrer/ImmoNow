import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  id: string; // UUID wird als String serialisiert
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar?: string;
  language: string;
  timezone: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  google_id?: string;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  language?: string;
  timezone?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  property_updates: boolean;
  task_reminders: boolean;
  appointment_reminders: boolean;
  marketing_emails: boolean;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface ActivityLog {
  id: string; // UUID wird als String serialisiert
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  description?: string; // Added for compatibility
  metadata?: Record<string, any>; // Added for compatibility
}

export interface UserStats {
  properties_managed: number;
  contacts_managed: number;
  tasks_completed: number;
  appointments_scheduled: number;
  account_age_days: number;
  last_login_days_ago?: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const profileApi = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/api/v1/profile/me');
    return response;
  },

  // Update user profile
  updateProfile: async (data: ProfileUpdateRequest): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>('/api/v1/profile/me', data);
    return response;
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<{ message: string; avatar_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<{ message: string; avatar_url: string }>('/api/v1/profile/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Remove avatar
  removeAvatar: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>('/api/v1/profile/me/avatar');
    return response;
  },

  // Change password
  changePassword: async (data: PasswordChangeRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/v1/profile/me/password', data);
    return response;
  },

  // Get notification preferences
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<NotificationPreferences>('/api/v1/profile/me/notifications');
    return response;
  },

  // Update notification preferences
  updateNotificationPreferences: async (data: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await apiClient.put<NotificationPreferences>('/api/v1/profile/me/notifications', data);
    return response;
  },

  // Get activity logs
  getActivityLogs: async (limit: number = 20): Promise<ActivityLog[]> => {
    const response = await apiClient.get<ActivityLog[]>(`/api/v1/profile/me/activity?limit=${limit}`);
    return response;
  },

  // Get user stats
  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<UserStats>('/api/v1/profile/me/stats');
    return response;
  },

  // Deactivate account
  deactivateAccount: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/v1/profile/me/deactivate');
    return response;
  },
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

// Get user profile
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Upload avatar
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Remove avatar
export const useRemoveAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: profileApi.removeAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Change password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: profileApi.changePassword,
  });
};

// Get notification preferences
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: profileApi.getNotificationPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Update notification preferences
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: profileApi.updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
};

// Get activity logs
export const useActivityLogs = (limit: number = 20) => {
  return useQuery({
    queryKey: ['activity-logs', limit],
    queryFn: () => profileApi.getActivityLogs(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get user stats
export const useUserStats = () => {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: profileApi.getUserStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Deactivate account
export const useDeactivateAccount = () => {
  return useMutation({
    mutationFn: profileApi.deactivateAccount,
  });
};
