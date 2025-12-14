/**
 * AVM Service - Premium Edition
 * Implementiert alle AVM-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
import {
  AvmRequest,
  AvmResponseData,
  GeoLocation,
  POI,
  ValidationResult,
  MarketIntelligence
} from '../types/avm';

class AVMService {
  /**
   * POST /api/v1/avm/valuate - Immobilie bewerten
   */
  async valuate(payload: AvmRequest): Promise<AvmResponseData> {
    const response = await apiClient.post<AvmResponseData>('/api/v1/avm/valuate', payload);
    return response;
  }

  /**
   * GET /api/v1/avm/geocode - Adresse geocodieren
   */
  async geocode(address: string, city: string, postalCode: string): Promise<GeoLocation> {
    const params = new URLSearchParams({ address, city, postal_code: postalCode });
    const response = await apiClient.get<GeoLocation>(`/api/v1/avm/geocode?${params}`);
    return response;
  }

  /**
   * GET /api/v1/avm/pois - POIs in der Nähe holen
   */
  async getNearbyPOIs(latitude: number, longitude: number, radiusM: number = 1000): Promise<POI[]> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius_m: radiusM.toString()
    });
    const response = await apiClient.get<POI[]>(`/api/v1/avm/pois?${params}`);
    return response;
  }

  /**
   * GET /api/v1/avm/market-data - Marktdaten abrufen
   */
  async getMarketData(
    city: string,
    postalCode: string,
    propertyType: string
  ): Promise<MarketIntelligence> {
    const params = new URLSearchParams({
      city,
      postal_code: postalCode,
      property_type: propertyType
    });
    const response = await apiClient.get<MarketIntelligence>(`/api/v1/avm/market-data?${params}`);
    return response;
  }

  /**
   * POST /api/v1/avm/validate - Eingaben validieren
   */
  async validate(payload: AvmRequest): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>('/api/v1/avm/validate', payload);
    return response;
  }

  /**
   * GET /api/v1/avm/valuations/{id}/export/pdf - PDF exportieren
   */
  async exportPDF(valuationId: string, includeComps: boolean = true, includeCharts: boolean = true): Promise<Blob> {
    const params = new URLSearchParams({
      include_comps: includeComps.toString(),
      include_charts: includeCharts.toString()
    });
    
    const response = await fetch(`/api/v1/avm/valuations/${valuationId}/export/pdf?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('PDF export failed');
    }

    return await response.blob();
  }
}

export const avmService = new AVMService();
export default avmService;
