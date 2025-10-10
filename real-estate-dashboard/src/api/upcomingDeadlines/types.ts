/**
 * Typdefinitionen für die Upcoming Deadlines API
 */

// Zeitraum für Filterung
export type TimeRange = 'week' | 'month' | 'quarter';

// Verfügbare Termintypen
export type DeadlineType = 'task' | 'meeting' | 'milestone' | 'other';

// Prioritätsstufen
export type DeadlinePriority = 'high' | 'medium' | 'low';

// Status eines Termins
export type DeadlineStatus = 'upcoming' | 'today' | 'overdue' | 'completed';

/**
 * Person mit Name und Avatar
 */
export interface Person {
  name: string;
  avatar: string;
}

/**
 * Termin/Frist mit allen Details
 */
export interface Deadline {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: DeadlineType;
  priority: DeadlinePriority;
  team: string;
  assignees: Person[];
  status: DeadlineStatus;
  description?: string;
  location?: string;
  reminder?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parameter zum Filtern der Termine
 */
export interface DeadlinesFilterParams {
  timeRange?: TimeRange;
  status?: DeadlineStatus;
  type?: DeadlineType;
  priority?: DeadlinePriority;
  teamId?: string;
  assigneeId?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

/**
 * Request-Body zum Erstellen eines neuen Termins
 */
export interface CreateDeadlineRequest {
  title: string;
  date: string;
  time?: string;
  type: DeadlineType;
  priority: DeadlinePriority;
  team: string;
  assignees: Person[];
  description?: string;
  location?: string;
  reminder?: boolean;
}

/**
 * Request-Body zum Aktualisieren eines bestehenden Termins
 */
export interface UpdateDeadlineRequest {
  title?: string;
  date?: string;
  time?: string;
  type?: DeadlineType;
  priority?: DeadlinePriority;
  team?: string;
  assignees?: Person[];
  status?: DeadlineStatus;
  description?: string;
  location?: string;
  reminder?: boolean;
}

/**
 * Antwort auf eine Anfrage nach Terminen
 */
export interface DeadlinesResponse {
  items: Deadline[];
  total: number;
  upcoming: number;
  today: number;
  overdue: number;
  completed: number;
} 
