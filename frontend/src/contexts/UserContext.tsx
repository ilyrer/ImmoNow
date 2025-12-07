import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, DEFAULT_ROLE_PERMISSIONS, DEFAULT_DASHBOARD_LAYOUTS } from '../types/user';
import apiService from '../services/api.service';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (module: string, action: string) => boolean;
  switchRole: (role: UserRole) => void;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load current user from backend or local storage
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Prefer backend /auth/me
        const me = await apiService.getCurrentUserInfo();
        if (!mounted) return;
        const normalized: User = {
          id: String((me as any).id),
          email: (me as any).email,
          name: `${(me as any).first_name || ''} ${(me as any).last_name || ''}`.trim() || (me as any).email,
          role: ((me as any).role || 'admin') as UserRole,
          plan: (me as any).plan || 'Professional',
          avatar: undefined,
          permissions: DEFAULT_ROLE_PERMISSIONS[((me as any).role || 'admin') as UserRole],
          preferences: {
            dashboardLayout: DEFAULT_DASHBOARD_LAYOUTS[((me as any).role || 'admin') as UserRole],
            theme: 'auto',
            notifications: {
              email: true,
              push: true,
              cim_reminders: true,
              deadline_alerts: true,
              team_updates: true,
              market_alerts: true,
            },
            defaultView: 'dashboard',
          },
          teamId: undefined,
          managedProperties: [],
        };
        setUser(normalized);
      } catch {
        // Fallback to user from localStorage set during login
        const local = await apiService.getCurrentUser();
        if (local) {
          const fallback: User = {
            id: String((local as any).id),
            email: (local as any).email,
            name: `${(local as any).first_name || ''} ${(local as any).last_name || ''}`.trim() || (local as any).email,
            role: ((local as any).role || 'admin') as UserRole,
            plan: (local as any).plan || 'Professional',
            permissions: DEFAULT_ROLE_PERMISSIONS[((local as any).role || 'admin') as UserRole],
            preferences: {
              dashboardLayout: DEFAULT_DASHBOARD_LAYOUTS[((local as any).role || 'admin') as UserRole],
              theme: 'auto',
              notifications: { email: true, push: true, cim_reminders: true, deadline_alerts: true, team_updates: true, market_alerts: true },
              defaultView: 'dashboard',
            },
            avatar: undefined,
            teamId: undefined,
            managedProperties: [],
          };
          setUser(fallback);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check specific permissions - safe check for undefined permissions
    if (!user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }
    
    return user.permissions.some(permission => 
      (permission.module === module || permission.module === 'all') &&
      permission.actions.includes(action as any)
    );
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      role,
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
      preferences: {
        ...user.preferences,
        dashboardLayout: DEFAULT_DASHBOARD_LAYOUTS[role]
      }
    };
    
    setUser(updatedUser);
    
  // TODO: persist on backend if needed
  };

  const updateUserPreferences = (preferences: Partial<User['preferences']>) => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences
      }
    };
    
    setUser(updatedUser);
    
    // In real app, this would save to API/localStorage
    localStorage.setItem('userPreferences', JSON.stringify(updatedUser.preferences));
  };

  const value: UserContextType = {
    user,
    setUser,
    hasPermission,
    switchRole,
    updateUserPreferences,
    isLoading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 
