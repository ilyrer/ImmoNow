/**
 * CIM Service
 * Implementiert alle CIM-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
import {
  CIMOverviewResponse
} from '../lib/api/types';

export interface CIMOverviewParams {
  limit?: number;
  days_back?: number;
  property_status?: string;
  contact_status?: string;
}

class CIMService {
  private readonly baseUrl = '/api/v1/cim';

  /**
   * GET /api/v1/cim/overview - CIM Dashboard-Übersicht mit Immobiliendaten
   */
  async getOverview(params: CIMOverviewParams = {}): Promise<CIMOverviewResponse> {
    console.log('🔍 CIM Service - Fetching overview from backend:', {
      url: `${this.baseUrl}/overview`,
      params
    });
    
    const response = await apiClient.get<CIMOverviewResponse>(`${this.baseUrl}/overview`, { params });
    
    console.log('✅ CIM Service - Backend response:', {
      propertiesCount: response.recent_properties?.length || 0,
      contactsCount: response.recent_contacts?.length || 0,
      matchesCount: response.perfect_matches?.length || 0,
      summary: response.summary
    });
    
    return response;
  }
}

export const cimService = new CIMService();
export default cimService;
