import { apiClient } from '../config';
import {
  ProjectStatusFilterParams,
  ProjectStatusOverviewResponse,
  ProjectDetail,
  ProjectDetailsResponse
} from './types';


/**
 * Holt Übersichtsdaten zum Projektstatus basierend auf den angegebenen Filterparametern
 */
export const getProjectStatusOverview = async (params: ProjectStatusFilterParams = {}): Promise<ProjectStatusOverviewResponse> => {
  try {
  const response = await apiClient.get(`/projects/status/overview`, { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Projektstatus-Übersicht:', error);
    throw error;
  }
};

/**
 * Holt detaillierte Projektlisten mit Status-Informationen
 */
export const getProjectDetails = async (
  params: ProjectStatusFilterParams & { offset?: number; limit?: number; }
): Promise<ProjectDetailsResponse> => {
  try {
  const response = await apiClient.get(`/projects`, { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Projektdetails:', error);
    throw error;
  }
};

/**
 * Holt ein einzelnes Projekt anhand seiner ID
 */
export const getProjectById = async (id: string): Promise<ProjectDetail> => {
  try {
  const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Abrufen des Projekts mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Holt die Liste aller verfügbaren Immobilientypen
 */
export const getPropertyTypes = async (): Promise<{ id: string; name: string }[]> => {
  try {
  const response = await apiClient.get(`/property-types`);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Immobilientypen:', error);
    throw error;
  }
};

/**
 * Aktualisiert den Status eines Projekts
 */
export const updateProjectStatus = async (
  id: string, 
  status: 'onTrack' | 'atRisk' | 'delayed' | 'completed'
): Promise<ProjectDetail> => {
  try {
  const response = await apiClient.patch(`/projects/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Status für Projekt mit ID ${id}:`, error);
    throw error;
  }
}; 
