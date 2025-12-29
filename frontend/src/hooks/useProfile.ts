import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Types
export interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    company?: string;
    position?: string;
    location?: string;
    website?: string;
    role?: string;
    language: string;
    timezone: string;
    date_format: string;
    currency: string;
    theme: string;
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    is_verified: boolean;
    is_active: boolean;
    date_joined: string;
    last_login?: string;
}

export interface ProfileUpdateData {
    first_name?: string;
    last_name?: string;
    phone?: string;
    bio?: string;
    company?: string;
    position?: string;
    location?: string;
    website?: string;
}

export interface PreferencesUpdateData {
    language?: string;
    timezone?: string;
    date_format?: string;
    currency?: string;
    theme?: string;
}

export interface NotificationPreferencesData {
    email_notifications?: boolean;
    push_notifications?: boolean;
    sms_notifications?: boolean;
    marketing_emails?: boolean;
    task_reminders?: boolean;
    property_updates?: boolean;
    system_announcements?: boolean;
}

export interface PasswordChangeData {
    current_password: string;
    new_password: string;
}

// API functions
const profileAPI = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await axios.get(`${API_BASE}/api/v1/me/profile`);
        return response.data;
    },

    updateProfile: async (data: ProfileUpdateData): Promise<Partial<UserProfile>> => {
        const response = await axios.patch(`${API_BASE}/api/v1/me/profile`, data);
        return response.data;
    },

    updatePreferences: async (data: PreferencesUpdateData): Promise<any> => {
        const response = await axios.patch(`${API_BASE}/api/v1/me/preferences`, data);
        return response.data;
    },

    updateNotificationPreferences: async (data: NotificationPreferencesData): Promise<any> => {
        const response = await axios.patch(`${API_BASE}/api/v1/me/notifications`, data);
        return response.data;
    },

    changePassword: async (data: PasswordChangeData): Promise<{ message: string }> => {
        const response = await axios.post(`${API_BASE}/api/v1/me/change-password`, data);
        return response.data;
    },

    uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API_BASE}/api/v1/me/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    getApiTokens: async (): Promise<any[]> => {
        const response = await axios.get(`${API_BASE}/api/v1/me/api-tokens`);
        return response.data;
    },

    getLinkedAccounts: async (): Promise<any[]> => {
        const response = await axios.get(`${API_BASE}/api/v1/me/linked-accounts`);
        return response.data;
    },
};

// Query keys
export const profileKeys = {
    all: ['profile'] as const,
    detail: () => [...profileKeys.all, 'detail'] as const,
    apiTokens: () => [...profileKeys.all, 'api-tokens'] as const,
    linkedAccounts: () => [...profileKeys.all, 'linked-accounts'] as const,
};

// Hooks
export function useProfile() {
    return useQuery({
        queryKey: profileKeys.detail(),
        queryFn: profileAPI.getProfile,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: profileAPI.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: profileKeys.all });
        },
    });
}

export function useUpdatePreferences() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: profileAPI.updatePreferences,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: profileKeys.all });
        },
    });
}

export function useUpdateNotificationPreferences() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: profileAPI.updateNotificationPreferences,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: profileKeys.all });
        },
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: profileAPI.changePassword,
    });
}

export function useUploadAvatar() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: profileAPI.uploadAvatar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: profileKeys.all });
        },
    });
}

export function useApiTokens() {
    return useQuery({
        queryKey: profileKeys.apiTokens(),
        queryFn: profileAPI.getApiTokens,
    });
}

export function useLinkedAccounts() {
    return useQuery({
        queryKey: profileKeys.linkedAccounts(),
        queryFn: profileAPI.getLinkedAccounts,
    });
}
