/**
 * Legacy Calendar API - Deprecated
 * This file is kept for backward compatibility but should not be used in new code.
 * Use the new services in src/services/ instead.
 */

import { API_BASE_URL } from '../../config';

// Mock calendar API for backward compatibility
export const calendarApi = {
  getAppointments: async (params: any) => {
    console.warn('Legacy calendar API call - please update to new services');
    return { data: [] };
  },
  createAppointment: async (data: any) => {
    console.warn('Legacy calendar API call - please update to new services');
    return { data: null };
  },
  updateAppointment: async (id: string, data: any) => {
    console.warn('Legacy calendar API call - please update to new services');
    return { data: null };
  },
  deleteAppointment: async (id: string) => {
    console.warn('Legacy calendar API call - please update to new services');
    return { data: null };
  },
};

// Export individual functions for backward compatibility
export const createAppointment = calendarApi.createAppointment;
export const getAppointments = calendarApi.getAppointments;
export const updateAppointment = calendarApi.updateAppointment;
export const deleteAppointment = calendarApi.deleteAppointment;

export default calendarApi;
