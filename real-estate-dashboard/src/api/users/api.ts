/**
 * Legacy Users API - Deprecated
 * This file is kept for backward compatibility but should not be used in new code.
 * Use the new services in src/services/ instead.
 */

import { API_BASE_URL } from '../../config';

// Mock users API for backward compatibility
export const usersApi = {
  getUsers: async (params: any) => {
    console.warn('Legacy users API call - please update to new services');
    return { data: [] };
  },
  createUser: async (data: any) => {
    console.warn('Legacy users API call - please update to new services');
    return { data: null };
  },
  updateUser: async (id: string, data: any) => {
    console.warn('Legacy users API call - please update to new services');
    return { data: null };
  },
  deleteUser: async (id: string) => {
    console.warn('Legacy users API call - please update to new services');
    return { data: null };
  },
  listMyCompanyUsers: async (params?: any) => {
    console.warn('Legacy users API call - please update to new services');
    return { data: [] };
  },
};

// Export individual functions for backward compatibility
export const getUsers = usersApi.getUsers;
export const createUser = usersApi.createUser;
export const updateUser = usersApi.updateUser;
export const deleteUser = usersApi.deleteUser;
export const listMyCompanyUsers = usersApi.listMyCompanyUsers;

export default usersApi;
