/**
 * Multi-Portal Publishing Feature Types
 * 
 * These types define the structure for publishing properties
 * to multiple real estate portals with validation and tracking.
 */

export type Portal = 'scout24' | 'immowelt' | 'ebay';
export type PublishJobStatus = 'draft' | 'scheduled' | 'sent' | 'live' | 'error';
export type MappingStatus = 'ok' | 'warn' | 'error' | 'missing';
export type FieldRequirement = 'required' | 'optional' | 'recommended';

/**
 * Portal configuration and credentials
 */
export interface PortalConfig {
  id: string;
  portal: Portal;
  name: string;
  isActive: boolean;
  apiKey?: string;
  credentials?: Record<string, any>;
  lastSync?: string;
  syncEnabled: boolean;
}

/**
 * Field mapping validation for a portal
 */
export interface FieldMapping {
  field: string;
  label: string;
  status: MappingStatus;
  requirement: FieldRequirement;
  value?: any;
  message?: string;
  portalField?: string;
}

/**
 * Validation result for a property on a specific portal
 */
export interface PortalValidation {
  portal: Portal;
  isValid: boolean;
  mappings: FieldMapping[];
  errors: string[];
  warnings: string[];
  missingRequired: string[];
}

/**
 * Media selection for publishing
 */
export interface PublishMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  order: number;
  caption?: string;
  altText?: string;
}

/**
 * Contact profile for portal publishing
 */
export interface PublishContactProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  isDefault: boolean;
}

/**
 * Publishing job that tracks the sync status
 */
export interface PublishJob {
  id: string;
  propertyId: string;
  portals: Portal[];
  status: PublishJobStatus;
  runAt: string | null; // null = immediate, otherwise ISO timestamp
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  externalId?: string;
  lastLog?: string;
  errorDetails?: string;
  retryCount?: number;
  maxRetries?: number;
  contactProfileId?: string;
  mediaIds?: string[];
  validations?: PortalValidation[];
}

/**
 * Portal listing details
 */
export interface PortalListing {
  id: string;
  propertyId: string;
  portal: Portal;
  externalId: string;
  status: 'active' | 'inactive' | 'expired' | 'error';
  url?: string;
  views?: number;
  leads?: number;
  publishedAt: string;
  lastSyncAt?: string;
  expiresAt?: string;
}

/**
 * Sync log entry
 */
export interface SyncLogEntry {
  id: string;
  propertyId: string;
  portal: Portal;
  action: 'create' | 'update' | 'delete' | 'sync';
  status: 'success' | 'failed' | 'pending';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Request to create a publish job
 */
export interface CreatePublishJobRequest {
  propertyId: string;
  portals: Portal[];
  runAt?: string | null;
  contactProfileId?: string;
  mediaIds?: string[];
  validateOnly?: boolean;
}

/**
 * Portal statistics
 */
export interface PortalStats {
  portal: Portal;
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalLeads: number;
  averageViewsPerListing: number;
  conversionRate: number;
}
