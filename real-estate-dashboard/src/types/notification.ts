/**
 * Notification Types
 * Vollständige Type-Definitionen für das Notification System
 */

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  REMINDER = 'reminder',
}

export enum NotificationCategory {
  SYSTEM = 'system',
  PROPERTY = 'property',
  CONTACT = 'contact',
  TASK = 'task',
  APPOINTMENT = 'appointment',
  DOCUMENT = 'document',
  FINANCIAL = 'financial',
  MESSAGE = 'message',
  TEAM = 'team',
  CIM = 'cim',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  archived: boolean;
  archived_at: string | null;
  action_url: string | null;
  action_label: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  related_entity_title: string | null;
  metadata: Record<string, any>;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
  stats?: NotificationStats;
}

export interface NotificationCreate {
  user_id: string;
  type?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_title?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

export interface NotificationUpdate {
  read?: boolean;
  archived?: boolean;
}

export interface NotificationMarkAsRead {
  notification_ids: string[];
}

export interface NotificationBulkAction {
  notification_ids: string[];
  action: 'mark_read' | 'mark_unread' | 'archive' | 'delete';
}

export interface NotificationPreference {
  id: string;
  category: NotificationCategory;
  enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  min_priority: NotificationPriority;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceUpdate {
  category: NotificationCategory;
  enabled?: boolean;
  email_enabled?: boolean;
  push_enabled?: boolean;
  in_app_enabled?: boolean;
  min_priority?: NotificationPriority;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface NotificationFilter {
  read?: boolean;
  archived?: boolean;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  type?: NotificationType;
  from_date?: string;
  to_date?: string;
}

// UI Helpers
export interface NotificationIconConfig {
  icon: string;
  color: string;
  bgColor: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationIconConfig> = {
  [NotificationType.INFO]: {
    icon: 'ri-information-line',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  [NotificationType.SUCCESS]: {
    icon: 'ri-checkbox-circle-line',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  [NotificationType.WARNING]: {
    icon: 'ri-alert-line',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  [NotificationType.ERROR]: {
    icon: 'ri-error-warning-line',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  [NotificationType.REMINDER]: {
    icon: 'ri-alarm-line',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

export const NOTIFICATION_CATEGORY_CONFIG: Record<NotificationCategory, { label: string; icon: string }> = {
  [NotificationCategory.SYSTEM]: { label: 'System', icon: 'ri-settings-3-line' },
  [NotificationCategory.PROPERTY]: { label: 'Immobilien', icon: 'ri-building-line' },
  [NotificationCategory.CONTACT]: { label: 'Kontakte', icon: 'ri-user-line' },
  [NotificationCategory.TASK]: { label: 'Aufgaben', icon: 'ri-task-line' },
  [NotificationCategory.APPOINTMENT]: { label: 'Termine', icon: 'ri-calendar-line' },
  [NotificationCategory.DOCUMENT]: { label: 'Dokumente', icon: 'ri-file-text-line' },
  [NotificationCategory.FINANCIAL]: { label: 'Finanzen', icon: 'ri-money-euro-circle-line' },
  [NotificationCategory.MESSAGE]: { label: 'Nachrichten', icon: 'ri-message-3-line' },
  [NotificationCategory.TEAM]: { label: 'Team', icon: 'ri-team-line' },
  [NotificationCategory.CIM]: { label: 'CIM', icon: 'ri-dashboard-line' },
};

export const NOTIFICATION_PRIORITY_CONFIG: Record<NotificationPriority, { label: string; color: string }> = {
  [NotificationPriority.LOW]: { label: 'Niedrig', color: 'text-gray-500' },
  [NotificationPriority.NORMAL]: { label: 'Normal', color: 'text-blue-500' },
  [NotificationPriority.HIGH]: { label: 'Hoch', color: 'text-orange-500' },
  [NotificationPriority.URGENT]: { label: 'Dringend', color: 'text-red-500' },
};
