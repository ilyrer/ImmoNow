/**
 * Dashboard Widget Configuration per Role
 * Defines which widgets are available for each user role
 */

export type WidgetCategory = 'analytics' | 'sales' | 'properties' | 'team' | 'activities' | 'finance';

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  description: string;
  category: WidgetCategory;
  roles: string[]; // Roles that can see this widget
  defaultVisible: boolean;
  defaultPosition: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

/**
 * Widget configurations for different roles
 */
export const WIDGET_CONFIGS: WidgetConfig[] = [
  // Analytics Widgets
  {
    id: 'overview_stats',
    type: 'overview_stats',
    title: 'Übersicht',
    description: 'Wichtige Kennzahlen auf einen Blick',
    category: 'analytics',
    roles: ['owner', 'admin', 'manager', 'agent'],
    defaultVisible: true,
    defaultPosition: { x: 0, y: 0, w: 8, h: 7 }
  },
  {
    id: 'revenue_chart',
    type: 'revenue_chart',
    title: 'Umsatzentwicklung',
    description: 'Umsatzentwicklung über die Zeit',
    category: 'analytics',
    roles: ['owner', 'admin', 'manager'],
    defaultVisible: true,
    defaultPosition: { x: 8, y: 0, w: 4, h: 7 }
  },
  {
    id: 'property_performance',
    type: 'property_performance',
    title: 'Immobilien-Performance',
    description: 'Performance-Metriken für Immobilien',
    category: 'analytics',
    roles: ['owner', 'admin', 'manager', 'agent'],
    defaultVisible: true,
    defaultPosition: { x: 0, y: 7, w: 6, h: 4 }
  },
  {
    id: 'lead_conversion',
    type: 'lead_conversion',
    title: 'Lead-Conversion',
    description: 'Conversion-Funnel für Leads',
    category: 'analytics',
    roles: ['owner', 'admin', 'manager'],
    defaultVisible: true,
    defaultPosition: { x: 6, y: 7, w: 6, h: 4 }
  },
  {
    id: 'market_trends',
    type: 'market_trends',
    title: 'Markttrends',
    description: 'Marktentwicklung und Trends',
    category: 'analytics',
    roles: ['owner', 'admin', 'manager'],
    defaultVisible: false,
    defaultPosition: { x: 0, y: 0, w: 8, h: 3 }
  },
  {
    id: 'live_contacts',
    type: 'live_contacts',
    title: 'Live Leads & Kontakte',
    description: 'Quellen, Status & Conversion in Echtzeit',
    category: 'analytics',
    roles: ['owner', 'admin', 'manager', 'agent'],
    defaultVisible: false,
    defaultPosition: { x: 0, y: 0, w: 6, h: 4 }
  },
  {
    id: 'document_activity',
    type: 'document_activity',
    title: 'Dokument-Aktivität',
    description: 'Uploads, Typen und Status in Echtzeit',
    category: 'analytics',
    roles: ['owner', 'admin', 'manager', 'agent', 'viewer'],
    defaultVisible: false,
    defaultPosition: { x: 0, y: 0, w: 6, h: 4 }
  },
  {
    id: 'portfolio_snapshot',
    type: 'portfolio_snapshot',
    title: 'Portfolio-Übersicht',
    description: 'Gesamtportfolio auf einen Blick',
    category: 'analytics',
    roles: ['owner', 'admin', 'manager'],
    defaultVisible: false,
    defaultPosition: { x: 0, y: 0, w: 6, h: 4 }
  },

  // Properties Widgets
  {
    id: 'recent_properties',
    type: 'recent_properties',
    title: 'Neueste Immobilien',
    description: 'Zuletzt hinzugefügte Immobilien',
    category: 'properties',
    roles: ['owner', 'admin', 'manager', 'agent', 'viewer'],
    defaultVisible: false,
    defaultPosition: { x: 0, y: 0, w: 6, h: 4 }
  },

  // Activities Widgets
  {
    id: 'task_progress',
    type: 'task_progress',
    title: 'Aufgaben-Fortschritt',
    description: 'Fortschritt der Aufgaben',
    category: 'activities',
    roles: ['owner', 'admin', 'manager', 'agent'],
    defaultVisible: true,
    defaultPosition: { x: 0, y: 11, w: 6, h: 4 }
  },
  {
    id: 'ops_today',
    type: 'ops_today',
    title: 'Heute & Fälliges',
    description: 'Tägliche Aufgaben und Termine im Blick',
    category: 'activities',
    roles: ['owner', 'admin', 'manager', 'agent'],
    defaultVisible: false,
    defaultPosition: { x: 6, y: 0, w: 6, h: 4 }
  },
  {
    id: 'recent_activities',
    type: 'recent_activities',
    title: 'Letzte Aktivitäten',
    description: 'Aktuelle Aktivitäten im System',
    category: 'activities',
    roles: ['owner', 'admin', 'manager', 'agent', 'viewer'],
    defaultVisible: false,
    defaultPosition: { x: 6, y: 11, w: 6, h: 4 }
  },
  {
    id: 'calendar',
    type: 'calendar',
    title: 'Kalender',
    description: 'Termine und Events',
    category: 'activities',
    roles: ['owner', 'admin', 'manager', 'agent'],
    defaultVisible: false,
    defaultPosition: { x: 0, y: 0, w: 6, h: 4 }
  },
  {
    id: 'document_quick_access',
    type: 'document_quick_access',
    title: 'Schnellzugriff Dokumente',
    description: 'Häufig verwendete Dokumente',
    category: 'activities',
    roles: ['owner', 'admin', 'manager', 'agent', 'viewer'],
    defaultVisible: false,
    defaultPosition: { x: 0, y: 0, w: 6, h: 4 }
  },

  // Finance Widgets
  {
    id: 'finance_overview',
    type: 'finance_overview',
    title: 'Finanz-Übersicht',
    description: 'Finanzielle Kennzahlen',
    category: 'finance',
    roles: ['owner', 'admin'],
    defaultVisible: false,
    defaultPosition: { x: 0, y: 0, w: 6, h: 4 }
  },

  // Team Widgets
  {
    id: 'team_performance',
    type: 'team_performance',
    title: 'Team-Performance',
    description: 'Performance-Metriken des Teams',
    category: 'team',
    roles: ['owner', 'admin', 'manager'],
    defaultVisible: false,
    defaultPosition: { x: 0, y: 0, w: 6, h: 4 }
  },
];

/**
 * Get widgets available for a specific role
 */
export function getWidgetsForRole(role: string): WidgetConfig[] {
  return WIDGET_CONFIGS.filter(widget => widget.roles.includes(role));
}

/**
 * Get default widgets for a role (visible by default)
 */
export function getDefaultWidgetsForRole(role: string): WidgetConfig[] {
  return WIDGET_CONFIGS.filter(
    widget => widget.roles.includes(role) && widget.defaultVisible
  );
}

/**
 * Check if a widget is available for a role
 */
export function isWidgetAvailableForRole(widgetType: string, role: string): boolean {
  const widget = WIDGET_CONFIGS.find(w => w.type === widgetType);
  return widget ? widget.roles.includes(role) : false;
}

