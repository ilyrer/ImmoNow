/**
 * Social Service
 * Implementiert alle Social Media Endpunkte
 */

import { api } from '../api/base';
import {
  SocialAccount,
  SocialPost,
  SocialTemplate,
  SocialAnalytics,
  CreatePostRequest,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  PublishPostRequest,
  SchedulePostRequest,
  OAuthResponse
} from '../api/social';

class SocialService {
  // Accounts
  async getAccounts(): Promise<SocialAccount[]> {
    const response = await api.get<SocialAccount[]>('/social/accounts');
    return response.data;
  }

  async connectAccount(platform: string, token: string, accountId: string): Promise<SocialAccount> {
    const response = await api.post<SocialAccount>('/social/accounts', {
      platform,
      token,
      account_id: accountId
    });
    return response.data;
  }

  async disconnectAccount(accountId: string): Promise<void> {
    await api.delete(`/social/accounts/${accountId}`);
  }

  async refreshAccountToken(accountId: string): Promise<void> {
    await api.post(`/social/accounts/${accountId}/refresh`);
  }

  // Posts
  async getPosts(params?: {
    status?: string;
    platform?: string;
    limit?: number;
    offset?: number;
  }): Promise<SocialPost[]> {
    const response = await api.get<SocialPost[]>('/social/posts', { params });
    return response.data;
  }

  async createPost(data: CreatePostRequest): Promise<SocialPost> {
    const response = await api.post<SocialPost>('/social/posts', data);
    return response.data;
  }

  async updatePost(postId: string, data: Partial<CreatePostRequest>): Promise<SocialPost> {
    const response = await api.put<SocialPost>(`/social/posts/${postId}`, data);
    return response.data;
  }

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/social/posts/${postId}`);
  }

  async publishPost(postId: string, data: PublishPostRequest): Promise<void> {
    await api.post(`/social/posts/${postId}/publish`, data);
  }

  async schedulePost(postId: string, data: SchedulePostRequest): Promise<void> {
    await api.post(`/social/posts/${postId}/schedule`, data);
  }

  // Templates
  async getTemplates(templateType?: string): Promise<SocialTemplate[]> {
    const params = templateType ? { template_type: templateType } : {};
    const response = await api.get<SocialTemplate[]>('/social/templates', { params });
    return response.data;
  }

  async createTemplate(data: CreateTemplateRequest): Promise<SocialTemplate> {
    const response = await api.post<SocialTemplate>('/social/templates', data);
    return response.data;
  }

  async getTemplate(templateId: string): Promise<SocialTemplate> {
    const response = await api.get<SocialTemplate>(`/social/templates/${templateId}`);
    return response.data;
  }

  async updateTemplate(templateId: string, data: UpdateTemplateRequest): Promise<SocialTemplate> {
    const response = await api.put<SocialTemplate>(`/social/templates/${templateId}`, data);
    return response.data;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await api.delete(`/social/templates/${templateId}`);
  }

  // Analytics
  async getAnalytics(params?: {
    start_date?: string;
    end_date?: string;
    platform?: string;
  }): Promise<SocialAnalytics> {
    const response = await api.get<SocialAnalytics>('/social/analytics', { params });
    return response.data;
  }

  // Queue
  async getQueue(): Promise<SocialPost[]> {
    const response = await api.get<SocialPost[]>('/social/queue');
    return response.data;
  }

  // OAuth
  async startOAuth(platform: string): Promise<OAuthResponse> {
    const response = await api.post<OAuthResponse>(`/social/oauth/${platform}/authorize`);
    return response.data;
  }

  async oauthCallback(platform: string, code: string, state?: string): Promise<void> {
    await api.get(`/social/oauth/${platform}/callback`, {
      params: { code, state }
    });
  }

  async refreshOAuthToken(platform: string): Promise<void> {
    await api.post(`/social/oauth/${platform}/refresh`);
  }

  // Media
  async getMedia(): Promise<any[]> {
    const response = await api.get('/social/media');
    return response.data;
  }

  async uploadMedia(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/social/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}

export const socialService = new SocialService();
export default socialService;
