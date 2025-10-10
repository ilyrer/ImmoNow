import { apiClient } from '../config';
import {
  Deadline,
  DeadlinesFilterParams,
  CreateDeadlineRequest,
  UpdateDeadlineRequest,
  DeadlinesResponse,
  Person
} from './types';

// Using centralized apiClient with base URL and interceptors

/**
 * Holt Termine basierend auf den angegebenen Filterparametern
 */
export const getDeadlines = async (params: DeadlinesFilterParams = {}): Promise<DeadlinesResponse> => {
  try {
    // Backend has no /deadlines; approximate via /calendar/appointments
    const response = await apiClient.get(`/calendar/appointments`, { params: {
      start_date: params.fromDate,
      end_date: params.toDate,
      search: params.searchTerm
    }});
    // Expect consumer to handle shape differences elsewhere
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine:', error);
    throw error;
  }
};

/**
 * Holt einen einzelnen Termin anhand seiner ID
 */
export const getDeadlineById = async (id: string): Promise<Deadline> => {
  try {
  // No direct endpoint; fetch appointment by id
  const response = await apiClient.get(`/calendar/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Abrufen des Termins mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Erstellt einen neuen Termin
 */
export const createDeadline = async (data: CreateDeadlineRequest): Promise<Deadline> => {
  try {
  // Map to calendar appointment creation
  const response = await apiClient.post(`/calendar/appointments`, data);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen eines neuen Termins:', error);
    throw error;
  }
};

/**
 * Aktualisiert einen bestehenden Termin
 */
export const updateDeadline = async (id: string, data: UpdateDeadlineRequest): Promise<Deadline> => {
  try {
  const response = await apiClient.patch(`/calendar/appointments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Termins mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Löscht einen Termin
 */
export const deleteDeadline = async (id: string): Promise<void> => {
  try {
  await apiClient.delete(`/calendar/appointments/${id}`);
  } catch (error) {
    console.error(`Fehler beim Löschen des Termins mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Aktualisiert den Status eines Termins
 */
export const updateDeadlineStatus = async (id: string, status: 'upcoming' | 'today' | 'overdue' | 'completed'): Promise<Deadline> => {
  try {
  const response = await apiClient.patch(`/calendar/appointments/${id}`, { status });
  return response.data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren des Status für Termin mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Ruft verfügbare Teammitglieder ab
 */
export const getTeamMembers = async (): Promise<Person[]> => {
  try {
  // Not available; return empty list for now
  return [] as Person[];
  } catch (error) {
    console.error('Fehler beim Abrufen der Teammitglieder:', error);
    throw error;
  }
}; 
