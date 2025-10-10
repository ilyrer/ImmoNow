/**
 * Simplified Types for Accounts View
 */

export type SocialPlatform = 
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'linkedin'
  | 'youtube';

export interface SimpleSocialAccount {
  id: string;
  platform: SocialPlatform;
  displayName: string;
  connected: boolean;
  defaultProfileName?: string;
  profiles?: Profile[]; // Optional profiles array
}

export interface Profile {
  id: string;
  name: string;
  type: 'page' | 'profile' | 'channel';
}

// Platform Metadata
export const PLATFORM_INFO: Record<SocialPlatform, {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  instagram: {
    name: 'Instagram',
    icon: 'ri-instagram-line',
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500',
  },
  tiktok: {
    name: 'TikTok',
    icon: 'ri-tiktok-line',
    color: 'text-white',
    bgColor: 'bg-black',
  },
  facebook: {
    name: 'Facebook',
    icon: 'ri-facebook-fill',
    color: 'text-white',
    bgColor: 'bg-blue-600',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'ri-linkedin-fill',
    color: 'text-white',
    bgColor: 'bg-blue-700',
  },
  youtube: {
    name: 'YouTube',
    icon: 'ri-youtube-fill',
    color: 'text-white',
    bgColor: 'bg-red-600',
  },
};
