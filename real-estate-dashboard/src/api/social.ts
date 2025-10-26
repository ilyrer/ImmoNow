/**
 * Social Media API Client
 */
import { apiClient } from '../lib/api/client';

export interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
  account_name: string;
  account_id: string;
  access_token?: string;
  refresh_token?: string;
  is_active: boolean;
  status: 'active' | 'inactive' | 'error';
  last_sync?: string;
  follower_count?: number;
  following_count?: number;
  post_count?: number;
  engagement_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  content: string;
  platform: string;
  post_type: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel';
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  scheduled_at?: string;
  published_at?: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  };
  created_at: string;
  updated_at: string;
}

export interface SocialTemplate {
  id: string;
  name: string;
  template_type: string;
  content_template: string;
  hashtags: string[];
  platforms: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialAnalytics {
  total_posts: number;
  total_engagements: number;
  total_reach: number;
  total_impressions: number;
  engagement_rate: number;
  platforms: Array<{
    platform: string;
    posts: number;
    engagements: number;
    reach: number;
    impressions: number;
    engagement_rate: number;
    followers: number;
    growth: number;
  }>;
  top_posts: Array<{
    id: string;
    content: string;
    platform: string;
    engagements: number;
    reach: number;
    impressions: number;
    engagement_rate: number;
    published_at: string;
  }>;
  audience: {
    demographics: {
      age: Record<string, number>;
      gender: Record<string, number>;
      location: Record<string, number>;
    };
    interests: Array<{
      name: string;
      percentage: number;
    }>;
    growth: {
      followers: number;
      following: number;
      posts: number;
    };
  };
  trends: {
    posts: Array<{ date: string; value: number }>;
    engagements: Array<{ date: string; value: number }>;
    reach: Array<{ date: string; value: number }>;
    impressions: Array<{ date: string; value: number }>;
  };
  start_date: string;
  end_date: string;
}

export interface CreatePostRequest {
  account_ids: string[];
  content: string;
  post_type: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel';
  scheduled_at?: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
}

export interface CreateTemplateRequest {
  name: string;
  template_type: string;
  content_template: string;
  hashtags?: string[];
  platforms?: string[];
}

export interface UpdateTemplateRequest {
  name?: string;
  template_type?: string;
  content_template?: string;
  hashtags?: string[];
  platforms?: string[];
  is_active?: boolean;
}

export interface SocialActivity {
  id: string;
  type: 'post_published' | 'post_scheduled' | 'post_created' | 'account_connected';
  title: string;
  description: string;
  time_ago: string;
  platform: string;
  post_id?: string;
  account_id?: string;
  created_at: string;
}

export interface SocialActivityResponse {
  activities: SocialActivity[];
}

export interface OAuthResponse {
  auth_url: string;
}

export interface PublishPostRequest {
  platforms: string[];
}

export interface SchedulePostRequest {
  platforms: string[];
  scheduled_at: string;
}

export const socialApi = {
  // Accounts
  getAccounts: () => apiClient.get<SocialAccount[]>('/api/v1/social/accounts'),
  
  connectAccount: (platform: string, token: string, accountId: string) =>
    apiClient.post<SocialAccount>('/api/v1/social/accounts', {
      platform,
      token,
      account_id: accountId
    }),
  
  disconnectAccount: (accountId: string) =>
    apiClient.delete(`/api/v1/social/accounts/${accountId}`),
  
  refreshAccountToken: (accountId: string) =>
    apiClient.post(`/api/v1/social/accounts/${accountId}/refresh`),

  // OAuth
  startOAuthFlow: (platform: string) =>
    apiClient.post<{ auth_url: string }>(`/api/v1/social/oauth/${platform}/authorize`),
  
  handleOAuthCallback: (platform: string, code: string, state: string) =>
    apiClient.get<SocialAccount>(`/api/v1/social/oauth/${platform}/callback`, {
      params: { code, state }
    }),
  
  // Account Management
  testAccountConnection: (accountId: string) =>
    apiClient.post<{ connected: boolean }>(`/api/v1/social/accounts/${accountId}/test`),
  
  syncAccountData: (accountId: string) =>
    apiClient.post<SocialAccount>(`/api/v1/social/accounts/${accountId}/sync`),
  
  // Post Publishing
  publishPostToPlatform: (postId: string, platform: string, accountId: string) =>
    apiClient.post(`/api/v1/social/posts/${postId}/publish/${platform}`, null, {
      params: { account_id: accountId }
    }),
  
  // Posts
  getPosts: (params?: {
    status?: string;
    platform?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get<SocialPost[]>('/api/v1/social/posts', { params }),
  
  createPost: (data: CreatePostRequest) =>
    apiClient.post<SocialPost>('/api/v1/social/posts', data),
  
  updatePost: (postId: string, data: Partial<CreatePostRequest>) =>
    apiClient.put<SocialPost>(`/api/v1/social/posts/${postId}`, data),
  
  deletePost: (postId: string) =>
    apiClient.delete(`/api/v1/social/posts/${postId}`),
  
  publishPost: (postId: string, data: PublishPostRequest) =>
    apiClient.post(`/api/v1/social/posts/${postId}/publish`, data),
  
  schedulePost: (postId: string, data: SchedulePostRequest) =>
    apiClient.post(`/api/v1/social/posts/${postId}/schedule`, data),

  // Templates
  getTemplates: (templateType?: string) =>
    apiClient.get<SocialTemplate[]>('/api/v1/social/templates', {
      params: templateType ? { template_type: templateType } : {}
    }),
  
  createTemplate: (data: CreateTemplateRequest) =>
    apiClient.post<SocialTemplate>('/api/v1/social/templates', data),
  
  getTemplate: (templateId: string) =>
    apiClient.get<SocialTemplate>(`/api/v1/social/templates/${templateId}`),
  
  updateTemplate: (templateId: string, data: UpdateTemplateRequest) =>
    apiClient.put<SocialTemplate>(`/api/v1/social/templates/${templateId}`, data),
  
  deleteTemplate: (templateId: string) =>
    apiClient.delete(`/api/v1/social/templates/${templateId}`),

  // Analytics
  getAnalytics: (params?: {
    start_date?: string;
    end_date?: string;
    platform?: string;
  }) => apiClient.get<SocialAnalytics>('/api/v1/social/analytics', { params }),

  // Queue
  getQueue: () => apiClient.get<SocialPost[]>('/api/v1/social/queue'),

  // OAuth
  startOAuth: (platform: string) =>
    apiClient.post<OAuthResponse>(`/api/v1/social/oauth/${platform}/authorize`),
  
  oauthCallback: (platform: string, code: string, state?: string) =>
    apiClient.get(`/api/v1/social/oauth/${platform}/callback`, {
      params: { code, state }
    }),
  
  refreshOAuthToken: (platform: string, accountId: string) =>
    apiClient.post(`/api/v1/social/oauth/${platform}/refresh`, { account_id: accountId }),

  // Media
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/v1/social/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Activities
  getActivities: (limit: number = 10) =>
    apiClient.get<SocialActivity[]>(`/api/v1/social/activities?limit=${limit}`)
};

export default socialApi;
