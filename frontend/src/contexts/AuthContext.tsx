/**
 * Auth Context mit Token-Ablauf-Prüfung
 * - Automatische Session-Erneuerung wenn Token abläuft
 * - Automatischer Logout und Redirect zur Login-Seite
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';

// Utility to decode JWT and get expiration
const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
};

// Check if token is expired or about to expire (within 5 minutes)
const isTokenExpired = (token: string, bufferMinutes: number = 5): boolean => {
  const exp = getTokenExpiration(token);
  if (!exp) return true;
  const bufferMs = bufferMinutes * 60 * 1000;
  return Date.now() >= (exp - bufferMs);
};

interface AuthContextType {
  token: string | null;
  tenantId: string | null;
  setAuth: (token: string, tenantId: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
  tokenExpiresAt: Date | null;
  forceLogout: (reason?: string) => void;
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
  const [tokenExpiresAt, setTokenExpiresAt] = useState<Date | null>(null);

  // Force logout with reason - clears auth and reloads page to login
  const forceLogout = useCallback((reason: string = 'Ihre Sitzung ist abgelaufen') => {
    console.log('⚠️ AuthContext: Force logout -', reason);

    // Clear all auth data
    setToken(null);
    setTenantId(null);
    setTokenExpiresAt(null);

    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('refreshToken');

    apiClient.clearAuth();

    // Show message and reload to login page
    alert(reason + '\n\nBitte melden Sie sich erneut an.');
    window.location.href = '/login';
  }, []);

  const setAuth = (newToken: string, newTenantId: string) => {
    console.log('🔐 AuthContext: Setting auth', {
      token: newToken.substring(0, 20) + '...',
      tenantId: newTenantId
    });

    setToken(newToken);
    setTenantId(newTenantId);

    // Calculate and store expiration
    const exp = getTokenExpiration(newToken);
    if (exp) {
      setTokenExpiresAt(new Date(exp));
      console.log('⏰ Token expires at:', new Date(exp).toLocaleString('de-DE'));
    }

    // Speichere in localStorage
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('tenant_id', newTenantId);

    // Setze auch im API Client
    apiClient.setAuthToken(newToken, newTenantId);

    console.log('✅ AuthContext: Auth set successfully');
  };

  const clearAuth = () => {
    console.log('🚪 AuthContext: MANUAL clear auth - nur auf expliziten Aufruf');
    setToken(null);
    setTenantId(null);
    setTokenExpiresAt(null);

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
      // Check if token is already expired
      if (isTokenExpired(savedToken, 0)) {
        console.log('❌ AuthContext: Saved token is expired, forcing logout');
        forceLogout('Ihre Sitzung ist abgelaufen');
        return;
      }

      setToken(savedToken);
      setTenantId(savedTenantId);

      const exp = getTokenExpiration(savedToken);
      if (exp) {
        setTokenExpiresAt(new Date(exp));
      }

      apiClient.setAuthToken(savedToken, savedTenantId);
      console.log('✅ AuthContext: Tokens loaded from localStorage');
    } else {
      console.log('⚠️ AuthContext: No tokens found in localStorage');
    }
  }, [forceLogout]);

  // Token expiration checker - runs every minute
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired(token, 1)) {
        // Token expires in less than 1 minute
        forceLogout('Ihre Sitzung ist abgelaufen');
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Then check every 30 seconds
    const interval = setInterval(checkTokenExpiration, 30000);

    return () => clearInterval(interval);
  }, [token, forceLogout]);

  const value: AuthContextType = {
    token,
    tenantId,
    setAuth,
    clearAuth,
    isAuthenticated,
    tokenExpiresAt,
    forceLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};