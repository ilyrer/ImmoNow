import { apiClient } from '../config';
import {
  PerformanceFilterParams,
  TeamPerformanceResponse,
  Performer,
  CreateCommentRequest,
  Comment,
  CommentsResponse,
  TeamGoal
} from './types';

// Uses centralized client base URL

/**
 * Holt Performance-Daten basierend auf den angegebenen Filterparametern
 */
export const getTeamPerformance = async (params: PerformanceFilterParams = {}): Promise<TeamPerformanceResponse> => {
  try {
  const response = await apiClient.get(`/team/performance`, { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Team-Performance-Daten:', error);
    throw error;
  }
};

/**
 * Holt die Liste der Top-Performer
 */
export const getTopPerformers = async (params: PerformanceFilterParams = {}): Promise<Performer[]> => {
  try {
  const response = await apiClient.get(`/team/performers`, { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Top-Performer:', error);
    throw error;
  }
};

/**
 * Erstellt einen neuen Performer (für Admin/Management)
 */
export const createPerformer = async (data: Omit<Performer, 'id'>): Promise<Performer> => {
  try {
  const response = await apiClient.post(`/team/performers`, data);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen eines neuen Performers:', error);
    throw error;
  }
};

/**
 * Holt Kommentare der Teammitglieder
 */
export const getComments = async (weekId?: string): Promise<CommentsResponse> => {
  try {
    const params = weekId ? { weekId } : {};
  const response = await apiClient.get(`/team/comments`, { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Team-Kommentare:', error);
    throw error;
  }
};

/**
 * Erstellt einen neuen Kommentar
 */
export const createComment = async (data: CreateCommentRequest): Promise<Comment> => {
  try {
  const response = await apiClient.post(`/team/comments`, data);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Erstellen eines neuen Kommentars:', error);
    throw error;
  }
};

/**
 * Upvoted einen Kommentar
 */
export const upvoteComment = async (commentId: string, userId: string): Promise<Comment> => {
  try {
  const response = await apiClient.post(`/team/comments/${commentId}/upvote`, { userId });
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Upvoten des Kommentars mit ID ${commentId}:`, error);
    throw error;
  }
};

/**
 * Entfernt einen Upvote von einem Kommentar
 */
export const removeUpvote = async (commentId: string, userId: string): Promise<Comment> => {
  try {
  const response = await apiClient.post(`/team/comments/${commentId}/remove-upvote`, { userId });
    return response.data;
  } catch (error) {
    console.error(`Fehler beim Entfernen des Upvotes vom Kommentar mit ID ${commentId}:`, error);
    throw error;
  }
};

/**
 * Holt Team-Ziele
 */
export const getTeamGoals = async (teamId?: string): Promise<TeamGoal[]> => {
  try {
    const params = teamId ? { teamId } : {};
  const response = await apiClient.get(`/team/goals`, { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Team-Ziele:', error);
    throw error;
  }
}; 
