// ============================================================================
// ADMIN TYPES - Mock Data Types für Admin-Konsole
// ============================================================================

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave';

export interface Employee {
  id: string;
  name: string;
  email: string;
  roleId: string;
  team?: string;
  status: EmployeeStatus;
  lastLogin?: string;
  phone?: string;
  avatar?: string;
  hireDate?: string;
  department?: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  scopes: string[]; // e.g. 'properties.read', 'finance.write'
  description?: string;
  isSystem?: boolean;
}

export type PayrollStatus = 'draft' | 'approved' | 'paid';

export interface PayrollRun {
  id: string;
  month: string; // YYYY-MM
  status: PayrollStatus;
  totalGross: number;
  totalNet: number;
  employeeCount: number;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  createdBy?: string;
}

export interface EmployeeCompensation {
  employeeId: string;
  baseSalary: number;
  commissionPercent: number;
  bonuses?: number;
  iban?: string;
  taxClass?: string;
  socialSecurityNumber?: string;
  currency: string;
}

export type DocSignStatus = 'pending' | 'signed' | 'expired' | 'rejected';

export interface EmployeeDocument {
  id: string;
  employeeId?: string;
  type: 'contract' | 'nda' | 'certificate' | 'id_document' | 'other';
  title: string;
  fileName: string;
  version: string;
  validUntil?: string;
  signStatus: DocSignStatus;
  uploadedAt: string;
  uploadedBy?: string;
  fileSize?: number;
  mimeType?: string;
}

export type AuditResult = 'ok' | 'error' | 'warning';

export interface AuditLog {
  id: string;
  user: string;
  userId: string;
  action: string;
  module: string;
  details?: string;
  timestamp: string;
  result: AuditResult;
  ipAddress?: string;
  userAgent?: string;
}

export interface OrganizationSettings {
  companyName: string;
  logo?: string;
  legalName?: string;
  taxId?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    watermark?: string;
  };
  defaults?: {
    currency: string;
    timezone: string;
    language: string;
  };
  integrations?: {
    google?: { enabled: boolean; clientId?: string };
    outlook?: { enabled: boolean; clientId?: string };
    portals?: { enabled: boolean; apiKeys?: Record<string, string> };
    push?: { enabled: boolean };
  };
}

// Scope definitions for permissions
export const MODULE_SCOPES = {
  properties: ['read', 'write', 'delete', 'export'],
  contacts: ['read', 'write', 'delete', 'export'],
  documents: ['read', 'write', 'delete', 'share'],
  finance: ['read', 'write', 'approve', 'export'],
  kanban: ['read', 'write', 'delete'],
  analytics: ['read', 'export'],
  investors: ['read', 'write', 'manage'],
  social: ['read', 'write', 'publish'],
  communications: ['read', 'write', 'admin'],
  admin: ['users', 'roles', 'settings', 'audit'],
} as const;

export type ModuleName = keyof typeof MODULE_SCOPES;
