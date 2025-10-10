/**
 * Documents Service
 * Implementiert alle Document-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
import {
  DocumentResponse,
  DocumentListResponse,
  DocumentFolderResponse,
  DocumentAnalyticsResponse,
  CreateFolderRequest,
  PaginationParams,
  SortParams
} from '../lib/api/types';

export interface DocumentListParams extends PaginationParams, SortParams {
  search?: string;
  folder_id?: number;
  document_type?: string;
  status?: string;
  category_id?: number;
  property_id?: string;
  favorites_only?: boolean;
  has_expiry?: boolean;
  is_expired?: boolean;
}

export interface UploadDocumentParams {
  file: File;
  metadata?: {
    title?: string;
    description?: string;
    folder_id?: number;
    property_id?: string;
    contact_id?: string;
    tags?: string[];
  };
  idempotencyKey?: string;
  onProgress?: (progress: number) => void;
}

class DocumentsService {
  /**
   * GET /documents - Dokumente auflisten
   */
  async listDocuments(params: DocumentListParams): Promise<DocumentListResponse> {
    const response = await apiClient.get<DocumentListResponse>('/documents', params);
    return response.data;
  }

  /**
   * POST /documents/upload - Dokument hochladen
   */
  async uploadDocument({
    file,
    metadata,
    idempotencyKey,
    onProgress
  }: UploadDocumentParams): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await apiClient.request<DocumentResponse>({
      method: 'POST',
      url: '/documents/upload',
      data: formData,
      headers,
      onUploadProgress: onProgress ? (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      } : undefined,
    });

    return response.data;
  }

  /**
   * PUT /documents/{id}/favorite - Favorit togglen
   */
  async toggleFavorite(id: string): Promise<{ is_favorite: boolean }> {
    const response = await apiClient.put<{ is_favorite: boolean }>(`/documents/${id}/favorite`);
    return response.data;
  }

  /**
   * DELETE /documents/{id} - Dokument löschen
   */
  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  }

  /**
   * GET /documents/folders - Ordner auflisten
   */
  async listFolders(): Promise<DocumentFolderResponse[]> {
    const response = await apiClient.get<DocumentFolderResponse[]>('/documents/folders');
    return response.data;
  }

  /**
   * POST /documents/folders - Ordner erstellen
   */
  async createFolder(payload: CreateFolderRequest): Promise<DocumentFolderResponse> {
    const response = await apiClient.post<DocumentFolderResponse>('/documents/folders', payload);
    return response.data;
  }

  /**
   * DELETE /documents/folders/{id} - Ordner löschen
   */
  async deleteFolder(id: number): Promise<void> {
    await apiClient.delete(`/documents/folders/${id}`);
  }

  /**
   * GET /documents/analytics - Dokument-Analytics
   */
  async getAnalytics(): Promise<DocumentAnalyticsResponse> {
    const response = await apiClient.get<DocumentAnalyticsResponse>('/documents/analytics');
    return response.data;
  }
}

export const documentsService = new DocumentsService();
export default documentsService;
