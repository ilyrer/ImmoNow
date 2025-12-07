/**
 * Admin Settings Service
 * 
 * API calls for managing integration settings and API keys
 */

import { apiClient } from '../api/config';

export interface IntegrationSettings {
  google_maps_api_key?: string;
  google_maps_configured: boolean;
  immoscout_client_id?: string;
  immoscout_client_secret?: string;
  immoscout_configured: boolean;
  immoscout_access_token?: string;
  immoscout_refresh_token?: string;
  immoscout_token_expires_at?: string;
  immowelt_api_key?: string;
  immowelt_configured: boolean;
  ebay_api_key?: string;
  ebay_configured: boolean;
}

export interface IntegrationSettingsUpdate {
  google_maps_api_key?: string;
  immoscout_client_id?: string;
  immoscout_client_secret?: string;
  immoscout_access_token?: string;
  immoscout_refresh_token?: string;
  immoscout_token_expires_at?: string;
  immowelt_api_key?: string;
  ebay_api_key?: string;
}

export interface TestResult {
  status: 'success' | 'error';
  message: string;
  test_result?: string;
  token_type?: string;
  expires_in?: number;
}

export class AdminSettingsService {
  /**
   * Get current integration settings
   */
  static async getIntegrationSettings(): Promise<IntegrationSettings> {
    try {
      const response = await apiClient.get<IntegrationSettings>(
        '/api/v1/admin/settings/integrations'
      );
      return response;
    } catch (error: any) {
      console.error('Error fetching integration settings:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Laden der Integrationseinstellungen');
    }
  }

  /**
   * Update integration settings
   */
  static async updateIntegrationSettings(
    settings: IntegrationSettingsUpdate
  ): Promise<IntegrationSettings> {
    try {
      const response = await apiClient.put<IntegrationSettings>(
        '/api/v1/admin/settings/integrations',
        settings
      );
      return response;
    } catch (error: any) {
      console.error('Error updating integration settings:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Speichern der Integrationseinstellungen');
    }
  }

  /**
   * Test Google Maps API key
   */
  static async testGoogleMapsApiKey(apiKey: string): Promise<TestResult> {
    try {
      const response = await apiClient.post<TestResult>(
        '/api/v1/admin/settings/integrations/test/google-maps',
        { api_key: apiKey }
      );
      return response;
    } catch (error: any) {
      console.error('Error testing Google Maps API key:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Testen des Google Maps API-Schlüssels');
    }
  }

  /**
   * Test ImmoScout24 API credentials
   */
  static async testImmoScoutCredentials(
    clientId: string,
    clientSecret: string
  ): Promise<TestResult> {
    try {
      const response = await apiClient.post<TestResult>(
        '/api/v1/admin/settings/integrations/test/immoscout',
        {
          client_id: clientId,
          client_secret: clientSecret
        }
      );
      return response;
    } catch (error: any) {
      console.error('Error testing ImmoScout24 credentials:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Testen der ImmoScout24 API-Zugangsdaten');
    }
  }
}
