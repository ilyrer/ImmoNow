/**
 * SocialHub Scheduler Component - Premium Design
 * Kalenderansicht für geplante Posts mit Apple-Style Glassmorphism
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Trash2,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useScheduledPosts } from '../../../api/hooks';

interface SchedulerViewProps {
  onBack: () => void;
}

const PLATFORM_CONFIG: Record<string, { icon: string; bgGradient: string }> = {
  instagram: { icon: 'ri-instagram-line', bgGradient: 'from-purple-600 via-pink-600 to-orange-500' },
  facebook: { icon: 'ri-facebook-fill', bgGradient: 'from-blue-600 to-blue-700' },
  linkedin: { icon: 'ri-linkedin-fill', bgGradient: 'from-blue-700 to-blue-800' },
  twitter: { icon: 'ri-twitter-x-fill', bgGradient: 'from-gray-800 to-gray-900' },
  youtube: { icon: 'ri-youtube-fill', bgGradient: 'from-red-600 to-red-700' },
};

const SchedulerView: React.FC<SchedulerViewProps> = ({ onBack }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');

  const { data: scheduledPosts, isLoading } = useScheduledPosts();
  const events = scheduledPosts || [];

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = formatDate(event.scheduled_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const stats = [
    {
      label: 'Geplante Beiträge',
      value: events.filter(e => e.status === 'scheduled').length,
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'bg-blue-500/20',
    },
    {
      label: 'Heute geplant',
      value: events.filter(e => formatDate(e.scheduled_at) === formatDate(new Date().toISOString())).length,
      icon: Clock,
      gradient: 'from-emerald-500 to-teal-500',
      bgGlow: 'bg-emerald-500/20',
    },
    {
      label: 'Veröffentlicht',
      value: events.filter(e => e.status === 'published').length,
      icon: CheckCircle2,
      gradient: 'from-purple-500 to-violet-500',
      bgGlow: 'bg-purple-500/20',
    },
    {
      label: 'Fehlgeschlagen',
      value: events.filter(e => e.status === 'failed').length,
      icon: AlertCircle,
      gradient: 'from-red-500 to-rose-500',
      bgGlow: 'bg-red-500/20',
    },
  ];

  const viewModes = [
    { id: 'day', label: 'Tag', icon: CalendarDays },
    { id: 'week', label: 'Woche', icon: CalendarRange },
    { id: 'month', label: 'Monat', icon: CalendarClock },
  ];

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-[32px] blur-3xl -z-10"></div>

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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Beitragsplaner
                </h1>
                <p className="text-[#3A3A3C] dark:text-gray-400 mt-1">
                  Verwalten Sie Ihre geplanten Social Media Beiträge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/10 dark:bg-[#1C1C1E]/40 backdrop-blur-sm rounded-2xl p-1.5 border border-white/20 dark:border-white/10">
                {viewModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setViewMode(mode.id as typeof viewMode)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${viewMode === mode.id
                          ? 'bg-white/20 dark:bg-white/10 text-[#1C1C1E] dark:text-white shadow-md'
                          : 'text-[#3A3A3C] dark:text-gray-400 hover:text-[#1C1C1E] dark:hover:text-white'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {mode.label}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-blue-500/25 transition-all"
              >
                <Plus className="w-5 h-5" />
                Neuer Beitrag
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-[#1C1C1E] dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Calendar Timeline */}
      <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Zeitplan
          </h2>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-white/10 dark:bg-white/5 rounded-xl flex items-center justify-center border border-white/20 dark:border-white/10 hover:bg-white/20 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-[#1C1C1E] dark:text-white" />
            </motion.button>
            <span className="px-4 py-2 bg-white/10 dark:bg-white/5 rounded-xl text-[#1C1C1E] dark:text-white font-medium border border-white/20 dark:border-white/10">
              {selectedDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-white/10 dark:bg-white/5 rounded-xl flex items-center justify-center border border-white/20 dark:border-white/10 hover:bg-white/20 transition-all"
            >
              <ChevronRight className="w-5 h-5 text-[#1C1C1E] dark:text-white" />
            </motion.button>
          </div>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          </div>
        ) : Object.keys(groupedEvents).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1C1C1E] dark:text-white">{date}</h3>
                </div>

                <div className="space-y-4 ml-4 border-l-2 border-purple-500/30 pl-6">
                  {dateEvents
                    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                    .map((event, idx) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative"
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-[30px] top-6 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-4 border-white/10 dark:border-[#1C1C1E]"></div>

                        <div className="bg-white/10 dark:bg-[#1C1C1E]/40 backdrop-blur-sm rounded-2xl p-5 border border-white/20 dark:border-white/10 hover:border-purple-500/30 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Time & Status */}
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(event.scheduled_at)}
                                </span>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${event.status === 'scheduled'
                                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                    : event.status === 'published'
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-red-500/20 text-red-600 dark:text-red-400'
                                  }`}>
                                  {event.status === 'scheduled' && 'Geplant'}
                                  {event.status === 'published' && 'Veröffentlicht'}
                                  {event.status === 'failed' && 'Fehlgeschlagen'}
                                </span>
                              </div>

                              {/* Content */}
                              <p className="text-[#1C1C1E] dark:text-white font-medium mb-3 line-clamp-2">
                                {event.content}
                              </p>

                              {/* Platforms */}
                              <div className="flex items-center gap-2">
                                {event.platforms.map((platform) => {
                                  const config = PLATFORM_CONFIG[platform];
                                  return (
                                    <div
                                      key={platform}
                                      className={`w-8 h-8 bg-gradient-to-br ${config?.bgGradient || 'from-gray-500 to-gray-600'} rounded-lg flex items-center justify-center shadow-md`}
                                      title={platform}
                                    >
                                      <i className={`${config?.icon || 'ri-global-line'} text-white text-sm`}></i>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-10 h-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-500/30 transition-all"
                              >
                                <Edit3 className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-10 h-10 bg-white/10 text-[#3A3A3C] dark:text-gray-400 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-10 h-10 bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500/30 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center">
              <Calendar className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#1C1C1E] dark:text-white mb-3">
              Keine geplanten Beiträge
            </h3>
            <p className="text-[#3A3A3C] dark:text-gray-400 mb-6 max-w-md mx-auto">
              Erstellen Sie Ihren ersten geplanten Beitrag und organisieren Sie Ihre Social Media Strategie
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl font-medium shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Beitrag planen
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SchedulerView;
