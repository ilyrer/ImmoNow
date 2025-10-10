export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: string;
  avatar?: string;
  permissions: Permission[];
  preferences: UserPreferences;
  teamId?: string;
  managedProperties?: string[];
}

export type UserRole = 'admin' | 'team_leader' | 'makler' | 'assistant';

export interface Permission {
  module: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
}

export interface UserPreferences {
  dashboardLayout: DashboardWidget[];
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  defaultView: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  position: { x: number; y: number; w: number; h: number };
  visible: boolean;
  config?: any;
}

export type WidgetType = 
  | 'overview_stats'
  | 'recent_properties' 
  | 'cim_reminders'
  | 'team_performance'
  | 'personal_tasks'
  | 'calendar'
  | 'market_trends'
  | 'revenue_chart'
  | 'conversion_funnel'
  | 'document_quick_access'
  | 'property_map';

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  cim_reminders: boolean;
  deadline_alerts: boolean;
  team_updates: boolean;
  market_alerts: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { module: 'all', actions: ['read', 'write', 'delete', 'admin'] }
  ],
  team_leader: [
    { module: 'dashboard', actions: ['read', 'write'] },
    { module: 'properties', actions: ['read', 'write', 'delete'] },
    { module: 'cim', actions: ['read', 'write', 'delete'] },
    { module: 'team', actions: ['read', 'write'] },
    { module: 'analytics', actions: ['read', 'write'] },
    { module: 'documents', actions: ['read', 'write', 'delete'] },
    { module: 'contacts', actions: ['read', 'write', 'delete'] }
  ],
  makler: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'properties', actions: ['read', 'write'] },
    { module: 'cim', actions: ['read', 'write'] },
    { module: 'contacts', actions: ['read', 'write'] },
    { module: 'documents', actions: ['read', 'write'] },
    { module: 'calendar', actions: ['read', 'write'] }
  ],
  assistant: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'properties', actions: ['read'] },
    { module: 'contacts', actions: ['read', 'write'] },
    { module: 'calendar', actions: ['read', 'write'] },
    { module: 'documents', actions: ['read'] }
  ]
};

export const DEFAULT_DASHBOARD_LAYOUTS: Record<UserRole, DashboardWidget[]> = {
  admin: [
    { id: 'overview_stats', type: 'overview_stats', position: { x: 0, y: 0, w: 12, h: 4 }, visible: true },
    { id: 'revenue_chart', type: 'revenue_chart', position: { x: 0, y: 4, w: 8, h: 6 }, visible: true },
    { id: 'team_performance', type: 'team_performance', position: { x: 8, y: 4, w: 4, h: 6 }, visible: true },
    { id: 'market_trends', type: 'market_trends', position: { x: 0, y: 10, w: 6, h: 5 }, visible: true },
    { id: 'conversion_funnel', type: 'conversion_funnel', position: { x: 6, y: 10, w: 6, h: 5 }, visible: true }
  ],
  team_leader: [
    { id: 'overview_stats', type: 'overview_stats', position: { x: 0, y: 0, w: 12, h: 4 }, visible: true },
    { id: 'team_performance', type: 'team_performance', position: { x: 0, y: 4, w: 8, h: 6 }, visible: true },
    { id: 'cim_reminders', type: 'cim_reminders', position: { x: 8, y: 4, w: 4, h: 6 }, visible: true },
    { id: 'recent_properties', type: 'recent_properties', position: { x: 0, y: 10, w: 8, h: 5 }, visible: true },
    { id: 'calendar', type: 'calendar', position: { x: 8, y: 10, w: 4, h: 5 }, visible: true }
  ],
  makler: [
    { id: 'personal_tasks', type: 'personal_tasks', position: { x: 0, y: 0, w: 4, h: 6 }, visible: true },
    { id: 'recent_properties', type: 'recent_properties', position: { x: 4, y: 0, w: 8, h: 6 }, visible: true },
    { id: 'cim_reminders', type: 'cim_reminders', position: { x: 0, y: 6, w: 4, h: 6 }, visible: true },
    { id: 'calendar', type: 'calendar', position: { x: 4, y: 6, w: 4, h: 6 }, visible: true },
    { id: 'property_map', type: 'property_map', position: { x: 8, y: 6, w: 4, h: 6 }, visible: true }
  ],
  assistant: [
    { id: 'personal_tasks', type: 'personal_tasks', position: { x: 0, y: 0, w: 6, h: 6 }, visible: true },
    { id: 'calendar', type: 'calendar', position: { x: 6, y: 0, w: 6, h: 6 }, visible: true },
    { id: 'recent_properties', type: 'recent_properties', position: { x: 0, y: 6, w: 8, h: 6 }, visible: true },
    { id: 'document_quick_access', type: 'document_quick_access', position: { x: 8, y: 6, w: 4, h: 6 }, visible: true }
  ]
}; 
