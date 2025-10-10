/**
 * Call Types
 * Defines all video/audio call-related types (WebRTC UI stub)
 */

export type CallStatus = 'scheduled' | 'ringing' | 'ongoing' | 'ended' | 'cancelled' | 'missed';

export type CallType = 'audio' | 'video' | 'screen_share';

export type DeviceType = 'audioinput' | 'videoinput' | 'audiooutput';

export interface MediaDevice {
  deviceId: string;
  kind: DeviceType;
  label: string;
  isDefault?: boolean;
}

export interface CallParticipant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'host' | 'moderator' | 'participant';
  joinedAt?: string;
  leftAt?: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSharingScreen: boolean;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'disconnected';
  latency?: number; // in ms
}

export interface CallSettings {
  audioDeviceId?: string;
  videoDeviceId?: string;
  outputDeviceId?: string;
  displayName?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  backgroundBlur?: boolean;
  virtualBackground?: string;
}

export interface Call {
  id: string;
  title: string;
  description?: string;
  type: CallType;
  status: CallStatus;
  hostId: string;
  participants: CallParticipant[];
  invitedParticipants: string[];
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number; // in seconds
  recordingUrl?: string;
  isRecording: boolean;
  roomUrl: string;
  password?: string;
  maxParticipants?: number;
  appointmentId?: string;
  conversationId?: string;
  metadata?: {
    propertyId?: string;
    customerId?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CallInvite {
  id: string;
  callId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  sentAt: string;
  respondedAt?: string;
}

export interface ConnectionStats {
  participantId: string;
  bitrate: number;
  packetLoss: number;
  latency: number;
  jitter: number;
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  timestamp: string;
}

export interface CallControls {
  isMuted: boolean;
  isCameraOff: boolean;
  isSharingScreen: boolean;
  isRecording: boolean;
  isHandRaised: boolean;
  showChat: boolean;
  showParticipants: boolean;
}

export interface CallFilter {
  status?: CallStatus[];
  type?: CallType[];
  participantId?: string;
  hostId?: string;
  from?: string;
  to?: string;
  searchQuery?: string;
}
