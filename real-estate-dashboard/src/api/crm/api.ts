/**
 * Legacy CRM API - Deprecated
 * This file is kept for backward compatibility but should not be used in new code.
 * Use the new services in src/services/ instead.
 */

import apiClient from '../enhancedClient';

// Legacy CRM API for backward compatibility - now uses enhanced client
export const crmApi = {
  getContacts: async (params: any) => {
    try {
      const response = await apiClient.getContacts(params);
      return { data: response.data };
    } catch (error) {
      console.error('Error getting contacts:', error);
      return { data: [] };
    }
  },
  createContact: async (data: any) => {
    try {
      const response = await apiClient.createContact(data);
      return { data: response.data };
    } catch (error) {
      console.error('Error creating contact:', error);
      return { data: null };
    }
  },
  updateContact: async (id: string, data: any) => {
    try {
      const response = await apiClient.updateContact(id, data);
      return { data: response.data };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { data: null };
    }
  },
  deleteContact: async (id: string) => {
    try {
      await apiClient.deleteContact(id);
      return { data: null };
    } catch (error) {
      console.error('Error deleting contact:', error);
      return { data: null };
    }
  },
  getRecommendations: async (contactId: string, limit: number = 10) => {
    try {
      const response = await apiClient.getMatchingProperties(contactId, limit);
      return { properties: response.data };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return { properties: [] };
    }
  },
  getContactOverview: async (contactId: string) => {
    try {
      const response = await apiClient.getContact(contactId);
      return { data: response.data };
    } catch (error) {
      console.error('Error getting contact overview:', error);
      return { data: null };
    }
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
