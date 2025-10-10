/**
 * Typdefinitionen für die Calendar View API
 */

// Zeitraum für Filterung
export type TimeRange = 'week' | 'month' | 'quarter';

// Verfügbare Eintragstypen
export type EntryType = 'task' | 'meeting' | 'milestone' | 'other';

// Prioritätsstufen (kombiniert aus beiden Formaten)
export type EntryPriority = 'high' | 'medium' | 'low' | 'hoch' | 'mittel' | 'niedrig';

// Status eines Eintrags
export type EntryStatus = 'upcoming' | 'today' | 'overdue' | 'completed' | 'todo' | 'inProgress' | 'review' | 'done';

/**
 * Person mit Name und Avatar
 */
export interface Person {
  name: string;
  avatar: string;
}

/**
 * Kalender-Eintrag (kombiniert Aufgaben und Termine)
 */
export interface CalendarEntry {
  id: string;
  title: string;
  date: string; // Format: "YYYY-MM-DD"
  time?: string;
  type: EntryType;
  priority: EntryPriority;
  team?: string;
  assignees: Person[];
  status: EntryStatus;
  description?: string;
  location?: string;
  // Unterscheidet zwischen verschiedenen Quellen
  entryType: 'deadline' | 'task';
}

/**
 * Parameter zum Filtern der Kalender-Einträge
 */
export interface CalendarFilterParams {
  timeRange?: TimeRange;
  viewMode?: 'month' | 'week' | 'day';
  fromDate?: string;
  toDate?: string;
  entryType?: 'all' | 'deadline' | 'task';
  teamId?: string;
  assigneeId?: string;
  searchTerm?: string;
}

/**
 * Gruppierte Einträge nach Datum
 */
export interface CalendarEntriesByDate {
  [date: string]: CalendarEntry[];
}

/**
 * Antwort auf eine Anfrage nach Kalender-Einträgen
 */
export interface CalendarEntriesResponse {
  entries: CalendarEntry[];
  entriesByDate: CalendarEntriesByDate;
  totalEntries: number;
} 
