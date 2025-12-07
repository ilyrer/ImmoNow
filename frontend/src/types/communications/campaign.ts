/**
 * Campaign Types
 * Defines all campaign and notification-related types
 */

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'failed';

export type CampaignChannel = 'in_app' | 'email' | 'sms' | 'push';

export type AudienceFilterOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between';

export interface AudienceFilterRule {
  id: string;
  field: string;
  operator: AudienceFilterOperator;
  value: any;
  label?: string;
}

export interface AudienceFilterGroup {
  id: string;
  operator: 'and' | 'or';
  rules: (AudienceFilterRule | AudienceFilterGroup)[];
}

export interface AudienceDefinition {
  id: string;
  name: string;
  description?: string;
  filters: AudienceFilterGroup;
  estimatedSize: number;
  lastCalculatedAt?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  channel: CampaignChannel;
  subject?: string; // for email
  body: string;
  html?: string; // for email
  variables: string[];
  previewText?: string;
  isDefault?: boolean;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  scheduledAt?: string;
  timezone?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  throttling?: {
    enabled: boolean;
    messagesPerHour?: number;
    messagesPerDay?: number;
  };
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  bounced: number;
  spam: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  lastUpdatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  channels: CampaignChannel[];
  audienceId: string;
  audienceName: string;
  audienceSize: number;
  templateId?: string;
  customContent?: {
    [channel in CampaignChannel]?: {
      subject?: string;
      body: string;
      html?: string;
    };
  };
  schedule: CampaignSchedule;
  metrics?: CampaignMetrics;
  testRecipients?: string[];
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  tags?: string[];
  propertyIds?: string[];
  metadata?: {
    [key: string]: any;
  };
  creatorId: string;
  creatorName: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  userId: string;
  userName: string;
  email?: string;
  phone?: string;
  channels: CampaignChannel[];
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked' | 'converted' | 'unsubscribed';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  convertedAt?: string;
  failureReason?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface NotificationPreference {
  userId: string;
  channels: {
    [channel in CampaignChannel]: {
      enabled: boolean;
      categories?: string[];
    };
  };
  doNotDisturb?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
    days?: number[]; // 0-6, Sunday-Saturday
  };
  unsubscribedFrom?: string[];
  language?: string;
  timezone?: string;
  updatedAt: string;
}

export interface CampaignFilter {
  status?: CampaignStatus[];
  channels?: CampaignChannel[];
  creatorId?: string;
  audienceId?: string;
  from?: string;
  to?: string;
  searchQuery?: string;
  tags?: string[];
}

export interface CampaignTestRequest {
  campaignId: string;
  recipients: string[];
  channels?: CampaignChannel[];
}

export interface VariableDefinition {
  key: string;
  label: string;
  description?: string;
  example?: string;
  category: 'user' | 'property' | 'custom' | 'system';
  required?: boolean;
}

export interface CampaignAnalytics {
  campaignId: string;
  period: {
    start: string;
    end: string;
  };
  overview: CampaignMetrics;
  channelBreakdown: {
    [channel in CampaignChannel]?: CampaignMetrics;
  };
  timeSeriesData: Array<{
    timestamp: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
  topLinks?: Array<{
    url: string;
    clicks: number;
    uniqueClicks: number;
  }>;
  deviceBreakdown?: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  locationBreakdown?: Array<{
    country: string;
    city?: string;
    count: number;
  }>;
}
