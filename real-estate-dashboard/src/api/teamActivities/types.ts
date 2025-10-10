/**
 * Typdefinitionen für die Team-Aktivitäten API
 */

export type ActivityType = 'milestone' | 'achievement' | 'update' | 'feedback';
export type ActivityImpact = 'positive' | 'neutral' | 'negative';
export type TimeRange = 'week' | 'month' | 'quarter';

export interface User {
  id: string;
  name: string;
  avatar: string;
}

/**
 * Repräsentiert eine einzelne Team-Aktivität
 */
export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  project?: string;
  impact?: ActivityImpact;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Parameter zum Filtern von Aktivitäten
 */
export interface ActivityFilterParams {
  timeRange?: TimeRange;
  type?: ActivityType;
  searchTerm?: string;
  projectId?: string;
  impact?: ActivityImpact;
  date?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Request-Body zum Erstellen einer neuen Aktivität
 */
export interface CreateActivityRequest {
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  userId: string;  // ID des Benutzers, der die Aktivität erstellt
  projectId?: string;
  impact?: ActivityImpact;
  tags?: string[];
}

/**
 * Request-Body zum Aktualisieren einer bestehenden Aktivität
 */
export interface UpdateActivityRequest {
  type?: ActivityType;
  title?: string;
  description?: string;
  date?: string;
  projectId?: string;
  impact?: ActivityImpact;
  tags?: string[];
}

/**
 * Antwort auf eine Anfrage nach mehreren Aktivitäten
 */
export interface ActivitiesResponse {
  items: Activity[];
  total: number;
  offset: number;
  limit: number;
} 
