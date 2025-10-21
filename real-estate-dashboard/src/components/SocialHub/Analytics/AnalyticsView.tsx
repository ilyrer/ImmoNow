/**
 * SocialHub Analytics Component
 * Analytik und Performance-Übersicht
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { useSocialAnalytics } from '../../../hooks/useSocial';
import { SocialAnalytics } from '../../../api/social';
import {
  AnalyticsSummary,
  AnalyticsPeriod,
  PLATFORM_ICONS,
  PLATFORM_COLORS,
} from '../Types';

interface AnalyticsViewProps {
  onBack: () => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onBack }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('7d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Use React Query hooks for data management
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useSocialAnalytics({
    start_date: selectedPeriod === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() : 
               selectedPeriod === '30d' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() :
               selectedPeriod === '90d' ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() :
               new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString(),
    platform: selectedPlatform === 'all' ? undefined : selectedPlatform
  });

  // Convert backend analytics to frontend format
  const analytics: AnalyticsSummary | null = analyticsData ? {
    period: selectedPeriod,
    startDate: analyticsData.start_date || new Date().toISOString(),
    endDate: analyticsData.end_date || new Date().toISOString(),
    overview: {
      totalPosts: analyticsData.total_posts || 0,
      totalImpressions: analyticsData.total_impressions || 0,
      totalEngagements: analyticsData.total_engagements || 0,
      averageEngagementRate: analyticsData.engagement_rate || 0,
      followerGrowth: 0, // TODO: Get from backend
      topPerformingPost: analyticsData.top_posts?.[0]?.id || ''
    },
    platformStats: analyticsData.platforms?.reduce((acc, platform) => {
      acc[platform.platform as any] = {
        posts: platform.posts,
        impressions: platform.impressions,
        engagements: platform.engagements,
        followerGrowth: platform.growth
      };
      return acc;
    }, {} as any) || {},
    topPosts: Array.isArray(analyticsData.top_posts) 
      ? analyticsData.top_posts.map(post => ({
      id: post.id,
      content: {
        text: post.content,
        hashtags: [],
        mentions: [],
        links: []
      },
      platform: post.platform as any,
      type: 'text' as any,
      status: 'published' as any,
      media: [],
      platforms: [post.platform as any],
      author: 'User',
      published_at: post.published_at,
      engagement: {
        likes: post.engagements,
        comments: 0,
        shares: 0,
        clicks: 0
      },
      createdAt: post.published_at,
      updatedAt: post.published_at
    })) : [],
    engagement: {
      likes: analyticsData.total_engagements || 0,
      comments: 0,
      shares: 0,
      saves: 0
    },
    audience: {
      demographics: {
        ageGroups: analyticsData.audience?.demographics?.age || {},
        genders: analyticsData.audience?.demographics?.gender || {},
        locations: analyticsData.audience?.demographics?.location || {}
      },
      activeHours: {}
    }
  } : null;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Show loading state while analytics are being fetched
  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="ri-arrow-left-line text-xl text-gray-600 dark:text-gray-400"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Social Media Analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Lade Analytics-Daten...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Show error state if analytics failed to load
  if (analyticsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="ri-arrow-left-line text-xl text-gray-600 dark:text-gray-400"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Social Media Analytics
            </h2>
            <p className="text-red-600 dark:text-red-400 mt-1">
              Fehler beim Laden der Analytics
            </p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">
            {analyticsError.message || 'Unbekannter Fehler beim Laden der Analytics'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="ri-arrow-left-line text-xl text-gray-600 dark:text-gray-400"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Social Media Analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {analytics ? `${formatDate(analytics.startDate)} - ${formatDate(analytics.endDate)}` : 'Keine Daten verfügbar'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as AnalyticsPeriod)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
            <option value="1y">Letztes Jahr</option>
          </select>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Alle Plattformen</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Impressions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {analytics ? formatNumber(analytics.overview.totalImpressions) : '0'}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  <i className="ri-arrow-up-line"></i> +12.5%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-eye-line text-blue-600 dark:text-blue-400 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Engagements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {analytics ? formatNumber(analytics.overview.totalEngagements) : '0'}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  <i className="ri-arrow-up-line"></i> +8.3%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-heart-line text-green-600 dark:text-green-400 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {analytics ? `${analytics.overview.averageEngagementRate.toFixed(1)}%` : '0%'}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  <i className="ri-arrow-down-line"></i> -1.2%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-percent-line text-purple-600 dark:text-purple-400 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Follower-Wachstum</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  +{analytics ? formatNumber(analytics.overview.followerGrowth) : '0'}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  <i className="ri-arrow-up-line"></i> +15.7%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-user-add-line text-orange-600 dark:text-orange-400 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics ? Object.entries(analytics.platformStats).map(([platform, stats]) => (
              <div key={platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS]}`}>
                      <i className={`${PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]} text-sm`}></i>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{platform}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(stats.impressions)} Impressions
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatNumber(stats.engagements)} Engagements
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${analytics ? (stats.impressions / analytics.overview.totalImpressions) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                Keine Platform-Daten verfügbar
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement-Aufschlüsselung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <i className="ri-heart-fill text-blue-600 dark:text-blue-400"></i>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Likes</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {analytics ? formatNumber(analytics.engagement.likes) : '0'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="ri-chat-3-fill text-green-600 dark:text-green-400"></i>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Kommentare</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {analytics ? formatNumber(analytics.engagement.comments) : '0'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <i className="ri-share-forward-fill text-purple-600 dark:text-purple-400"></i>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Shares</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {analytics ? formatNumber(analytics.engagement.shares) : '0'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <i className="ri-bookmark-fill text-yellow-600 dark:text-yellow-400"></i>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Saves</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {analytics ? formatNumber(analytics.engagement.saves) : '0'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics ? analytics.topPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <i className="ri-image-line text-gray-400"></i>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">#{index + 1}</span>
                      <span className="text-sm text-gray-500">{post.platform}</span>
                    </div>
                    <div className="text-sm text-gray-500">{post.date}</div>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {typeof post.content === 'string' ? post.content : post.content?.text || ''}
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatNumber(post.impressions || 0)} Impressions</span>
                    <span>{formatNumber(post.engagements || 0)} Engagements</span>
                    <span>{(post.engagementRate || 0).toFixed(1)}% Rate</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                Keine Top Posts verfügbar
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audience Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Altersgruppen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics ? Object.entries(analytics.audience.demographics.ageGroups).map(([age, percent]) => (
                <div key={age}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{age}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-gray-500">
                  Keine Altersdaten verfügbar
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geschlecht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics ? Object.entries(analytics.audience.demographics.genders).map(([gender, percent]) => (
                <div key={gender}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 capitalize">{gender === 'male' ? 'Männlich' : gender === 'female' ? 'Weiblich' : 'Divers'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-gray-500">
                  Keine Geschlechtsdaten verfügbar
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Standorte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics ? Object.entries(analytics.audience.demographics.locations).map(([location, percent]) => (
                <div key={location}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{location}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-gray-500">
                  Keine Standortdaten verfügbar
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsView;