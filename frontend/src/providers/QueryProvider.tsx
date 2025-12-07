import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// QueryClient Konfiguration mit optimalen Einstellungen für Immobilien-Dashboard
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Globale Query-Einstellungen
      staleTime: 5 * 60 * 1000, // 5 Minuten
      retry: (failureCount, error: any) => {
        // Nicht wiederholen bei 4xx Fehlern (außer 429)
        if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Nicht bei Window Focus refetchen
      refetchOnReconnect: true, // Bei Reconnect refetchen
    },
    mutations: {
      // Globale Mutation-Einstellungen
      retry: (failureCount, error: any) => {
        // Mutations nur bei 5xx oder Network Errors wiederholen
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            duration: 6000, // Längere Dauer für Fehlermeldungen
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* React Query DevTools nur in Development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider; 
