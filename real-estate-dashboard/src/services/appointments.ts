/**
 * Appointments Service
 * Implementiert alle Appointment-Endpunkte aus dem Backend Contract
 */

import { apiClient } from '../lib/api/client';
import {
  AppointmentResponse,
  CreateAppointmentRequest
} from '../lib/api/types';

export interface AppointmentListParams {
  start_date?: string;
  end_date?: string;
  status?: string;
  type?: string;
  property_id?: string;
  contact_id?: string;
}

class AppointmentsService {
  /**
   * GET /appointments - Termine auflisten
   */
  async listAppointments(params: AppointmentListParams = {}): Promise<AppointmentResponse[]> {
    const response = await apiClient.get<AppointmentResponse[]>('/appointments', { params });
    return response;
  }

  /**
   * POST /appointments - Termin erstellen
   */
  async createAppointment(payload: CreateAppointmentRequest): Promise<AppointmentResponse> {
    const response = await apiClient.post<AppointmentResponse>('/appointments', payload);
    return response;
  }

  /**
   * PUT /appointments/{id} - Termin aktualisieren
   */
  async updateAppointment(id: string, payload: Partial<CreateAppointmentRequest>): Promise<AppointmentResponse> {
    const response = await apiClient.put<AppointmentResponse>(`/appointments/${id}`, payload);
    return response;
  }

  /**
   * DELETE /appointments/{id} - Termin löschen
   */
  async deleteAppointment(id: string): Promise<void> {
    await apiClient.delete(`/appointments/${id}`);
  }
}

export const appointmentsService = new AppointmentsService();
export default appointmentsService;
