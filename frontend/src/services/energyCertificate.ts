/**
 * Energy Certificate Service
 * API calls for energy certificate management
 */

import { apiClient } from '../api/config';

export interface EnergyCertificateData {
  energy_class?: string;
  energy_consumption?: number;
  energy_certificate_type?: string;
  energy_certificate_valid_until?: string;
  energy_certificate_issue_date?: string;
  co2_emissions?: number;
  heating_type?: string;
}

export interface EnergyCertificateUpdateRequest {
  energy_class?: string;
  energy_consumption?: number;
  energy_certificate_type?: string;
  energy_certificate_valid_until?: string;
  energy_certificate_issue_date?: string;
  co2_emissions?: number;
  heating_type?: string;
}

export interface EnergyCertificatePDFRequest {
  include_logo?: boolean;
  language?: string;
  template?: string;
}

export interface EnergyCertificatePDFResponse {
  pdf_url: string;
  filename: string;
  generated_at: string;
}

export class EnergyCertificateService {
  /**
   * Get energy certificate data for a property
   */
  static async getEnergyData(propertyId: string): Promise<EnergyCertificateData> {
    try {
      const response = await apiClient.get<EnergyCertificateData>(
        `/api/v1/properties/${propertyId}/energy-data`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching energy data:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Laden der Energiedaten');
    }
  }

  /**
   * Update energy certificate data for a property
   */
  static async updateEnergyData(
    propertyId: string,
    data: EnergyCertificateUpdateRequest
  ): Promise<EnergyCertificateData> {
    try {
      const response = await apiClient.put<EnergyCertificateData>(
        `/api/v1/properties/${propertyId}/energy-data`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating energy data:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Speichern der Energiedaten');
    }
  }

  /**
   * Generate energy certificate PDF
   */
  static async generatePDF(
    propertyId: string,
    request: EnergyCertificatePDFRequest = {}
  ): Promise<EnergyCertificatePDFResponse> {
    try {
      const response = await apiClient.post<EnergyCertificatePDFResponse>(
        `/api/v1/properties/${propertyId}/energy-certificate/generate`,
        {
          include_logo: true,
          language: 'de',
          template: 'standard',
          ...request
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Generieren des PDFs');
    }
  }

  /**
   * Download energy certificate PDF
   */
  static async downloadPDF(propertyId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/api/v1/properties/${propertyId}/energy-certificate/download`,
        {
          responseType: 'blob'
        }
      );
      return response.data as Blob;
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Herunterladen des PDFs');
    }
  }

  /**
   * Download PDF and trigger browser download
   */
  static async downloadPDFFile(propertyId: string, filename?: string): Promise<void> {
    try {
      const blob = await this.downloadPDF(propertyId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `Energieausweis_${propertyId}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF file:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Herunterladen des PDFs');
    }
  }
}
