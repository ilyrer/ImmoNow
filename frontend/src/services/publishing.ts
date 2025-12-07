/**
 * Publishing Service
 * 
 * Handles property publishing to external portals like ImmoScout24
 */

import { apiClient } from '../api/config';

export interface PublishRequest {
  portal: string;
  property_id: string;
}

export interface PublishResponse {
  success: boolean;
  message: string;
  publish_job_id?: string;
  portal_property_id?: string;
  portal_url?: string;
}

export interface UnpublishRequest {
  publish_job_id: string;
}

export interface UnpublishResponse {
  success: boolean;
  message: string;
}

export interface PublishJobData {
  id: string;
  property_id: string;
  property_title: string;
  portal: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'unpublished';
  portal_property_id?: string;
  portal_url?: string;
  error_message?: string;
  created_at: string;
  published_at?: string;
  unpublished_at?: string;
}

export interface MetricsData {
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

export class PublishingService {
  /**
   * Publish property to external portal
   */
  static async publishProperty(request: PublishRequest): Promise<PublishResponse> {
    return apiClient.post('/api/v1/publishing/publish', request);
  }

  /**
   * Unpublish property from external portal
   */
  static async unpublishProperty(request: UnpublishRequest): Promise<UnpublishResponse> {
    return apiClient.post('/api/v1/publishing/unpublish', request);
  }

  /**
   * Get all publish jobs for current tenant
   */
  static async getPublishJobs(): Promise<PublishJobData[]> {
    return apiClient.get('/api/v1/publishing/jobs');
  }

  /**
   * Get specific publish job
   */
  static async getPublishJob(jobId: string): Promise<PublishJobData> {
    return apiClient.get(`/api/v1/publishing/jobs/${jobId}`);
  }

  /**
   * Get property metrics from portal
   */
  static async getPropertyMetrics(portalPropertyId: string): Promise<MetricsData> {
    return apiClient.get(`/api/v1/publishing/metrics/${portalPropertyId}`);
  }

  /**
   * Sync metrics for all published properties
   */
  static async syncAllMetrics(): Promise<SyncMetricsResponse> {
    return apiClient.post('/api/v1/publishing/metrics/sync');
  }

  /**
   * Retry failed publish job
   */
  static async retryPublishJob(jobId: string): Promise<PublishResponse> {
    return apiClient.post(`/api/v1/publishing/jobs/${jobId}/retry`);
  }
}
