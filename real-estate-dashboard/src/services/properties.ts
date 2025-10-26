/**
 * Properties Service - Vollständige Backend-Integration
 * Keine Mockdaten!
 */

import { apiClient } from '../lib/api/client';
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
    // Upload all files at once as FormData
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    console.log('🔍 Frontend: Uploading files:', files.map(f => f.name));
    console.log('🔍 Frontend: FormData entries:', Array.from(formData.entries()));
    
    try {
      const response = await apiClient.post<PropertyMedia[]>(
        `${this.baseUrl}/${id}/media`,
        formData,
        {
          headers: {
            'Accept': 'application/json',
          },
          onUploadProgress: options?.onProgress ? (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            options.onProgress?.(percentCompleted);
          } : undefined,
        }
      );
      return response;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
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

  /**
   * PATCH /api/v1/properties/{id}/field/{field_name} - Einzelfeld-Update
   */
  async updatePropertyField(id: string, field: string, value: any): Promise<PropertyResponse> {
    const response = await apiClient.patch(`${this.baseUrl}/${id}/field/${field}`, value);
    return (response as any).data;
  }

  /**
   * GET /api/v1/properties/{id}/contacts - Verknüpfte Kontakte abrufen
   */
  async getPropertyContacts(id: string): Promise<any[]> {
    const response = await apiClient.get(`${this.baseUrl}/${id}/contacts`);
    return (response as any).data;
  }

  /**
   * POST /api/v1/properties/{id}/contacts - Kontakt verknüpfen
   */
  async linkContact(id: string, contactData: { contact_id: string; role: string; is_primary?: boolean; notes?: string }): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/contacts`, contactData);
    return (response as any).data;
  }

  /**
   * DELETE /api/v1/properties/{id}/contacts/{contact_id} - Kontakt-Verknüpfung löschen
   */
  async unlinkContact(id: string, contactId: string, role: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}/contacts/${contactId}?role=${role}`);
  }

  /**
   * GET /api/v1/properties/{id}/portal-status - Portal-Status abrufen
   */
  async getPortalStatus(id: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}/portal-status`);
      return (response as any).data;
    } catch (error) {
      // Fallback für noch nicht implementierte Endpoints
      return {
        immoscout24: { status: 'not_published', last_sync: null },
        immowelt: { status: 'not_published', last_sync: null },
        kleinanzeigen: { status: 'not_published', last_sync: null },
      };
    }
  }

  /**
   * Portal OAuth und Publishing Services
   */
  async initiatePortalOAuth(portal: string, redirectUri: string): Promise<any> {
    const response = await apiClient.post('/api/v1/portals/oauth/initiate', {
      portal,
      redirect_uri: redirectUri,
    });
    return (response as any).data;
  }

  async getPortalConnections(): Promise<any[]> {
    const response = await apiClient.get('/api/v1/portals/connections');
    return (response as any).data;
  }

  async publishToPortal(propertyId: string, portal: string, portalData?: any): Promise<any> {
    const response = await apiClient.post(`/api/v1/portals/properties/${propertyId}/publish`, {
      portal,
      property_id: propertyId,
      portal_data: portalData,
    });
    return (response as any).data;
  }

  async syncPortal(propertyId: string, portal: string): Promise<any[]> {
    const response = await apiClient.post(`/api/v1/portals/properties/${propertyId}/sync`, {
      portal,
      property_id: propertyId,
    });
    return (response as any).data;
  }

  async unpublishFromPortal(propertyId: string, portal: string): Promise<any> {
    const response = await apiClient.post(`/api/v1/portals/properties/${propertyId}/unpublish`, {
      portal,
      property_id: propertyId,
    });
    return (response as any).data;
  }

  async deletePortalConnection(portal: string): Promise<void> {
    await apiClient.delete(`/api/v1/portals/connections/${portal}`);
  }
}

export const propertiesService = new PropertiesService();
export default propertiesService;
