/**
 * Portal Hooks
 * React hooks for portal OAuth and publishing functionality
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { portalService, PortalOAuthRequest, PortalCallbackRequest, PortalRefreshRequest, PortalTestRequest, PublishRequest, UnpublishRequest } from '../services/portals.service';

// Query Keys
export const portalKeys = {
  all: ['portals'] as const,
  publishJobs: () => [...portalKeys.all, 'publishJobs'] as const,
  publishJob: (id: string) => [...portalKeys.all, 'publishJob', id] as const,
  metrics: (portalPropertyId: string) => [...portalKeys.all, 'metrics', portalPropertyId] as const,
};

/**
 * Hook for starting OAuth flow
 */
export const useStartOAuthFlow = () => {
  return useMutation({
    mutationFn: (request: PortalOAuthRequest) => portalService.startOAuthFlow(request),
    onSuccess: (data) => {
      // Open OAuth URL in new window
      window.open(data.authorization_url, '_blank', 'width=600,height=600');
      toast.success(`OAuth-Flow für ${portalService.getPortalDisplayName(data.platform)} gestartet`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Starten der OAuth-Authentifizierung');
    },
  });
};

/**
 * Hook for handling OAuth callback
 */
export const useHandleOAuthCallback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: PortalCallbackRequest) => portalService.handleOAuthCallback(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Erfolgreich mit ${portalService.getPortalDisplayName(data.platform || 'Portal')} verbunden`);
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: portalKeys.all });
      } else {
        toast.error(data.message || 'OAuth-Authentifizierung fehlgeschlagen');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler bei der OAuth-Authentifizierung');
    },
  });
};

/**
 * Hook for refreshing tokens
 */
export const useRefreshToken = () => {
  return useMutation({
    mutationFn: (request: PortalRefreshRequest) => portalService.refreshToken(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Token erfolgreich aktualisiert');
      } else {
        toast.error(data.message || 'Token-Aktualisierung fehlgeschlagen');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Aktualisieren des Tokens');
    },
  });
};

/**
 * Hook for testing portal connection
 */
export const useTestConnection = () => {
  return useMutation({
    mutationFn: (request: PortalTestRequest) => portalService.testConnection(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Verbindung zu ${portalService.getPortalDisplayName(data.platform || 'Portal')} erfolgreich`);
      } else {
        toast.error(data.message || 'Verbindungstest fehlgeschlagen');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Testen der Verbindung');
    },
  });
};

/**
 * Hook for publishing properties
 */
export const usePublishProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: PublishRequest) => portalService.publishProperty(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Immobilie erfolgreich auf ${portalService.getPortalDisplayName(data.portal || 'Portal')} veröffentlicht`);
        // Invalidate publish jobs query
        queryClient.invalidateQueries({ queryKey: portalKeys.publishJobs() });
      } else {
        toast.error(data.message || 'Veröffentlichung fehlgeschlagen');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Veröffentlichen der Immobilie');
    },
  });
};

/**
 * Hook for unpublishing properties
 */
export const useUnpublishProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: UnpublishRequest) => portalService.unpublishProperty(request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Immobilie erfolgreich entfernt');
        // Invalidate publish jobs query
        queryClient.invalidateQueries({ queryKey: portalKeys.publishJobs() });
      } else {
        toast.error(data.message || 'Entfernung fehlgeschlagen');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Entfernen der Immobilie');
    },
  });
};

/**
 * Hook for getting publish jobs
 */
export const usePublishJobs = () => {
  return useQuery({
    queryKey: portalKeys.publishJobs(),
    queryFn: () => portalService.getPublishJobs(),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook for getting specific publish job
 */
export const usePublishJob = (jobId: string) => {
  return useQuery({
    queryKey: portalKeys.publishJob(jobId),
    queryFn: () => portalService.getPublishJob(jobId),
    enabled: !!jobId,
  });
};

/**
 * Hook for getting property metrics
 */
export const usePropertyMetrics = (portalPropertyId: string) => {
  return useQuery({
    queryKey: portalKeys.metrics(portalPropertyId),
    queryFn: () => portalService.getPropertyMetrics(portalPropertyId),
    enabled: !!portalPropertyId,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Hook for syncing all metrics
 */
export const useSyncAllMetrics = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => portalService.syncAllMetrics(),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`${data.synced_count} Metriken synchronisiert`);
        // Invalidate all metrics queries
        queryClient.invalidateQueries({ queryKey: portalKeys.all });
      } else {
        toast.error('Synchronisation fehlgeschlagen');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Synchronisieren der Metriken');
    },
  });
};

/**
 * Hook for retrying failed publish jobs
 */
export const useRetryPublishJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => portalService.retryPublishJob(jobId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Veröffentlichung wiederholt');
        // Invalidate publish jobs query
        queryClient.invalidateQueries({ queryKey: portalKeys.publishJobs() });
      } else {
        toast.error(data.message || 'Wiederholung fehlgeschlagen');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Wiederholen der Veröffentlichung');
    },
  });
};
