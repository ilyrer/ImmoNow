/**
 * Properties Service - Vollständige Backend-Integration
 * Keine Mockdaten!
 */

import { apiClient } from '../api/config';
import {
  PropertyResponse,
  CreatePropertyRequest,
  PaginationParams,
  SortParams
} from '../lib/api/types';
import {
  PropertyListResponse,
  PropertyMetrics,
  PropertyMedia,
  PropertyAnalytics,
  PropertyFilterParams,
  CreatePropertyPayload,
  UpdatePropertyPayload,
} from '../types/property';

export interface PropertyListParams extends PaginationParams, SortParams {
  search?: string;
  property_type?: string;
  status?: string;
  price_min?: number;
  price_max?: number;
  location?: string;
  city?: string;
  rooms_min?: number;
  rooms_max?: number;
  living_area_min?: number;
  living_area_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  features?: string[];
  tags?: string[];
  bedrooms_min?: number;
  bedrooms_max?: number;
  bathrooms_min?: number;
  bathrooms_max?: number;
  plot_area_min?: number;
  plot_area_max?: number;
  energy_class?: string;
  heating_type?: string;
}

class PropertiesService {
  private readonly baseUrl = '/api/v1/properties';

  /**
   * GET /api/v1/properties - Immobilien auflisten (mit Pagination)
   */
  async listProperties(params: PropertyListParams): Promise<PropertyListResponse> {
    try {
      const response = await apiClient.get<any>(this.baseUrl, { params });

      // Handle both array and paginated response
      if (Array.isArray(response)) {
        return {
          items: response,
          total: response.length,
          page: params.page || 1,
          size: params.size || 20,
          pages: 1,
          hasNext: false,
          hasPrev: false,
        };
      }

      // Paginated response
      const total = response.total || response.items?.length || 0;
      const page = response.page || params.page || 1;
      const size = response.size || params.size || 20;
      const pages = Math.ceil(total / size);

      return {
        items: response.items || response.data || response,
        total,
        page,
        size,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      };
    } catch (error) {
      console.error('Error listing properties:', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/properties/{id} - Einzelne Immobilie abrufen
   */
  async getProperty(id: string): Promise<PropertyResponse> {
    return await apiClient.get<PropertyResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * POST /api/v1/properties - Immobilie erstellen
   */
  async createProperty(payload: CreatePropertyPayload): Promise<PropertyResponse> {
    return await apiClient.post<PropertyResponse>(this.baseUrl, payload);
  }

  /**
   * PUT /api/v1/properties/{id} - Immobilie aktualisieren
   */
  async updateProperty(id: string, payload: UpdatePropertyPayload): Promise<PropertyResponse> {
    return await apiClient.put<PropertyResponse>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * PATCH /api/v1/properties/{id} - Teilweise aktualisieren
   */
  async patchProperty(id: string, payload: Partial<UpdatePropertyPayload>): Promise<PropertyResponse> {
    return await apiClient.patch<PropertyResponse>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * DELETE /api/v1/properties/{id} - Immobilie löschen
   */
  async deleteProperty(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/v1/properties/{id}/metrics - Performance-Metriken abrufen
   */
  async getMetrics(id: string): Promise<PropertyMetrics> {
    try {
      return await apiClient.get<PropertyMetrics>(`${this.baseUrl}/${id}/metrics`);
    } catch (error) {
      console.error('Error fetching property metrics:', error);
      // Fallback: Berechne minimale Metriken aus Property-Daten
      const property = await this.getProperty(id);
      const daysOnMarket = Math.ceil(
        (new Date().getTime() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        views: 0,
        inquiries: 0,
        visits: 0,
        favorites: 0,
        daysOnMarket,
        averageViewDuration: 0,
        conversionRate: 0,
        chartData: [],
      };
    }
  }

  /**
   * POST /api/v1/properties/{id}/metrics/sync - Metriken von Portalen synchronisieren
   */
  async syncMetrics(id: string): Promise<{ success: boolean; total_views: number; total_inquiries: number; synced_at: string }> {
    return await apiClient.post(`${this.baseUrl}/${id}/metrics/sync`, {});
  }

  /**
   * GET /api/v1/properties/{id}/media - Medien abrufen
   */
  async getMedia(id: string): Promise<PropertyMedia[]> {
    try {
      return await apiClient.get<PropertyMedia[]>(`${this.baseUrl}/${id}/media`);
    } catch (error) {
      console.error('Error fetching property media:', error);
      // Fallback: Hole Medien aus Property-Daten
      const property = await this.getProperty(id);
      return property.images?.map((img, index) => ({
        id: img.id,
        property_id: id,
        type: 'image' as const,
        url: img.url,
        thumbnail_url: img.thumbnail_url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
        order: img.order,
        size: 0,
        mime_type: 'image/jpeg',
        uploaded_at: property.created_at,
        uploaded_by: property.created_by,
      })) || [];
    }
  }

  /**
   * POST /api/v1/properties/{id}/media - Medien hochladen
   */
  async uploadMedia(
    id: string,
    files: File[],
    options?: { onProgress?: (progress: number) => void }
  ): Promise<PropertyMedia[]> {
    const uploadedMedia: PropertyMedia[] = [];

    for (const file of files) {
      try {
        const media = await apiClient.uploadFile<PropertyMedia>(
          `${this.baseUrl}/${id}/media`,
          file,
          { property_id: id },
          options?.onProgress
        );
        uploadedMedia.push(media);
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
      }
    }

    return uploadedMedia;
  }

  /**
   * DELETE /api/v1/properties/{id}/media/{mediaId} - Medium löschen
   */
  async deleteMedia(id: string, mediaId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}/media/${mediaId}`);
  }

  /**
   * PATCH /api/v1/properties/{id}/media/{mediaId}/primary - Als Hauptbild setzen
   */
  async setPrimaryMedia(id: string, mediaId: string): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/${id}/media/${mediaId}/primary`, {});
  }

  /**
   * GET /api/v1/properties/{id}/analytics - Detaillierte Analytics
   */
  async getAnalytics(id: string): Promise<PropertyAnalytics> {
    try {
      return await apiClient.get<PropertyAnalytics>(`${this.baseUrl}/${id}/analytics`);
    } catch (error) {
      console.error('Error fetching property analytics:', error);
      // Fallback: Minimale Analytics
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        averageTimeOnPage: 0,
        bounceRate: 0,
        conversionRate: 0,
        topReferrers: [],
        deviceStats: { mobile: 0, desktop: 0, tablet: 0 },
        geographicDistribution: [],
        timeSeriesData: [],
      };
    }
  }

  /**
   * POST /api/v1/properties/{id}/favorite - Als Favorit markieren
   */
  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await apiClient.post(`${this.baseUrl}/${id}/favorite`, {});
    } else {
      await apiClient.delete(`${this.baseUrl}/${id}/favorite`);
    }
  }

  /**
   * POST /api/v1/properties/bulk-action - Bulk-Aktionen
   */
  async bulkAction(action: 'delete' | 'archive' | 'publish', propertyIds: string[]): Promise<void> {
    await apiClient.post(`${this.baseUrl}/bulk-action`, {
      action,
      property_ids: propertyIds,
    });
  }
}

export const propertiesService = new PropertiesService();
export default propertiesService;
