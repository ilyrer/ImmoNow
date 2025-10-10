/**
 * Appointments Hooks
 * React Query Hooks für Appointments Service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService, AppointmentListParams } from '../services/appointments';
import { AppointmentResponse, CreateAppointmentRequest } from '../lib/api/types';

// Query Keys gemäß Backend Contract
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (params: AppointmentListParams) => [...appointmentKeys.lists(), params] as const,
};

/**
 * Hook für Termin-Liste
 */
export const useAppointments = (params: AppointmentListParams = {}) => {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => appointmentsService.listAppointments(params),
    staleTime: 60_000, // 1 Minute Cache
  });
};

/**
 * Hook für Termin erstellen
 */
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: appointmentsService.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
};

/**
 * Hook für Termin aktualisieren
 */
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateAppointmentRequest> }) =>
      appointmentsService.updateAppointment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
};

/**
 * Hook für Termin löschen
 */
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: appointmentsService.deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
};
