import { apiClient } from '../config';
import { 
  Activity,
  ActivityFilterParams,
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivitiesResponse
} from './types';


/**
 * Holt alle Aktivitäten basierend auf den angegebenen Filterparametern
 */
export const getActivities = async (params: ActivityFilterParams = {}): Promise<ActivitiesResponse> => {
  try {
  const response = await apiClient.get(`/activities`, { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Aktivitäten:', error);
    throw error;
  }
};

/**
 * Holt eine einzelne Aktivität anhand ihrer ID
 */
export const getActivityById = async (id: string): Promise<Activity> => {
  try {
  const response = await apiClient.get(`/activities/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Abrufen der Aktivität mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Erstellt eine neue Aktivität
 */
export const createActivity = async (data: CreateActivityRequest): Promise<Activity> => {
  try {
  const response = await apiClient.post(`/activities`, data);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen einer neuen Aktivität:', error);
    throw error;
  }
};

/**
 * Aktualisiert eine bestehende Aktivität
 */
export const updateActivity = async (id: string, data: UpdateActivityRequest): Promise<Activity> => {
  try {
  const response = await apiClient.put(`/activities/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren der Aktivität mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Löscht eine Aktivität anhand ihrer ID
 */
export const deleteActivity = async (id: string): Promise<void> => {
  try {
  await apiClient.delete(`/activities/${id}`);
  } catch (error) {
    console.error(`Fehler beim Löschen der Aktivität mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Holt alle verfügbaren Projekte für die Filterung und Zuweisung
 */
export const getProjects = async (): Promise<{ id: string, name: string }[]> => {
  try {
  const response = await apiClient.get(`/projects`);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Projekte:', error);
    throw error;
  }
}; 
