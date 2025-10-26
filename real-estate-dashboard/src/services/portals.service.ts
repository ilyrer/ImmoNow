/**
 * Portal Service
 * Handles OAuth authentication and property publishing for ImmoScout24 and Immowelt
 */

import { apiClient } from '../lib/api/client';

export interface PortalOAuthRequest {
  platform: 'immoscout24' | 'immowelt';
  user_id: string;
}

export interface PortalOAuthResponse {
  authorization_url: string;
  state: string;
  platform: string;
}

export interface PortalCallbackRequest {
  code: string;
  state: string;
  platform: 'immoscout24' | 'immowelt';
}

export interface PortalCallbackResponse {
  success: boolean;
  message: string;
  access_token?: string;
  expires_at?: string;
  platform?: string;
}

export interface PortalRefreshRequest {
  platform: 'immoscout24' | 'immowelt';
  refresh_token: string;
}

export interface PortalRefreshResponse {
  success: boolean;
  message: string;
  access_token?: string;
  expires_at?: string;
}

export interface PortalTestRequest {
  platform: 'immoscout24' | 'immowelt';
  access_token: string;
}

export interface PortalTestResponse {
  success: boolean;
  message: string;
  user_info?: {
    user_id: string;
    username: string;
    email: string;
  };
  platform?: string;
}

export interface PublishRequest {
  portal: 'immoscout24' | 'immowelt';
  property_id: string;
}

export interface PublishResponse {
  success: boolean;
  message: string;
  publish_job_id?: string;
  portal_property_id?: string;
  portal_url?: string;
  portal?: string;
}

export interface UnpublishRequest {
  publish_job_id: string;
}

export interface UnpublishResponse {
  success: boolean;
  message: string;
}

export interface PublishJob {
  id: string;
  property_id: string;
  property_title: string;
  portal: string;
  status: 'pending' | 'published' | 'unpublished' | 'failed';
  portal_property_id?: string;
  portal_url?: string;
  error_message?: string;
  created_at: string;
  published_at?: string;
  unpublished_at?: string;
}

export interface PropertyMetrics {
  property_id: string;
  portal_property_id: string;
  views: number;
  inquiries: number;
  favorites: number;
  last_updated: string;
}

export interface SyncMetricsResponse {
  success: boolean;
  synced_count: number;
  error_count: number;
  total_count: number;
}

class PortalService {
  private readonly baseUrl = '/api/v1/portals';
  private readonly publishUrl = '/api/v1/publishing';

  /**
   * Start OAuth flow for a portal
   */
  async startOAuthFlow(request: PortalOAuthRequest): Promise<PortalOAuthResponse> {
    try {
      const response = await apiClient.post<PortalOAuthResponse>(
        `${this.baseUrl}/${request.platform}/oauth/authorize`,
        request
      );
      return response;
    } catch (error: any) {
      console.error('OAuth flow start error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Starten der OAuth-Authentifizierung');
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(request: PortalCallbackRequest): Promise<PortalCallbackResponse> {
    try {
      const response = await apiClient.post<PortalCallbackResponse>(
        `${this.baseUrl}/${request.platform}/oauth/callback`,
        request
      );
      return response;
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler bei der OAuth-Authentifizierung');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(request: PortalRefreshRequest): Promise<PortalRefreshResponse> {
    try {
      const response = await apiClient.post<PortalRefreshResponse>(
        `${this.baseUrl}/${request.platform}/oauth/refresh`,
        request
      );
      return response;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Aktualisieren des Tokens');
    }
  }

  /**
   * Test portal connection
   */
  async testConnection(request: PortalTestRequest): Promise<PortalTestResponse> {
    try {
      const response = await apiClient.post<PortalTestResponse>(
        `${this.baseUrl}/${request.platform}/test`,
        request
      );
      return response;
    } catch (error: any) {
      console.error('Connection test error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Testen der Verbindung');
    }
  }

  /**
   * Publish property to portal
   */
  async publishProperty(request: PublishRequest): Promise<PublishResponse> {
    try {
      const response = await apiClient.post<PublishResponse>(
        `${this.publishUrl}/publish`,
        request
      );
      return response;
    } catch (error: any) {
      console.error('Property publish error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Veröffentlichen der Immobilie');
    }
  }

  /**
   * Unpublish property from portal
   */
  async unpublishProperty(request: UnpublishRequest): Promise<UnpublishResponse> {
    try {
      const response = await apiClient.post<UnpublishResponse>(
        `${this.publishUrl}/unpublish`,
        request
      );
      return response;
    } catch (error: any) {
      console.error('Property unpublish error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Entfernen der Immobilie');
    }
  }

  /**
   * Get all publish jobs
   */
  async getPublishJobs(): Promise<PublishJob[]> {
    try {
      const response = await apiClient.get<PublishJob[]>(`${this.publishUrl}/jobs`);
      return response;
    } catch (error: any) {
      console.error('Get publish jobs error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Laden der Veröffentlichungen');
    }
  }

  /**
   * Get specific publish job
   */
  async getPublishJob(jobId: string): Promise<PublishJob> {
    try {
      const response = await apiClient.get<PublishJob>(`${this.publishUrl}/jobs/${jobId}`);
      return response;
    } catch (error: any) {
      console.error('Get publish job error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Laden der Veröffentlichung');
    }
  }

  /**
   * Get property metrics from portal
   */
  async getPropertyMetrics(portalPropertyId: string): Promise<PropertyMetrics> {
    try {
      const response = await apiClient.get<PropertyMetrics>(
        `${this.publishUrl}/metrics/${portalPropertyId}`
      );
      return response;
    } catch (error: any) {
      console.error('Get property metrics error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Laden der Metriken');
    }
  }

  /**
   * Sync metrics for all published properties
   */
  async syncAllMetrics(): Promise<SyncMetricsResponse> {
    try {
      const response = await apiClient.post<SyncMetricsResponse>(
        `${this.publishUrl}/metrics/sync`
      );
      return response;
    } catch (error: any) {
      console.error('Sync metrics error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Synchronisieren der Metriken');
    }
  }

  /**
   * Retry failed publish job
   */
  async retryPublishJob(jobId: string): Promise<PublishResponse> {
    try {
      const response = await apiClient.post<PublishResponse>(
        `${this.publishUrl}/jobs/${jobId}/retry`
      );
      return response;
    } catch (error: any) {
      console.error('Retry publish job error:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Wiederholen der Veröffentlichung');
    }
  }

  /**
   * Get portal display name
   */
  getPortalDisplayName(portal: string): string {
    const displayNames: Record<string, string> = {
      'immoscout24': 'ImmoScout24',
      'immowelt': 'Immowelt'
    };
    return displayNames[portal] || portal;
  }

  /**
   * Get portal icon
   */
  getPortalIcon(portal: string): string {
    const icons: Record<string, string> = {
      'immoscout24': '🏠',
      'immowelt': '🏡'
    };
    return icons[portal] || '📄';
  }

  /**
   * Get portal color
   */
  getPortalColor(portal: string): string {
    const colors: Record<string, string> = {
      'immoscout24': '#0066cc',
      'immowelt': '#ff6600'
    };
    return colors[portal] || '#666666';
  }

  /**
   * Check if portal is supported
   */
  isPortalSupported(portal: string): boolean {
    return ['immoscout24', 'immowelt'].includes(portal);
  }
}

export const portalService = new PortalService();
export default portalService;
