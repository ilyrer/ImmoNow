/**
 * Typdefinitionen für die Team-Performance API
 */

export type TimeRange = 'week' | 'month' | 'quarter';

/**
 * Performance-Daten für ein Team oder eine Person
 */
export interface PerformanceData {
  name: string;
  ziel: number;
  aktuell: number;
  color?: string;
}

/**
 * Detaillierte Performance-Daten für Trends
 */
export interface DetailedPerformanceData {
  name: string;
  ziel: number;
  aktuell: number;
}

/**
 * Ein Top-Performer mit Erfolgsdetails
 */
export interface Performer {
  id: string;
  name: string;
  team: string;
  teamId: string;
  achievement: string;
  performanceValue: string;
  avatar: string;
}

/**
 * Ein Kommentar oder Tipp von einem Teammitglied
 */
export interface Comment {
  id: string;
  userId: string;
  name: string;
  comment: string;
  weekId: string;
  timestamp: string;
  upvotes: number;
  anonymous: boolean;
  upvotedBy: string[];  // Liste von Benutzer-IDs, die diesen Kommentar upgevoted haben
}

/**
 * Ein Teamziel
 */
export interface TeamGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  category: string;
}

/**
 * Parameter zum Filtern der Performance-Daten
 */
export interface PerformanceFilterParams {
  timeRange?: TimeRange;
  teamId?: string;
  userId?: string;
}

/**
 * Antwort auf eine Anfrage nach Team-Performance-Daten
 */
export interface TeamPerformanceResponse {
  teamPerformance: PerformanceData[];
  detailedPerformance: DetailedPerformanceData[];
  topPerformers: Performer[];
  goals?: TeamGoal[];
}

/**
 * Request-Body zum Erstellen eines neuen Kommentars
 */
export interface CreateCommentRequest {
  userId: string;
  comment: string;
  weekId: string;
  anonymous: boolean;
}

/**
 * Antwort auf eine Anfrage nach Kommentaren
 */
export interface CommentsResponse {
  items: Comment[];
  total: number;
} 
