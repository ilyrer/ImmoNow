/**
 * Properties Hooks
 * React Query Hooks für Properties Service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesService, PropertyListParams } from '../services/properties';
import { PropertyResponse, CreatePropertyRequest } from '../lib/api/types';

// Query Keys gemäß Backend Contract
export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (params: PropertyListParams) => [...propertyKeys.lists(), params] as const,
};

/**
 * Hook für Immobilien-Liste
 */
export const useProperties = (params: PropertyListParams) => {
  return useQuery({
    queryKey: propertyKeys.list(params),
    queryFn: () => propertiesService.listProperties(params),
    staleTime: 120_000, // 2 Minuten Cache
  });
};

/**
 * Hook für Immobilie erstellen
 */
export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: propertiesService.createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

/**
 * Hook für Immobilie aktualisieren
 */
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreatePropertyRequest> }) =>
      propertiesService.updateProperty(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};

/**
 * Hook für Immobilie löschen
 */
export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: propertiesService.deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
    },
  });
};
