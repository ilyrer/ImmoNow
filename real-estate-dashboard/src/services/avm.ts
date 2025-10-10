/**
 * AVM Service
 * Implementiert alle AVM-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
import {
  AvmRequest,
  AvmResult
} from '../lib/api/types';

class AVMService {
  /**
   * POST /avm/valuate - Immobilie bewerten
   */
  async valuate(payload: AvmRequest): Promise<AvmResult> {
    const response = await apiClient.post<AvmResult>('/avm/valuate', payload);
    return response.data;
  }
}

export const avmService = new AVMService();
export default avmService;
