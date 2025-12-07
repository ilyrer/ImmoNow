/**
 * Typdefinitionen für die Meeting Notes API
 */

// Zeitraum für Filterung
export type TimeRange = 'week' | 'month' | 'quarter';

/**
 * Besprechungsnotiz mit allen Details
 */
export interface MeetingNote {
  id: string;
  title: string;
  date: string;
  participants: string[];
  content: string;
  decisions: string[];
  tasks: {
    task: string;
    assignee: string;
  }[];
  category?: 'vertrieb' | 'marketing' | 'management' | string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parameter zum Filtern der Besprechungsnotizen
 */
export interface MeetingNotesFilterParams {
  timeRange?: TimeRange;
  searchTerm?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Request-Body zum Erstellen einer neuen Besprechungsnotiz
 */
export interface CreateMeetingNoteRequest {
  title: string;
  date: string;
  participants: string[];
  content: string;
  decisions: string[];
  tasks: {
    task: string;
    assignee: string;
  }[];
  category?: string;
}

/**
 * Request-Body zum Aktualisieren einer bestehenden Besprechungsnotiz
 */
export interface UpdateMeetingNoteRequest {
  title?: string;
  date?: string;
  participants?: string[];
  content?: string;
  decisions?: string[];
  tasks?: {
    task: string;
    assignee: string;
  }[];
  category?: string;
}

/**
 * Antwort auf eine Anfrage nach Besprechungsnotizen
 */
export interface MeetingNotesResponse {
  items: MeetingNote[];
  total: number;
  offset?: number;
  limit?: number;
} 
