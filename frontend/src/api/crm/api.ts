/**
 * Legacy CRM API - Deprecated
 * This file is kept for backward compatibility but should not be used in new code.
 * Use the new services in src/services/ instead.
 */

import { API_BASE_URL } from '../../config';
import { apiClient } from '../config';

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
  getRecommendations: async (contactId: string, limit: number = 10) => {
    try {
      const response = await apiClient.get(`/api/v1/contacts/${contactId}/matching-properties?limit=${limit}`);
      return { properties: response };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return { properties: [] };
    }
  },
  getContactOverview: async (contactId: string) => {
    try {
      const [contact, tasksRes, appointmentsRes, leadScore, matches] = await Promise.all([
        apiClient.get(`/api/v1/contacts/${contactId}`),
        apiClient.get('/api/v1/tasks', {
          params: {
            tags: [`contact:${contactId}`],
            page: 1,
            size: 50,
            sort_by: 'due_date',
            sort_order: 'asc'
          }
        }),
        apiClient.get('/api/v1/appointments', {
          params: {
            contact_id: contactId,
            page: 1,
            size: 50,
            sort_order: 'asc'
          }
        }),
        apiClient.get(`/api/v1/contacts/${contactId}/lead-score`).catch(() => null),
        apiClient.get(`/api/v1/contacts/${contactId}/matching-properties?limit=10`).catch(() => [])
      ]);

      const tasks = (tasksRes as any)?.items || [];
      const appointments = (appointmentsRes as any)?.items || [];
      const leadScoreValue = (leadScore as any)?.score ?? (contact as any)?.lead_score ?? null;
      const leadQuality = leadScoreValue !== null ? {
        score: leadScoreValue,
        level: leadScoreValue >= 70 ? 'high' : leadScoreValue >= 40 ? 'medium' : 'low',
        factors: ((leadScore as any)?.signals || []).map((s: any) => s.name).filter(Boolean)
      } : null;

      const budgetValue =
        (contact as any)?.budget ??
        (contact as any)?.budget_max ??
        (contact as any)?.budget_min ??
        null;
      const budgetCurrency = (contact as any)?.budget_currency || 'EUR';
      const budgetAnalysis = {
        formatted: budgetValue
          ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: budgetCurrency, maximumFractionDigits: 0 }).format(budgetValue)
          : 'Kein Budget angegeben',
        avg: budgetValue ? Number(budgetValue) : 0
      };

      return {
        contact,
        tasks,
        appointments,
        leadScore,
        leadQuality,
        budgetAnalysis,
        perfectMatches: Array.isArray(matches) ? matches : (matches as any)?.items || [],
        matchingProperties: Array.isArray(matches) ? matches : (matches as any)?.items || [],
      };
    } catch (error) {
      console.error('❌ Error loading contact overview:', error);
      return {
        tasks: [],
        appointments: [],
        leadScore: null,
        leadQuality: null,
        budgetAnalysis: { formatted: 'Kein Budget angegeben', avg: 0 },
        matchingProperties: [],
        perfectMatches: [],
      };
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
