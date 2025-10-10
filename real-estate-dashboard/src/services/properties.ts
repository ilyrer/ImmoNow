/**
 * Properties Service
 * Implementiert alle Property-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
import {
  PropertyResponse,
  CreatePropertyRequest,
  PaginationParams,
  SortParams
} from '../lib/api/types';

export interface PropertyListParams extends PaginationParams, SortParams {
  search?: string;
  property_type?: string;
  status?: string;
  price_min?: number;
  price_max?: number;
  location?: string;
  rooms_min?: number;
  rooms_max?: number;
  living_area_min?: number;
  living_area_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  features?: string[];
}

class PropertiesService {
  /**
   * GET /properties - Immobilien auflisten
   */
  async listProperties(params: PropertyListParams): Promise<PropertyResponse[]> {
    const response = await apiClient.get<PropertyResponse[]>('/properties', params);
    return response.data;
  }

  /**
   * POST /properties - Immobilie erstellen
   */
  async createProperty(payload: CreatePropertyRequest): Promise<PropertyResponse> {
    const response = await apiClient.post<PropertyResponse>('/properties', payload);
    return response.data;
  }

  /**
   * PUT /properties/{id} - Immobilie aktualisieren
   */
  async updateProperty(id: string, payload: Partial<CreatePropertyRequest>): Promise<PropertyResponse> {
    const response = await apiClient.put<PropertyResponse>(`/properties/${id}`, payload);
    return response.data;
  }

  /**
   * DELETE /properties/{id} - Immobilie löschen
   */
  async deleteProperty(id: string): Promise<void> {
    await apiClient.delete(`/properties/${id}`);
  }
}

export const propertiesService = new PropertiesService();
export default propertiesService;
