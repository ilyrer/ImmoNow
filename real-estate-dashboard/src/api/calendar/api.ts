/**
 * Legacy Calendar API - Deprecated
 * This file is kept for backward compatibility but should not be used in new code.
 * Use the new services in src/services/ instead.
 */

import apiClient from '../enhancedClient';

// Legacy Calendar API for backward compatibility - now uses enhanced client
export const calendarApi = {
  getAppointments: async (params: any) => {
    try {
      const response = await apiClient.getAppointments(params);
      return { data: response.data };
    } catch (error) {
      console.error('Error getting appointments:', error);
      return { data: [] };
    }
  },
  createAppointment: async (data: any) => {
    try {
      const response = await apiClient.createAppointment(data);
      return { data: response.data };
    } catch (error) {
      console.error('Error creating appointment:', error);
      return { data: null };
    }
  },
  updateAppointment: async (id: string, data: any) => {
    try {
      const response = await apiClient.updateAppointment(id, data);
      return { data: response.data };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return { data: null };
    }
  },
  deleteAppointment: async (id: string) => {
    try {
      await apiClient.deleteAppointment(id);
      return { data: null };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return { data: null };
    }
  },
};

// Export individual functions for backward compatibility
export const createAppointment = calendarApi.createAppointment;
export const getAppointments = calendarApi.getAppointments;
export const updateAppointment = calendarApi.updateAppointment;
export const deleteAppointment = calendarApi.deleteAppointment;

export default calendarApi;
