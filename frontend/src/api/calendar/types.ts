export type AppointmentType = 'viewing' | 'meeting' | 'call' | 'consultation' | 'signing' | 'inspection';

export interface AppointmentAttendeeCreate {
  name: string;
  email?: string;
  phone?: string;
  role: string; // client, agent, etc
  is_required?: boolean;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  user_id?: number;
  contact_id?: number;
}

export interface AppointmentCreateRequest {
  title: string;
  description?: string;
  type: AppointmentType;
  start_datetime: string; // ISO
  end_datetime: string;   // ISO
  timezone?: string; // default Europe/Berlin
  all_day?: boolean;
  location?: string;
  location_type?: string;
  meeting_url?: string;
  property_id?: number;
  assigned_to?: number;
  attendees?: AppointmentAttendeeCreate[];
  reminders?: Array<{ minutes_before: number; method: 'email' | 'sms' | 'push' | 'phone'; custom_message?: string; attendee_id?: number; custom_recipient?: string; }>;
  recurring?: any;
}

export interface AppointmentResponse {
  id: number;
  title: string;
  type: AppointmentType;
  start_datetime: string;
  end_datetime: string;
  status: string;
}
