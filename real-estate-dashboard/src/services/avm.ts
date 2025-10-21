/**
 * AVM Service
 * Implementiert alle AVM-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
import {
  AvmRequest,
  AvmResponse
} from '../lib/api/types';

class AVMService {
  /**
   * POST /avm/valuate - Immobilie bewerten
   */
  async valuate(payload: AvmRequest): Promise<AvmResponse> {
    const response = await apiClient.post<AvmResponse>('/api/v1/avm/valuate', payload);
    return response;
  }
}

export const avmService = new AVMService();
export default avmService;
