/**
 * SocialHub Analytics Component - Premium Design
 * Analytik und Performance-Übersicht mit Apple-Style Glassmorphism
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Heart,
  Percent,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useSocialAnalytics } from '../../../api/hooks';
import type { SocialAnalyticsResponse, SocialPostResponse } from '../../../api/types.gen';

interface AnalyticsViewProps {
  onBack: () => void;
}

type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

const PLATFORM_CONFIG: Record<string, { icon: string; bgGradient: string; name: string }> = {
  instagram: { icon: 'ri-instagram-line', bgGradient: 'from-purple-600 via-pink-600 to-orange-500', name: 'Instagram' },
  facebook: { icon: 'ri-facebook-fill', bgGradient: 'from-blue-600 to-blue-700', name: 'Facebook' },
  linkedin: { icon: 'ri-linkedin-fill', bgGradient: 'from-blue-700 to-blue-800', name: 'LinkedIn' },
  twitter: { icon: 'ri-twitter-x-fill', bgGradient: 'from-gray-800 to-gray-900', name: 'X (Twitter)' },
  youtube: { icon: 'ri-youtube-fill', bgGradient: 'from-red-600 to-red-700', name: 'YouTube' },
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onBack }) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  const { data: analytics, isLoading } = useSocialAnalytics(period);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Map actual API response to display stats
  const overviewStats = [
    {
      label: 'Gesamt Posts',
      value: formatNumber(analytics?.total_posts || 0),
      change: 12.5,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'bg-blue-500/20',
    },
    {
      label: 'Engagements',
      value: formatNumber(analytics?.total_engagement || 0),
      change: 8.3,
      icon: Heart,
      gradient: 'from-rose-500 to-pink-500',
      bgGlow: 'bg-rose-500/20',
    },
    {
      label: 'Engagement Rate',
      value: `${(analytics?.average_engagement_rate || 0).toFixed(1)}%`,
      change: -1.2,
      icon: Percent,
      gradient: 'from-purple-500 to-violet-500',
      bgGlow: 'bg-purple-500/20',
    },
    {
      label: 'Beste Posting-Zeit',
      value: analytics?.best_posting_times ? getBestPostingTime(analytics.best_posting_times) : '-',
      change: 15.7,
      icon: Clock,
      gradient: 'from-emerald-500 to-teal-500',
      bgGlow: 'bg-emerald-500/20',
    },
  ];

  // Helper to get best posting time from the API data
  function getBestPostingTime(times: { [key: string]: number[] }): string {
    const allHours = Object.values(times).flat();
    if (allHours.length === 0) return '-';
    const mostCommon = allHours.sort((a, b) =>
      allHours.filter(v => v === a).length - allHours.filter(v => v === b).length
    ).pop();
    return mostCommon !== undefined ? `${mostCommon}:00 Uhr` : '-';
  }

  const periodOptions = [
    { value: '7d', label: 'Letzte 7 Tage' },
    { value: '30d', label: 'Letzte 30 Tage' },
    { value: '90d', label: 'Letzte 90 Tage' },
    { value: '1y', label: 'Letztes Jahr' },
  ];

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-[32px] blur-3xl -z-10"></div>

        <div className="relative bg-white/10 dark:bg-[#1C1C1E]/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="w-12 h-12 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/20 transition-all shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 text-[#1C1C1E] dark:text-white" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Social Media Analytics
                </h1>
                <p className="text-[#3A3A3C] dark:text-gray-400 mt-1">
                  Detaillierte Performance-Analyse Ihrer Kanäle
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
                className="px-5 py-2.5 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-white/30 dark:border-white/10 text-[#1C1C1E] dark:text-white font-medium focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer"
              >
                {periodOptions.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#1C1C1E]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 ${stat.bgGlow} rounded-[24px] blur-2xl opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                  <div className="relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold ${stat.change >= 0
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                        {stat.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(stat.change)}%
                      </div>
                    </div>
                    <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-[#1C1C1E] dark:text-white">{stat.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Platform Performance - Posts by Platform */}
          <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Posts nach Plattform
            </h2>

            {analytics?.posts_by_platform && Object.keys(analytics.posts_by_platform).length > 0 ? (
              <div className="space-y-5">
                {Object.entries(analytics.posts_by_platform).map(([platform, count], index) => {
                  const config = PLATFORM_CONFIG[platform];
                  const totalPosts = analytics.total_posts || 1;
                  const percentage = (count / totalPosts) * 100;

                  return (
                    <motion.div
                      key={platform}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 dark:bg-[#1C1C1E]/40 rounded-2xl p-5 border border-white/20 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${config?.bgGradient || 'from-gray-500 to-gray-600'} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                            <i className={`${config?.icon || 'ri-global-line'} text-xl`}></i>
                          </div>
                          <div>
                            <p className="font-semibold text-[#1C1C1E] dark:text-white">
                              {config?.name || platform}
                            </p>
                            <p className="text-sm text-[#3A3A3C] dark:text-gray-400">
                              {count} Posts
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#1C1C1E] dark:text-white">
                            {percentage.toFixed(1)}%
                          </p>
                          <p className="text-sm text-[#3A3A3C] dark:text-gray-400">Anteil</p>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 dark:bg-white/5 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={`h-3 rounded-full bg-gradient-to-r ${config?.bgGradient || 'from-gray-500 to-gray-600'}`}
                        ></motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-10 h-10 text-blue-500" />
                </div>
                <p className="text-[#3A3A3C] dark:text-gray-400">Keine Platform-Daten verfügbar</p>
              </div>
            )}
          </div>

          {/* Posts by Status */}
          <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              Posts nach Status
            </h2>

            {analytics?.posts_by_status && Object.keys(analytics.posts_by_status).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(analytics.posts_by_status).map(([status, count], index) => {
                  const statusConfig: Record<string, { label: string; gradient: string }> = {
                    draft: { label: 'Entwürfe', gradient: 'from-gray-500 to-gray-600' },
                    scheduled: { label: 'Geplant', gradient: 'from-blue-500 to-cyan-500' },
                    published: { label: 'Veröffentlicht', gradient: 'from-emerald-500 to-teal-500' },
                    failed: { label: 'Fehlgeschlagen', gradient: 'from-red-500 to-rose-500' },
                  };
                  const config = statusConfig[status] || { label: status, gradient: 'from-purple-500 to-violet-500' };

                  return (
                    <motion.div
                      key={status}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 dark:bg-[#1C1C1E]/40 rounded-2xl p-6 border border-white/20 dark:border-white/10 text-center group hover:scale-105 transition-transform"
                    >
                      <div className={`w-14 h-14 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <p className="text-3xl font-bold text-[#1C1C1E] dark:text-white mb-1">
                        {count}
                      </p>
                      <p className="text-sm text-[#3A3A3C] dark:text-gray-400">{config.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#3A3A3C] dark:text-gray-400">Keine Status-Daten verfügbar</p>
              </div>
            )}
          </div>

          {/* Top Posts */}
          <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              Top Posts
            </h2>

            {analytics?.top_performing_posts && analytics.top_performing_posts.length > 0 ? (
              <div className="space-y-4">
                {analytics.top_performing_posts.map((post: SocialPostResponse, index: number) => {
                  const platformConfig = PLATFORM_CONFIG[post.platform] || { icon: 'ri-global-line', bgGradient: 'from-gray-500 to-gray-600', name: post.platform };
                  const engagement = post.engagement_metrics || {};
                  const totalEngagement = Object.values(engagement).reduce((sum: number, val) => sum + (typeof val === 'number' ? val : 0), 0);

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-5 bg-white/10 dark:bg-[#1C1C1E]/40 rounded-2xl p-5 border border-white/20 dark:border-white/10 group hover:border-purple-500/30 transition-all"
                    >
                      {/* Rank Badge */}
                      <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                              'bg-gradient-to-br from-purple-500 to-violet-600'
                        }`}>
                        #{index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 bg-gradient-to-br ${platformConfig.bgGradient} rounded-lg flex items-center justify-center`}>
                            <i className={`${platformConfig.icon} text-white text-sm`}></i>
                          </div>
                          <span className="text-sm text-[#3A3A3C] dark:text-gray-400">
                            {post.published_at ? new Date(post.published_at).toLocaleDateString('de-DE') : 'Geplant'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${post.status === 'published' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                              post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                            }`}>
                            {post.status}
                          </span>
                        </div>
                        <p className="text-[#1C1C1E] dark:text-white font-medium line-clamp-2 mb-3">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                            <Heart className="w-4 h-4" />
                            {formatNumber(totalEngagement)}
                          </span>
                          <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                            <Percent className="w-4 h-4" />
                            {post.post_type}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-amber-500" />
                </div>
                <p className="text-[#3A3A3C] dark:text-gray-400">Keine Top Posts verfügbar</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsView;