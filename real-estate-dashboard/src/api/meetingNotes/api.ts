import {
  MeetingNote,
  MeetingNotesFilterParams,
  CreateMeetingNoteRequest,
  UpdateMeetingNoteRequest,
  MeetingNotesResponse
} from './types';
import { apiClient } from '../config';

/**
 * Holt Besprechungsnotizen basierend auf den angegebenen Filterparametern
 */
export const getMeetingNotes = async (params: MeetingNotesFilterParams = {}): Promise<MeetingNotesResponse> => {
  try {
  const response = await apiClient.get(`/meetings/notes`, { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Besprechungsnotizen:', error);
    throw error;
  }
};

/**
 * Holt eine einzelne Besprechungsnotiz anhand ihrer ID
 */
export const getMeetingNoteById = async (id: string): Promise<MeetingNote> => {
  try {
  const response = await apiClient.get(`/meetings/notes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Abrufen der Besprechungsnotiz mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Erstellt eine neue Besprechungsnotiz
 */
export const createMeetingNote = async (data: CreateMeetingNoteRequest): Promise<MeetingNote> => {
  try {
  const response = await apiClient.post(`/meetings/notes`, data);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen einer neuen Besprechungsnotiz:', error);
    throw error;
  }
};

/**
 * Aktualisiert eine bestehende Besprechungsnotiz
 */
export const updateMeetingNote = async (id: string, data: UpdateMeetingNoteRequest): Promise<MeetingNote> => {
  try {
  const response = await apiClient.put(`/meetings/notes/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Aktualisieren der Besprechungsnotiz mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Löscht eine Besprechungsnotiz
 */
export const deleteMeetingNote = async (id: string): Promise<void> => {
  try {
  await apiClient.delete(`/meetings/notes/${id}`);
  } catch (error) {
    console.error(`Fehler beim Löschen der Besprechungsnotiz mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Exportiert eine Besprechungsnotiz als Datei
 */
export const exportMeetingNote = async (id: string, format: 'pdf' | 'json' = 'pdf'): Promise<Blob> => {
  try {
  const response = await apiClient.get(`/meetings/notes/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Exportieren der Besprechungsnotiz mit ID ${id}:`, error);
    throw error;
  }
};

/**
 * Importiert eine Besprechungsnotiz aus einer Datei
 */
export const importMeetingNote = async (file: File): Promise<MeetingNote> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
  const response = await apiClient.post(`/meetings/notes/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Importieren einer Besprechungsnotiz:', error);
    throw error;
  }
};
