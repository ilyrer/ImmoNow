/**
 * Legacy CRM API - Deprecated
 * This file is kept for backward compatibility but should not be used in new code.
 * Use the new services in src/services/ instead.
 */

import { API_BASE_URL } from '../../config';

// Mock CRM API for backward compatibility
export const crmApi = {
  getContacts: async (params: any) => {
    console.warn('Legacy CRM API call - please update to new services');
    return { data: [] };
  },
  createContact: async (data: any) => {
    console.warn('Legacy CRM API call - please update to new services');
    return { data: null };
  },
  updateContact: async (id: string, data: any) => {
    console.warn('Legacy CRM API call - please update to new services');
    return { data: null };
  },
  deleteContact: async (id: string) => {
    console.warn('Legacy CRM API call - please update to new services');
    return { data: null };
  },
  getRecommendations: async (contactId: string) => {
    console.warn('Legacy CRM API call - please update to new services');
    return { data: [] };
  },
  getContactOverview: async (contactId: string) => {
    console.warn('Legacy CRM API call - please update to new services');
    return { data: null };
  },
};

// Export individual functions for backward compatibility
export const getContacts = crmApi.getContacts;
export const createContact = crmApi.createContact;
export const updateContact = crmApi.updateContact;
export const deleteContact = crmApi.deleteContact;
export const getRecommendations = crmApi.getRecommendations;
export const getContactOverview = crmApi.getContactOverview;

export default crmApi;
