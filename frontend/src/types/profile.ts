// ============================================================================
// PROFILE TYPES - Extended User Profile Management
// ============================================================================

export interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export type NotificationChannel = 'inapp' | 'email' | 'push' | 'sms';

export interface NotificationPreference {
  channel: NotificationChannel;
  module: string;
  enabled: boolean;
  frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

export type LinkedAccountProvider = 'google' | 'outlook' | 'facebook' | 'instagram' | 'linkedin';

export interface LinkedAccount {
  id: string;
  provider: LinkedAccountProvider;
  email: string;
  displayName?: string;
  connectedAt: string;
  lastSyncAt?: string;
  status: 'active' | 'expired' | 'error';
}

export type ApiTokenScope = 'read' | 'write' | 'admin';

export interface ApiToken {
  id: string;
  name: string;
  token: string; // Only shown once on creation
  scopes: ApiTokenScope[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  company?: string;
  position?: string;
  department?: string;
  bio?: string;
  avatar?: string;
  website?: string;
  linkedin?: string;
}

export interface SecuritySettings {
  passwordLastChanged?: string;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'app' | 'sms' | 'email';
  backupCodes?: string[];
  sessionTimeout: number; // minutes
  loginNotifications: boolean;
}

export interface UserPreferences {
  language: 'de' | 'en';
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  theme: 'light' | 'dark' | 'auto';
  compactLayout: boolean;
  sidebarCollapsed: boolean;
  animationsEnabled: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFS: NotificationPreference[] = [
  { channel: 'inapp', module: 'properties', enabled: true, frequency: 'realtime' },
  { channel: 'inapp', module: 'contacts', enabled: true, frequency: 'realtime' },
  { channel: 'inapp', module: 'tasks', enabled: true, frequency: 'realtime' },
  { channel: 'email', module: 'properties', enabled: true, frequency: 'daily' },
  { channel: 'email', module: 'contacts', enabled: false },
  { channel: 'email', module: 'tasks', enabled: true, frequency: 'daily' },
  { channel: 'push', module: 'properties', enabled: false },
  { channel: 'push', module: 'contacts', enabled: false },
  { channel: 'push', module: 'tasks', enabled: true, frequency: 'realtime' },
];
