/**
 * SocialHub Type Definitions
 * Typen und Interfaces für das SocialHub-Modul
 */

// Social Media Platforms
export type SocialPlatform = 
  | 'facebook' 
  | 'instagram' 
  | 'twitter' 
  | 'linkedin' 
  | 'tiktok' 
  | 'youtube'
  | 'pinterest';

// Account Status
export type AccountStatus = 'active' | 'inactive' | 'error' | 'pending';

// Post Status
export type PostStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'published' 
  | 'failed' 
  | 'expired';

// Post Type
export type PostType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'carousel' 
  | 'story' 
  | 'reel';

// Media Type
export type MediaType = 'image' | 'video' | 'gif' | 'document';

// Analytics Period
export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y' | 'custom';

// Social Media Account
export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
  profileImage: string;
  isConnected: boolean;
  status: AccountStatus;
  followerCount: number;
  followingCount: number;
  postCount: number;
  engagementRate: number;
  lastSync: string;
  connectedAt: string;
  connectedBy: string;
  permissions: string[];
  settings: {
    autoPost: boolean;
    notifications: boolean;
    analytics: boolean;
  };
}

// Social Media Post
export interface SocialPost {
  id: string;
  type: PostType;
  status: PostStatus;
  content: {
    text: string;
    hashtags: string[];
    mentions: string[];
    links: string[];
  };
  media: PostMedia[];
  platforms: SocialPlatform[];
  scheduledFor?: string;
  publishedAt?: string;
  expiresAt?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  analytics?: PostAnalytics;
  targeting?: PostTargeting;
  // Legacy/mock fields for backward compatibility
  platform?: string;
  date?: string;
  impressions?: number;
  engagements?: number;
  engagementRate?: number;
}

// Post Media
export interface PostMedia {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for videos in seconds
  altText?: string;
  uploadedAt: string;
}

// Post Analytics
export interface PostAnalytics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagementRate: number;
  platformBreakdown: {
    [key in SocialPlatform]?: {
      impressions: number;
      engagement: number;
    };
  };
}

// Post Targeting
export interface PostTargeting {
  locations?: string[];
  interests?: string[];
  ageRange?: {
    min: number;
    max: number;
  };
  languages?: string[];
}

// Queue Item
export interface QueueItem {
  id: string;
  post: SocialPost;
  priority: 'low' | 'medium' | 'high';
  scheduledFor: string;
  status: 'queued' | 'processing' | 'posted' | 'failed';
  retryCount: number;
  error?: string;
  createdAt: string;
}

// Analytics Summary
export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  overview: {
    totalPosts: number;
    totalImpressions: number;
    totalEngagements: number;
    averageEngagementRate: number;
    followerGrowth: number;
    topPerformingPost: string;
  };
  platformStats: {
    [key in SocialPlatform]?: {
      posts: number;
      impressions: number;
      engagements: number;
      followerGrowth: number;
    };
  };
  topPosts: SocialPost[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  audience: {
    demographics: {
      ageGroups: { [key: string]: number };
      genders: { [key: string]: number };
      locations: { [key: string]: number };
    };
    activeHours: { [hour: string]: number };
  };
}

// Media Library Item
export interface MediaLibraryItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string;
  filename: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  tags: string[];
  usedInPosts: string[]; // post IDs
  uploadedBy: string;
  uploadedAt: string;
  lastUsed?: string;
}

// Scheduler Event
export interface SchedulerEvent {
  id: string;
  postId: string;
  post: SocialPost;
  scheduledTime: string;
  platforms: SocialPlatform[];
  status: 'scheduled' | 'posted' | 'failed';
  createdBy: string;
  createdAt: string;
}

// Platform Icons Mapping
export const PLATFORM_ICONS: { [key in SocialPlatform]: string } = {
  facebook: 'ri-facebook-fill',
  instagram: 'ri-instagram-line',
  twitter: 'ri-twitter-x-line',
  linkedin: 'ri-linkedin-fill',
  tiktok: 'ri-tiktok-line',
  youtube: 'ri-youtube-fill',
  pinterest: 'ri-pinterest-fill',
};

// Platform Colors
export const PLATFORM_COLORS: { [key in SocialPlatform]: string } = {
  facebook: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  instagram: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
  twitter: 'text-sky-500 bg-sky-100 dark:bg-sky-900/30',
  linkedin: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30',
  tiktok: 'text-black bg-gray-100 dark:bg-gray-900/30 dark:text-white',
  youtube: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  pinterest: 'text-red-700 bg-red-100 dark:bg-red-900/30',
};

// Post Status Labels
export const POST_STATUS_LABELS: { [key in PostStatus]: string } = {
  draft: 'Entwurf',
  scheduled: 'Geplant',
  published: 'Veröffentlicht',
  failed: 'Fehlgeschlagen',
  expired: 'Abgelaufen',
};

// Post Status Colors
export const POST_STATUS_COLORS: { [key in PostStatus]: string } = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

// Account Status Labels
export const ACCOUNT_STATUS_LABELS: { [key in AccountStatus]: string } = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  error: 'Fehler',
  pending: 'Ausstehend',
};

// Account Status Colors
export const ACCOUNT_STATUS_COLORS: { [key in AccountStatus]: string } = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};
