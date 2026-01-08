/**
 * Auth Context mit Token-Ablauf-Prüfung
 * - Automatische Session-Erneuerung wenn Token abläuft
 * - Automatischer Logout und Redirect zur Login-Seite
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/config';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';

// Utility to decode JWT and get expiration
const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
};

// Utility to get user ID from JWT token
export const getUserIdFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.sub || null;
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
    logger.warn('Force logout', 'AuthContext', { reason });

    // Clear all auth data
    setToken(null);
    setTenantId(null);
    setTokenExpiresAt(null);

    storage.remove('auth_token');
    storage.remove('tenant_id');
    storage.remove('refresh_token');
    storage.remove('authToken');
    storage.remove('tenantId');
    storage.remove('refreshToken');

    apiClient.clearAuth();

    // Show message and reload to login page
    alert(reason + '\n\nBitte melden Sie sich erneut an.');
    window.location.href = '/login';
  }, []);

  const setAuth = (newToken: string, newTenantId: string) => {
    logger.info('Setting auth', 'AuthContext', {
      token: newToken.substring(0, 20) + '...',
      tenantId: newTenantId
    });

    setToken(newToken);
    setTenantId(newTenantId);

    // Calculate and store expiration
    const exp = getTokenExpiration(newToken);
    if (exp) {
      setTokenExpiresAt(new Date(exp));
      logger.debug('Token expires at', 'AuthContext', { expiration: new Date(exp).toISOString() });
    }

    // Speichere in localStorage
    storage.set('auth_token', newToken);
    storage.set('tenant_id', newTenantId);

    // Setze auch im API Client
    apiClient.setAuthToken(newToken, newTenantId);

    logger.info('Auth set successfully', 'AuthContext');
  };

  const clearAuth = () => {
    logger.info('MANUAL clear auth - nur auf expliziten Aufruf', 'AuthContext');
    setToken(null);
    setTenantId(null);
    setTokenExpiresAt(null);

    // Entferne aus localStorage
    storage.remove('auth_token');
    storage.remove('tenant_id');
    storage.remove('refresh_token');

    // Clear auch im API Client
    apiClient.clearAuth();

    logger.info('Auth cleared successfully', 'AuthContext');
  };

  // Authentication is valid if we have a token
  const isAuthenticated = Boolean(token);

  // Initialisierung beim Mount - lade Tokens aus localStorage
  useEffect(() => {
    const savedToken = storage.get<string>('auth_token');
    const savedTenantId = storage.get<string>('tenant_id');

    logger.debug('Initializing from localStorage', 'AuthContext', {
      hasToken: !!savedToken,
      hasTenantId: !!savedTenantId
    });

    if (savedToken && savedTenantId) {
      // Check if token is already expired
      if (isTokenExpired(savedToken, 0)) {
        logger.warn('Saved token is expired, forcing logout', 'AuthContext');
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
      logger.info('Tokens loaded from localStorage', 'AuthContext');
    } else {
      logger.debug('No tokens found in localStorage', 'AuthContext');
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