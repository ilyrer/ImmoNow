/**
 * Typdefinitionen für die Projektstatus API
 */

export type TimeRange = 'week' | 'month' | 'quarter';
export type ProjectStatus = 'onTrack' | 'atRisk' | 'delayed' | 'completed';

/**
 * Repräsentiert einen einzelnen Projektstatus-Eintrag für die Übersicht
 */
export interface ProjectStatusEntry {
  name: string;
  value: number;
  color: string;
}

/**
 * Repräsentiert eine einzelne Immobilienart mit Status-Details
 */
export interface PropertyTypeStatus {
  name: string;
  onTrack: number;
  atRisk: number;
  delayed: number;
  completed: number;
}

/**
 * Parameter zum Filtern der Projektstatus-Daten
 */
export interface ProjectStatusFilterParams {
  timeRange?: TimeRange;
  teamId?: string;
  propertyTypeId?: string;
}

/**
 * Antwort auf eine Anfrage nach Projektstatus-Übersichtsdaten
 */
export interface ProjectStatusOverviewResponse {
  statusData: ProjectStatusEntry[];
  propertyTypes: PropertyTypeStatus[];
  totalProjects: number;
}

/**
 * Detaillierte Projektinformationen
 */
export interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;  // 0-100%
  startDate: string;
  endDate: string;
  propertyTypeId: string;
  propertyTypeName: string;
  teamId: string;
  teamName: string;
  budget: {
    planned: number;
    actual: number;
    currency: string;
  };
  milestones: {
    id: string;
    name: string;
    dueDate: string;
    completed: boolean;
  }[];
}

/**
 * Antwort auf eine Anfrage nach detaillierten Projektinformationen
 */
export interface ProjectDetailsResponse {
  items: ProjectDetail[];
  total: number;
  offset: number;
  limit: number;
} 
