/**
 * EINFACHER Auth Context - KEINE automatischen Löschungen
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
    console.log('🔐 AuthContext: Setting auth', {
      token: newToken.substring(0, 20) + '...',
      tenantId: newTenantId
    });
    
    setToken(newToken);
    setTenantId(newTenantId);
    
    // Speichere in localStorage - EINFACH
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('tenant_id', newTenantId);
    
    // Setze auch im API Client
    apiClient.setAuthToken(newToken, newTenantId);
    
    console.log('✅ AuthContext: Auth set successfully');
    
    // Debug localStorage nach setAuth
    setTimeout(() => {
      console.log('🔍 localStorage after setAuth:', {
        auth_token: localStorage.getItem('auth_token'),
        tenant_id: localStorage.getItem('tenant_id')
      });
    }, 50);
  };

  const clearAuth = () => {
    console.log('🚪 AuthContext: Clearing auth (manual or automatic)');
    setToken(null);
    setTenantId(null);
    
    // Entferne aus localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('refresh_token');
    
    // Clear auch im API Client
    apiClient.clearAuth();
    
    console.log('✅ AuthContext: Auth cleared successfully');
  };

  // Authentication is valid if we have a token
  const isAuthenticated = Boolean(token);

  // Initialisierung beim Mount - lade Tokens aus localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedTenantId = localStorage.getItem('tenant_id');
    
    console.log('🔄 AuthContext: Initializing from localStorage', {
      hasToken: !!savedToken,
      hasTenantId: !!savedTenantId
    });
    
    if (savedToken && savedTenantId) {
      // Prüfe Token-Ablauf vor dem Laden
      if (apiClient.checkTokenExpiry()) {
        setToken(savedToken);
        setTenantId(savedTenantId);
        apiClient.setAuthToken(savedToken, savedTenantId);
        console.log('✅ AuthContext: Tokens loaded from localStorage');
      } else {
        console.log('⚠️ AuthContext: Token abgelaufen - nicht geladen');
      }
    } else {
      console.log('⚠️ AuthContext: No tokens found in localStorage');
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