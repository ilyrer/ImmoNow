/**
 * Typdefinitionen für die Tasks Board API
 */

// Verfügbare Aufgabenstatus
export type TaskStatus = 'todo' | 'inProgress' | 'review' | 'done';

// Prioritätsstufen
export type TaskPriority = 'hoch' | 'mittel' | 'niedrig';

/**
 * Zugewiesene Person mit Name und Avatar
 */
export interface TaskAssignee {
  name: string;
  avatar: string;
}

/**
 * Unteraufgabe in einer Aufgabe
 */
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * Anhang zu einer Aufgabe
 */
export interface TaskAttachment {
  name: string;
  url: string;
  type: string; // z.B. 'pdf', 'image', 'document'
}

/**
 * Kommentar zu einer Aufgabe
 */
export interface TaskComment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

/**
 * Aufgabe mit allen Details
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: TaskAssignee;
  dueDate: string;
  status: TaskStatus;
  progress: number;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Parameter zum Filtern der Aufgaben
 */
export interface TasksFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  tags?: string[];
  dateRange?: 'today' | 'week' | 'month' | 'all';
  searchTerm?: string;
  dueDate?: string;
}

/**
 * Request-Body zum Erstellen einer neuen Aufgabe
 */
export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: TaskAssignee;
  dueDate: string;
  status: TaskStatus;
  tags?: string[];
  subtasks?: Omit<Subtask, 'id'>[];
}

/**
 * Request-Body zum Aktualisieren einer bestehenden Aufgabe
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assignee?: TaskAssignee;
  dueDate?: string;
  status?: TaskStatus;
  progress?: number;
  tags?: string[];
  subtasks?: Omit<Subtask, 'id'>[];
}

/**
 * Antwort auf eine Anfrage nach Aufgaben
 */
export interface TasksResponse {
  [status: string]: Task[];
}

/**
 * KPI-Daten für Aufgaben
 */
export interface TasksKPIData {
  totalTasks: number;
  overdueTasks: number;
  averageDuration: string;
  successRate: number;
} 
