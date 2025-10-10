/**
 * Configuration for the Real Estate Dashboard
 */

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

export const APP_CONFIG = {
  name: 'Real Estate Dashboard',
  version: '1.0.0',
  api: {
    baseUrl: API_BASE_URL,
    timeout: 10000,
    retryAttempts: 3,
  },
  auth: {
    tokenKey: 'authToken',
    tenantKey: 'tenantId',
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  cache: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
};

export default APP_CONFIG;


