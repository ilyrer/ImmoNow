import { apiClient } from '../config';
import {
  Task,
  TasksFilterParams,
  CreateTaskRequest,
  UpdateTaskRequest,
  TasksResponse,
  TasksKPIData,
  TaskStatus,
  TaskComment
} from './types';

// Using centralized apiClient with base URL and interceptors

/**
 * Holt Aufgaben basierend auf den angegebenen Filterparametern
 */
export const getTasks = async (params: TasksFilterParams = {}): Promise<TasksResponse> => {
  try {
  const response = await apiClient.get(`/tasks`, { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Aufgaben:', error);
    throw error;
  }
};

/**
 * Holt eine einzelne Aufgabe anhand ihrer ID
 */
export const getTaskById = async (id: string): Promise<Task> => {
  try {
  const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Abrufen der Aufgabe mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Erstellt eine neue Aufgabe
 */
export const createTask = async (data: CreateTaskRequest): Promise<Task> => {
  try {
  const response = await apiClient.post(`/tasks`, data);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen einer neuen Aufgabe:', error);
    throw error;
  }
};

/**
 * Aktualisiert eine bestehende Aufgabe
 */
export const updateTask = async (id: string, data: UpdateTaskRequest): Promise<Task> => {
  try {
  // Backend expects PATCH for updates
  const response = await apiClient.patch(`/tasks/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren der Aufgabe mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Löscht eine Aufgabe
 */
export const deleteTask = async (id: string): Promise<void> => {
  try {
  await apiClient.delete(`/tasks/${id}`);
  } catch (error) {
    console.error(`Fehler beim Löschen der Aufgabe mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Aktualisiert den Status einer Aufgabe (z.B. bei Drag & Drop)
 */
export const updateTaskStatus = async (id: string, newStatus: TaskStatus): Promise<Task> => {
  try {
  // Map to generic task update since specific /status route doesn't exist
  const response = await apiClient.patch(`/tasks/${id}`, { status: newStatus });
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Status für Aufgabe mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Fügt einen Kommentar zu einer Aufgabe hinzu
 */
export const addTaskComment = async (taskId: string, text: string, user: string): Promise<TaskComment> => {
  try {
  // Backend expects schemas.TaskCommentCreate; use { content }
  const response = await apiClient.post(`/tasks/${taskId}/comments`, { content: text });
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Hinzufügen eines Kommentars zur Aufgabe mit ID ${taskId}:`, error);
    throw error;
  }
};

/**
 * Holt KPI-Daten für Aufgaben
 */
export const getTasksKPI = async (): Promise<TasksKPIData> => {
  try {
  // Not implemented in backend; provide empty fallback shape from /tasks/analytics
  const response = await apiClient.get(`/tasks/analytics`);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der KPI-Daten:', error);
    throw error;
  }
};

/**
 * Holt alle verfügbaren Tags für die Aufgabenfilterung
 */
export const getAvailableTags = async (): Promise<string[]> => {
  try {
  // Not implemented in backend; return empty array for now
  return [] as string[];
  } catch (error) {
    console.error('Fehler beim Abrufen der verfügbaren Tags:', error);
    throw error;
  }
}; 
