/**
 * Appointment Types
 * Defines all appointment and scheduling-related types
 */

export type AppointmentStatus = 'geplant' | 'bestätigt' | 'abgesagt' | 'abgeschlossen' | 'verpasst';

export type AppointmentType = 'besichtigung' | 'beratung' | 'notartermin' | 'übergabe' | 'sonstiges';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface AppointmentParticipant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'agent' | 'customer' | 'guest' | 'notary' | 'other';
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  respondedAt?: string;
}

export interface AppointmentLocation {
  type: 'property' | 'office' | 'online' | 'custom';
  address?: string;
  propertyId?: string;
  propertyTitle?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  meetingUrl?: string;
  instructions?: string;
}

export interface AppointmentReminder {
  id: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  minutesBefore: number;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  count?: number;
  until?: string;
  byWeekDay?: number[];
  byMonthDay?: number[];
  exceptions?: string[];
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  start: string;
  end: string;
  duration: number; // in minutes
  isAllDay: boolean;
  location: AppointmentLocation;
  participants: AppointmentParticipant[];
  organizerId: string;
  organizerName: string;
  propertyId?: string;
  customerId?: string;
  reminders: AppointmentReminder[];
  notes?: string;
  attachments?: string[];
  callId?: string;
  conversationId?: string;
  recurrence?: RecurrenceRule;
  parentAppointmentId?: string;
  color?: string;
  isPrivate: boolean;
  isCancellable: boolean;
  isReschedulable: boolean;
  metadata?: {
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
  conflicts?: string[];
  resourceId?: string;
}

export interface AvailabilityRequest {
  participants: string[];
  duration: number;
  preferredDates: string[];
  preferredTimeRanges?: {
    start: string; // HH:mm
    end: string; // HH:mm
  }[];
  constraints?: {
    minTimeBetween?: number;
    maxPerDay?: number;
    excludeWeekends?: boolean;
  };
}

export interface SlotSuggestion {
  slot: TimeSlot;
  score: number;
  conflicts: Array<{
    participantId: string;
    participantName: string;
    conflictingAppointmentId: string;
  }>;
}

export interface AppointmentConflict {
  appointmentId: string;
  conflictingAppointmentId: string;
  type: 'time_overlap' | 'resource_conflict' | 'location_conflict';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface CalendarView {
  type: 'day' | 'week' | 'month' | 'agenda';
  date: string;
  resourceFilters?: {
    agentIds?: string[];
    propertyIds?: string[];
    types?: AppointmentType[];
  };
}

export interface AppointmentFilter {
  status?: AppointmentStatus[];
  type?: AppointmentType[];
  participantId?: string;
  organizerId?: string;
  propertyId?: string;
  customerId?: string;
  from?: string;
  to?: string;
  searchQuery?: string;
}

export interface ICSExportOptions {
  appointmentIds: string[];
  includeReminders: boolean;
  includeAttachments: boolean;
  timezone?: string;
}

export interface SyncConfig {
  provider: 'google' | 'outlook' | 'apple';
  enabled: boolean;
  calendarId?: string;
  syncDirection: 'one_way' | 'two_way';
  lastSyncAt?: string;
  nextSyncAt?: string;
  errors?: string[];
}
