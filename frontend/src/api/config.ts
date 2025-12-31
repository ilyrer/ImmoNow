/**
 * API Configuration
 * Centralized API client configuration
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

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
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('tenantId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    return config;
  },
  (error) => {
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
    if (error.response?.status === 401) {
      console.warn('🔐 API: 401 Unauthorized - token expired or invalid');

      // Check if we're not already on the login page to prevent loops
      if (!window.location.pathname.includes('/login')) {
        // Clear all auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('tenant_id');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('refreshToken');

        // Show message and redirect to login
        alert('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
        window.location.href = '/login';
      }
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
  localStorage.setItem('authToken', token);
  if (tenantId) {
    localStorage.setItem('tenantId', tenantId);
  }
};

(apiClient as any).clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tenantId');
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

  const token = localStorage.getItem('authToken');
  const tenantId = localStorage.getItem('tenantId');

  // Build URL with metadata as query parameter
  let uploadUrl = url;
  if (metadata) {
    const metadataJson = JSON.stringify(metadata);
    uploadUrl = `${url}?metadata=${encodeURIComponent(metadataJson)}`;

    console.log('📤 Upload request:');
    console.log('  File:', file.name, `(${file.size} bytes)`);
    console.log('  Metadata:', metadata);
    console.log('  JSON:', metadataJson);
    console.log('  URL:', uploadUrl);
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

  console.log('✅ Upload successful:', response.data);
  return response.data;
};

export { apiClient };
export default apiClient;
