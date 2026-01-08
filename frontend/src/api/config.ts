/**
 * API Configuration
 * Centralized API client configuration
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';
import { createErrorFromResponse, isAuthError, getUserFriendlyMessage } from '../utils/errorHandler';

// Create base axios instance
const baseClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
baseClient.interceptors.request.use(
  (config) => {
    // Check both possible token locations for backwards compatibility
    const token = storage.get<string>('auth_token') || storage.get<string>('authToken');
    const tenantId = storage.get<string>('tenant_id') || storage.get<string>('tenantId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', 'API', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and data extraction
baseClient.interceptors.response.use(
  (response) => {
    // Return just the data, not the full axios response
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (isAuthError(error)) {
      logger.warn('401 Unauthorized - token expired or invalid', 'API');

      // Check if we're not already on the login page to prevent loops
      if (!window.location.pathname.includes('/login')) {
        // Clear all auth data
        storage.remove('auth_token');
        storage.remove('tenant_id');
        storage.remove('refresh_token');
        storage.remove('authToken');
        storage.remove('tenantId');
        storage.remove('refreshToken');

        // Show user-friendly message and redirect to login
        const message = getUserFriendlyMessage(error);
        alert(message);
        window.location.href = '/login';
      }
    } else {
      // Log other errors
      const apiError = createErrorFromResponse(error.response || error);
      logger.error('API request failed', 'API', apiError);
    }
    return Promise.reject(error);
  }
);

// Extended API client interface that returns data directly (not AxiosResponse)
interface ApiClient {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  uploadFile: <T = any>(url: string, file: File, metadata?: any, onProgress?: (progress: number) => void) => Promise<T>;
  setAuthToken: (token: string, tenantId?: string) => void;
  clearAuth: () => void;
  defaults: AxiosInstance['defaults'];
  interceptors: AxiosInstance['interceptors'];
}

const apiClient = baseClient as unknown as ApiClient;

// Add helper methods
(apiClient as any).setAuthToken = (token: string, tenantId?: string) => {
  storage.set('authToken', token);
  if (tenantId) {
    storage.set('tenantId', tenantId);
  }
};

(apiClient as any).clearAuth = () => {
  storage.remove('authToken');
  storage.remove('tenantId');
};

/**
 * Upload a file with metadata
 * @param url - Upload endpoint URL
 * @param file - File to upload
 * @param metadata - Additional metadata
 * @param onProgress - Optional progress callback
 * @returns Promise with response data
 */
apiClient.uploadFile = async <T = any>(url: string, file: File, metadata?: any, onProgress?: (progress: number) => void): Promise<T> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = storage.get<string>('authToken');
  const tenantId = storage.get<string>('tenantId');

  // Build URL with metadata as query parameter
  let uploadUrl = url;
  if (metadata) {
    const metadataJson = JSON.stringify(metadata);
    uploadUrl = `${url}?metadata=${encodeURIComponent(metadataJson)}`;

    logger.debug('Upload request', 'API', {
      file: file.name,
      size: file.size,
      metadata,
      url: uploadUrl
    });
  }

  const response = await axios.post(uploadUrl, formData, {
    baseURL: baseClient.defaults.baseURL,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(tenantId && { 'X-Tenant-ID': tenantId }),
    },
    timeout: 60000, // 60 seconds for file uploads
    onUploadProgress: onProgress ? (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
      onProgress(percentCompleted);
    } : undefined,
  });

  logger.info('Upload successful', 'API', { fileName: file.name });
  return response.data;
};

export { apiClient };
export default apiClient;
