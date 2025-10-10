/**
 * Auth Context für Token und Tenant-ID Verwaltung
 * Integriert mit dem API Client
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/api/client';

interface AuthContextType {
  token: string | null;
  tenantId: string | null;
  setAuth: (token: string, tenantId: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const setAuth = (newToken: string, newTenantId: string) => {
    setToken(newToken);
    setTenantId(newTenantId);
    apiClient.setAuth(newToken, newTenantId);
    
    // Persistiere in localStorage
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('tenant_id', newTenantId);
  };

  const clearAuth = () => {
    setToken(null);
    setTenantId(null);
    apiClient.clearAuth();
    
    // Entferne aus localStorage - all possible keys
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('access_token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('tenantSlug');
  };

  // Authentication is valid if we have at least a token
  // Tenant ID is optional for some endpoints
  const isAuthenticated = Boolean(token);

  // Initialisierung beim Mount
  useEffect(() => {
    // Try multiple key names for backward compatibility
    const savedToken = localStorage.getItem('authToken') || 
                        localStorage.getItem('auth_token') || 
                        localStorage.getItem('access_token');
    
    const savedTenantId = localStorage.getItem('tenantId') || 
                          localStorage.getItem('tenant_id') || 
                          localStorage.getItem('tenantSlug');
    
    console.log('🔍 Auth initialization - checking localStorage:', {
      authToken: !!localStorage.getItem('authToken'),
      auth_token: !!localStorage.getItem('auth_token'),
      access_token: !!localStorage.getItem('access_token'),
      tenantId: !!localStorage.getItem('tenantId'),
      tenant_id: !!localStorage.getItem('tenant_id'),
      tenantSlug: !!localStorage.getItem('tenantSlug'),
      foundToken: !!savedToken,
      foundTenantId: !!savedTenantId
    });
    
    if (savedToken) {
      console.log('✅ Loading auth token from localStorage');
      setToken(savedToken);
      
      if (savedTenantId) {
        console.log('✅ Loading tenant ID from localStorage');
        setTenantId(savedTenantId);
        apiClient.setAuth(savedToken, savedTenantId);
      } else {
        console.log('⚠️ No tenant ID found - setting token only');
        // Set token even without tenant ID for now
        apiClient.setAuthToken(savedToken);
      }
    } else {
      console.log('❌ No auth token found in localStorage');
    }
  }, []);

  const value: AuthContextType = {
    token,
    tenantId,
    setAuth,
    clearAuth,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
