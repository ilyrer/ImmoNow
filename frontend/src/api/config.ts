/**
 * API Configuration
 * Centralized API client configuration
 */

import axios, { AxiosInstance } from 'axios';

// Create base axios instance
const baseClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
baseClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
baseClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Extended API client with upload functionality
interface ExtendedApiClient extends AxiosInstance {
  uploadFile: <T = any>(url: string, file: File, metadata?: any) => Promise<T>;
}

const apiClient = baseClient as ExtendedApiClient;

/**
 * Upload a file with metadata
 * @param url - Upload endpoint URL
 * @param file - File to upload
 * @param metadata - Additional metadata
 * @returns Promise with response data
 */
apiClient.uploadFile = async <T = any>(url: string, file: File, metadata?: any): Promise<T> => {
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
  });
  
  console.log('✅ Upload successful:', response.data);
  return response.data;
};

export { apiClient };
export default apiClient;
