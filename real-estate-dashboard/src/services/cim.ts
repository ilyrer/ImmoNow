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
  /**
   * GET /cim/overview - CIM Dashboard-Übersicht
   */
  async getOverview(params: CIMOverviewParams = {}): Promise<CIMOverviewResponse> {
    const response = await apiClient.get<CIMOverviewResponse>('/cim/overview', params);
    return response.data;
  }
}

export const cimService = new CIMService();
export default cimService;
