/**
 * Properties Hooks - Vollständige React Query Integration
 * Mit Optimistic Updates, Prefetch, Caching
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { propertiesService, PropertyListParams } from '../services/properties';
import { PropertyResponse } from '../lib/api/types';
import {
  PropertyListResponse,
  PropertyMetrics,
  PropertyMedia,
  PropertyAnalytics,
  CreatePropertyPayload,
  UpdatePropertyPayload,
} from '../types/property';
import { toast } from 'react-hot-toast';

// Query Keys - Hierarchische Struktur
export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (params: PropertyListParams) => [...propertyKeys.lists(), params] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  metrics: (id: string) => [...propertyKeys.detail(id), 'metrics'] as const,
  media: (id: string) => [...propertyKeys.detail(id), 'media'] as const,
  analytics: (id: string) => [...propertyKeys.detail(id), 'analytics'] as const,
};

/**
 * Hook für Immobilien-Liste mit Pagination
 */
export const useProperties = (
  params: PropertyListParams,
  options?: UseQueryOptions<PropertyListResponse>
) => {
  return useQuery({
    queryKey: propertyKeys.list(params),
    queryFn: () => propertiesService.listProperties(params),
    staleTime: 2 * 60 * 1000, // 2 Minuten
    gcTime: 5 * 60 * 1000, // 5 Minuten (früher: cacheTime)
    ...options,
  });
};

/**
 * Hook für einzelne Immobilie
 */
export const useProperty = (
  id: string,
  options?: UseQueryOptions<PropertyResponse>
) => {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertiesService.getProperty(id),
    staleTime: 5 * 60 * 1000, // 5 Minuten
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook für Property Metrics
 */
export const usePropertyMetrics = (
  id: string,
  options?: UseQueryOptions<PropertyMetrics>
) => {
  return useQuery({
    queryKey: propertyKeys.metrics(id),
    queryFn: () => propertiesService.getMetrics(id),
    staleTime: 1 * 60 * 1000, // 1 Minute (Metrics ändern sich häufiger)
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook für Property Media
 */
export const usePropertyMedia = (
  id: string,
  options?: UseQueryOptions<PropertyMedia[]>
) => {
  return useQuery({
    queryKey: propertyKeys.media(id),
    queryFn: () => propertiesService.getMedia(id),
    staleTime: 5 * 60 * 1000, // 5 Minuten
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook für Property Analytics
 */
export const usePropertyAnalytics = (
  id: string,
  options?: UseQueryOptions<PropertyAnalytics>
) => {
  return useQuery({
    queryKey: propertyKeys.analytics(id),
    queryFn: () => propertiesService.getAnalytics(id),
    staleTime: 5 * 60 * 1000, // 5 Minuten
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook für Immobilie erstellen
 */
export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreatePropertyPayload) => propertiesService.createProperty(payload),
    onSuccess: (data) => {
      // Invalidate alle Listen
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      toast.success('Immobilie erfolgreich erstellt!');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Fehler beim Erstellen der Immobilie';
      toast.error(message);
    },
  });
};

/**
 * Hook für Immobilie aktualisieren (mit Optimistic Update)
 */
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePropertyPayload }) =>
      propertiesService.updateProperty(id, payload),
    
    // Optimistic Update
    onMutate: async ({ id, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: propertyKeys.detail(id) });
      
      // Snapshot previous value
      const previousProperty = queryClient.getQueryData<PropertyResponse>(propertyKeys.detail(id));
      
      // Optimistically update
      if (previousProperty) {
        queryClient.setQueryData<PropertyResponse>(propertyKeys.detail(id), (old) => {
          if (!old) return old;
          return {
            ...old,
            ...payload,
            updated_at: new Date().toISOString(),
          } as PropertyResponse;
        });
      }
      
      return { previousProperty };
    },
    
    onSuccess: (data, { id }) => {
      // Update mit echten Daten
      queryClient.setQueryData(propertyKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      toast.success('Immobilie erfolgreich aktualisiert!');
    },
    
    onError: (error: any, { id }, context) => {
      // Rollback on error
      if (context?.previousProperty) {
        queryClient.setQueryData(propertyKeys.detail(id), context.previousProperty);
      }
      const message = error?.response?.data?.detail || 'Fehler beim Aktualisieren der Immobilie';
      toast.error(message);
    },
  });
};

/**
 * Hook für Immobilie löschen (mit Optimistic Update)
 */
export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => propertiesService.deleteProperty(id),
    
    // Optimistic Update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: propertyKeys.lists() });
      
      // Remove from all lists
      const previousLists = queryClient.getQueriesData<PropertyListResponse>({
        queryKey: propertyKeys.lists(),
      });
      
      previousLists.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData<PropertyListResponse>(queryKey, {
            ...data,
            items: data.items.filter(p => p.id !== id),
            total: data.total - 1,
          });
        }
      });
      
      return { previousLists };
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      toast.success('Immobilie erfolgreich gelöscht!');
    },
    
    onError: (error: any, id, context) => {
      // Rollback
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      const message = error?.response?.data?.detail || 'Fehler beim Löschen der Immobilie';
      toast.error(message);
    },
  });
};

/**
 * Hook für Media Upload
 */
export const useUploadPropertyMedia = (propertyId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ files, onProgress }: { files: File[]; onProgress?: (progress: number) => void }) =>
      propertiesService.uploadMedia(propertyId, files, { onProgress }),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.media(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
      toast.success('Medien erfolgreich hochgeladen!');
    },
    
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Fehler beim Hochladen der Medien';
      toast.error(message);
    },
  });
};

/**
 * Hook für Media löschen
 */
export const useDeletePropertyMedia = (propertyId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mediaId: string) => propertiesService.deleteMedia(propertyId, mediaId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.media(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
      toast.success('Medium erfolgreich gelöscht!');
    },
    
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Fehler beim Löschen des Mediums';
      toast.error(message);
    },
  });
};

/**
 * Hook für Hauptbild setzen
 */
export const useSetPrimaryMedia = (propertyId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mediaId: string) => propertiesService.setPrimaryMedia(propertyId, mediaId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.media(propertyId) });
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
      toast.success('Hauptbild erfolgreich gesetzt!');
    },
    
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Fehler beim Setzen des Hauptbildes';
      toast.error(message);
    },
  });
};

/**
 * Hook für Favorit Toggle
 */
export const useTogglePropertyFavorite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      propertiesService.toggleFavorite(id, isFavorite),
    
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(id) });
    },
  });
};

/**
 * Hook für Bulk Actions
 */
export const useBulkPropertyAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ action, propertyIds }: { action: 'delete' | 'archive' | 'publish'; propertyIds: string[] }) =>
      propertiesService.bulkAction(action, propertyIds),
    
    onSuccess: (_, { action, propertyIds }) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      toast.success(`${propertyIds.length} Immobilien erfolgreich ${action === 'delete' ? 'gelöscht' : action === 'archive' ? 'archiviert' : 'veröffentlicht'}!`);
    },
    
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Fehler bei der Bulk-Aktion';
      toast.error(message);
    },
  });
};

/**
 * Prefetch Property Detail (für Hover)
 */
export const usePrefetchProperty = () => {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: propertyKeys.detail(id),
      queryFn: () => propertiesService.getProperty(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};
