export interface Document {
  id: string;
  name: string;
  originalName: string;
  title: string;
  type: DocumentType;
  category: DocumentCategory;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  propertyId?: string;
  propertyTitle?: string;
  contactId?: string;
  contactName?: string;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  lastModified: string;
  version: number;
  versions: DocumentVersion[];
  tags: string[];
  description?: string;
  expiryDate?: string;
  isPublic: boolean;
  isFavorite: boolean;
  viewCount: number;
  views?: number;
  downloadCount: number;
  permissions: DocumentPermission[];
  metadata: DocumentMetadata;
  ocrText?: string;
  digitalSignature?: DigitalSignature;
}

export type DocumentVisibility = 
  | 'private'   // Nur für den Ersteller sichtbar
  | 'team'      // Alle User der Firma (Standard)
  | 'shared'    // Mit bestimmten Usern geteilt
  | 'public';   // Öffentlich zugänglich

export type DocumentType = 
  | 'contract'
  | 'expose'
  | 'energy_certificate'
  | 'floor_plan'
  | 'photo'
  | 'video'
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'pdf'
  | 'other';

export type DocumentCategory = 
  | 'verkauf'
  | 'vermietung'
  | 'verwaltung'
  | 'marketing'
  | 'legal'
  | 'finance'
  | 'personal'
  | 'template';

export type DocumentStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'final'
  | 'signed'
  | 'expired'
  | 'archived';

export interface DocumentTag {
  id: string;
  name: string;
  description?: string;
  color: string;
  usageCount: number;
}

export interface DocumentShare {
  id: string;
  shareToken: string;
  recipientEmail?: string;
  recipientName?: string;
  shareType: 'link' | 'email' | 'direct';
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canComment: boolean;
  };
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DocumentAnalytics {
  // Basic counts (new structure)
  totalDocuments: number;
  totalFolders: number;
  totalViews: number;
  viewsThisMonth: number;
  favoriteDocuments: number;
  sharedDocuments: number;
  
  // Storage info
  storageUsed: number;
  storageLimit?: number;
  
  // Most viewed documents
  mostViewedDocuments?: Array<{
    id: string;
    title: string;
    type: DocumentType;
    views: number;
  }>;
  
  // Legacy structure for backwards compatibility
  summary?: {
    totalDocuments: number;
    myDocuments: number;
    sharedDocuments: number;
    favoriteDocuments: number;
  };
  
  // Original analytics structure
  counts: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    myDocuments: number;
    sharedDocuments: number;
    favoriteDocuments: number;
  };
  charts: {
    byType: Array<{ document_type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  recentActivities: Array<{
    id: string;
    activityType: string;
    description: string;
    document: { id: string; title: string };
    user: { name: string; email?: string };
    createdAt: string;
  }>;
}

export interface DocumentFilter {
  search?: string;
  type?: DocumentType[];
  category?: DocumentCategory[];
  status?: DocumentStatus[];
  visibility?: DocumentVisibility[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  propertyId?: string;
  contactId?: string;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  folderId?: string;
  hasExpiry?: boolean;
  isExpired?: boolean;
  favorites?: boolean;
}

// Export all existing interfaces and constants
export interface DocumentVersion {
  id: string;
  version: number;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  changes: string;
  isActive: boolean;
}

export interface DocumentPermission {
  userId: string;
  userName: string;
  role: 'viewer' | 'editor' | 'admin';
  grantedBy: string;
  grantedAt: string;
}

export interface DocumentMetadata {
  author?: string;
  subject?: string;
  keywords?: string[];
  createdWith?: string;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  customFields: Record<string, any>;
}

export interface DigitalSignature {
  signedBy: string;
  signedAt: string;
  signatureHash: string;
  certificateId: string;
  isValid: boolean;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: DocumentType;
  category: DocumentCategory;
  templateUrl: string;
  thumbnailUrl?: string;
  fields: TemplateField[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: FieldValidation;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  color: string;
  icon: string;
  isSystem: boolean;
  permissions: DocumentPermission[];
  createdBy: string;
  createdAt: string;
  documentCount: number;
  subfolders: DocumentFolder[];
}

export interface DocumentUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  documentId?: string;
  category?: DocumentCategory;
  propertyId?: string;
  contactId?: string;
  tags?: string[];
  description?: string;
}

export interface DocumentFilter {
  search?: string;
  type?: DocumentType[];
  category?: DocumentCategory[];
  status?: DocumentStatus[];
  propertyId?: string;
  contactId?: string;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  folderId?: string;
  hasExpiry?: boolean;
  isExpired?: boolean;
}

export interface DocumentSort {
  field: 'name' | 'uploadedAt' | 'lastModified' | 'size' | 'type' | 'status';
  direction: 'asc' | 'desc';
}

// Document visibility icons and colors  
export const DOCUMENT_VISIBILITY_ICONS: Record<DocumentVisibility, string> = {
  'private': '🔒',     // Schloss für privat
  'team': '👥',        // Team-Icon für Team  
  'shared': '🔗',      // Share-Icon für geteilt
  'public': '🌐'       // Welt-Icon für öffentlich
};

export const DOCUMENT_VISIBILITY_COLORS: Record<DocumentVisibility, string> = {
  'private': 'text-red-600',
  'team': 'text-blue-600', 
  'shared': 'text-green-600',
  'public': 'text-purple-600'
};

export const DOCUMENT_VISIBILITY_LABELS: Record<DocumentVisibility, string> = {
  'private': 'Privat',
  'team': 'Team',
  'shared': 'Geteilt', 
  'public': 'Öffentlich'
};

export const DOCUMENT_VISIBILITY_BG_COLORS: Record<DocumentVisibility, string> = {
  'private': 'bg-red-50 text-red-700 border-red-200',
  'team': 'bg-blue-50 text-blue-700 border-blue-200',
  'shared': 'bg-green-50 text-green-700 border-green-200',
  'public': 'bg-purple-50 text-purple-700 border-purple-200'
};

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  contract: 'ri-file-text-line',
  expose: 'ri-image-line',
  energy_certificate: 'ri-leaf-line',
  floor_plan: 'ri-layout-line',
  photo: 'ri-camera-line',
  video: 'ri-video-line',
  document: 'ri-file-line',
  presentation: 'ri-slideshow-line',
  spreadsheet: 'ri-file-excel-line',
  pdf: 'ri-file-pdf-line',
  other: 'ri-file-unknow-line'
};

export const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  contract: 'text-blue-600 dark:text-blue-400',
  expose: 'text-purple-600 dark:text-purple-400',
  energy_certificate: 'text-green-600 dark:text-green-400',
  floor_plan: 'text-orange-600 dark:text-orange-400',
  photo: 'text-pink-600 dark:text-pink-400',
  video: 'text-red-600 dark:text-red-400',
  document: 'text-gray-600 dark:text-gray-400',
  presentation: 'text-indigo-600 dark:text-indigo-400',
  spreadsheet: 'text-emerald-600 dark:text-emerald-400',
  pdf: 'text-red-600 dark:text-red-400',
  other: 'text-gray-600 dark:text-gray-400'
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  verkauf: 'Verkauf',
  vermietung: 'Vermietung',
  verwaltung: 'Verwaltung',
  marketing: 'Marketing',
  legal: 'Rechtliches',
  finance: 'Finanzen',
  personal: 'Personal',
  template: 'Vorlagen'
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Entwurf',
  review: 'Prüfung',
  approved: 'Genehmigt',
  final: 'Final',
  signed: 'Unterzeichnet',
  expired: 'Abgelaufen',
  archived: 'Archiviert'
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  review: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  final: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  signed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}; 
