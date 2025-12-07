/**
 * Exposé Service
 * API calls for exposé management
 */

import { apiClient } from '../api/config';

export interface ExposeVersionData {
  id: string;
  title: string;
  content: string;
  audience: string;
  tone: string;
  language: string;
  length: string;
  keywords: string[];
  status: string;
  version_number: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ExposeGenerateRequest {
  audience: string;
  tone: string;
  language?: string;
  length?: string;
  keywords?: string[];
}

export interface ExposeSaveRequest {
  title: string;
  content: string;
  audience: string;
  tone: string;
  language?: string;
  length?: string;
  keywords?: string[];
}

export interface ExposeGenerateResponse {
  version: ExposeVersionData;
  generated_at: string;
}

export interface ExposeListResponse {
  versions: ExposeVersionData[];
  total: number;
}

export interface ExposePDFRequest {
  version_id: string;
  include_logo?: boolean;
  template?: string;
}

export interface ExposePDFResponse {
  pdf_url: string;
  filename: string;
  generated_at: string;
  version_id?: string;
}

export class ExposeService {
  /**
   * Generate exposé using LLM
   */
  static async generateExpose(
    propertyId: string,
    request: ExposeGenerateRequest
  ): Promise<ExposeGenerateResponse> {
    try {
      const response = await apiClient.post<ExposeGenerateResponse>(
        `/api/v1/properties/${propertyId}/expose/generate`,
        {
          audience: request.audience,
          tone: request.tone,
          language: request.language || 'de',
          length: request.length || 'standard',
          keywords: request.keywords || []
        }
      );
      return response;
    } catch (error: any) {
      console.error('Error generating exposé:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Generieren des Exposés');
    }
  }

  /**
   * Get all exposé versions for a property
   */
  static async getExposeVersions(propertyId: string): Promise<ExposeListResponse> {
    try {
      const response = await apiClient.get<ExposeListResponse>(
        `/api/v1/properties/${propertyId}/expose/versions`
      );
      return response;
    } catch (error: any) {
      console.error('Error fetching exposé versions:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Laden der Exposé-Versionen');
    }
  }

  /**
   * Save exposé version
   */
  static async saveExposeVersion(
    propertyId: string,
    request: ExposeSaveRequest
  ): Promise<ExposeVersionData> {
    try {
      const response = await apiClient.post<ExposeVersionData>(
        `/api/v1/properties/${propertyId}/expose/save`,
        {
          title: request.title,
          content: request.content,
          audience: request.audience,
          tone: request.tone,
          language: request.language || 'de',
          length: request.length || 'standard',
          keywords: request.keywords || []
        }
      );
      return response;
    } catch (error: any) {
      console.error('Error saving exposé:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Speichern des Exposés');
    }
  }

  /**
   * Delete exposé version
   */
  static async deleteExposeVersion(propertyId: string, versionId: string): Promise<void> {
    try {
      await apiClient.delete(
        `/api/v1/properties/${propertyId}/expose/${versionId}`
      );
    } catch (error: any) {
      console.error('Error deleting exposé version:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Löschen der Exposé-Version');
    }
  }

  /**
   * Publish exposé version
   */
  static async publishExposeVersion(propertyId: string, versionId: string): Promise<ExposeVersionData> {
    try {
      const response = await apiClient.post<ExposeVersionData>(
        `/api/v1/properties/${propertyId}/expose/${versionId}/publish`
      );
      return response;
    } catch (error: any) {
      console.error('Error publishing exposé:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Veröffentlichen des Exposés');
    }
  }

  /**
   * Generate exposé PDF
   */
  static async generatePDF(
    propertyId: string,
    request: ExposePDFRequest
  ): Promise<ExposePDFResponse> {
    try {
      const response = await apiClient.post<ExposePDFResponse>(
        `/api/v1/properties/${propertyId}/expose/pdf`,
        {
          version_id: request.version_id,
          include_logo: request.include_logo !== false,
          template: request.template || 'standard'
        }
      );
      return response;
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Generieren des PDFs');
    }
  }

  /**
   * Download exposé PDF
   */
  static async downloadPDF(propertyId: string, versionId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/api/v1/properties/${propertyId}/expose/${versionId}/download`,
        {
          responseType: 'blob'
        }
      );
      return response as unknown as Blob;
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      throw new Error(error.response?.data?.detail || 'Fehler beim Herunterladen des PDFs');
    }
  }

  /**
   * Download PDF and trigger browser download
   */
  static async downloadPDFFile(propertyId: string, versionId: string, filename?: string): Promise<void> {
    try {
      const blob = await this.downloadPDF(propertyId, versionId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `Expose_${propertyId}_${new Date().toISOString().split('T')[0]}.pdf`;

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
