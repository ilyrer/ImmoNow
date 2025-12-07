/**
 * SocialHub Queue Component - Premium Design
 * Warteschlange für zu veröffentlichende Posts mit Apple-Style Glassmorphism
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Eye,
  Edit3,
  Trash2,
  Send,
  RotateCcw,
  ListOrdered,
  Inbox
} from 'lucide-react';
import { usePostQueue } from '../../../api/hooks';

interface QueueViewProps {
  onBack: () => void;
}

const PLATFORM_CONFIG: Record<string, { icon: string; bgGradient: string; name: string }> = {
  instagram: { icon: 'ri-instagram-line', bgGradient: 'from-purple-600 via-pink-600 to-orange-500', name: 'Instagram' },
  facebook: { icon: 'ri-facebook-fill', bgGradient: 'from-blue-600 to-blue-700', name: 'Facebook' },
  linkedin: { icon: 'ri-linkedin-fill', bgGradient: 'from-blue-700 to-blue-800', name: 'LinkedIn' },
  twitter: { icon: 'ri-twitter-x-fill', bgGradient: 'from-gray-800 to-gray-900', name: 'X (Twitter)' },
  youtube: { icon: 'ri-youtube-fill', bgGradient: 'from-red-600 to-red-700', name: 'YouTube' },
};

const QueueView: React.FC<QueueViewProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'all' | 'queued' | 'processing' | 'failed'>('all');

  const { data: queueData, isLoading, refetch } = usePostQueue();
  const queueItems = queueData || [];

  const filteredItems = queueItems.filter(item =>
    filter === 'all' || item.status === filter
  );

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (dateString: string): string => {
    const now = new Date();
    const scheduled = new Date(dateString);
    const diff = scheduled.getTime() - now.getTime();

    if (diff < 0) return 'Überfällig';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days} Tag${days > 1 ? 'en' : ''}`;
    }
    if (hours > 0) return `in ${hours} Std. ${minutes} Min.`;
    return `in ${minutes} Min.`;
  };

  const stats = [
    {
      label: 'In Warteschlange',
      value: queueItems.filter(i => i.status === 'queued').length,
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'bg-blue-500/20',
    },
    {
      label: 'Wird verarbeitet',
      value: queueItems.filter(i => i.status === 'processing').length,
      icon: Loader2,
      gradient: 'from-purple-500 to-violet-500',
      bgGlow: 'bg-purple-500/20',
    },
    {
      label: 'Erfolgreich',
      value: queueItems.filter(i => i.status === 'published').length,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-500',
      bgGlow: 'bg-emerald-500/20',
    },
    {
      label: 'Fehlgeschlagen',
      value: queueItems.filter(i => i.status === 'failed').length,
      icon: AlertCircle,
      gradient: 'from-red-500 to-rose-500',
      bgGlow: 'bg-red-500/20',
    },
  ];

  const filters = [
    { id: 'all', label: 'Alle' },
    { id: 'queued', label: 'Wartend' },
    { id: 'processing', label: 'Verarbeitung' },
    { id: 'failed', label: 'Fehler' },
  ];

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-[32px] blur-3xl -z-10"></div>

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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Warteschlange
                </h1>
                <p className="text-[#3A3A3C] dark:text-gray-400 mt-1">
                  Überwachen Sie Ihre Beiträge in der Warteschlange
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl flex items-center gap-2 border border-white/30 dark:border-white/10 text-[#1C1C1E] dark:text-white font-medium hover:bg-white/30 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Aktualisieren
            </motion.button>
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
                    <Icon className={`w-7 h-7 text-white ${stat.label === 'Wird verarbeitet' ? 'animate-spin' : ''}`} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-5 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-[#3A3A3C] dark:text-gray-400 flex items-center gap-2">
            <ListOrdered className="w-4 h-4" />
            Filter:
          </span>
          <div className="flex items-center gap-2">
            {filters.map((f) => (
              <motion.button
                key={f.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilter(f.id as typeof filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/10 dark:bg-white/5 text-[#3A3A3C] dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 border border-white/20 dark:border-white/10'
                  }`}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          Beiträge
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center">
              <Inbox className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-[#1C1C1E] dark:text-white mb-3">
              Keine Beiträge in der Warteschlange
            </h3>
            <p className="text-[#3A3A3C] dark:text-gray-400">
              Alle Beiträge wurden verarbeitet
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredItems
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                .map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white/10 dark:bg-[#1C1C1E]/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-white/10 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-6">
                      {/* Content */}
                      <div className="flex-1">
                        {/* Status Badges */}
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl ${item.status === 'queued'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : item.status === 'processing'
                                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                                : item.status === 'published'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
                            }`}>
                            {item.status === 'queued' && 'In Warteschlange'}
                            {item.status === 'processing' && 'Wird verarbeitet'}
                            {item.status === 'published' && 'Veröffentlicht'}
                            {item.status === 'failed' && 'Fehlgeschlagen'}
                          </span>
                          {item.priority && (
                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl ${item.priority === 'high'
                                ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                : item.priority === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                                  : 'bg-green-500/20 text-green-600 dark:text-green-400'
                              }`}>
                              {item.priority === 'high' && 'Hoch'}
                              {item.priority === 'medium' && 'Mittel'}
                              {item.priority === 'low' && 'Niedrig'}
                            </span>
                          )}
                          {item.retry_count > 0 && (
                            <span className="px-3 py-1.5 text-xs font-semibold bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl">
                              Versuch {item.retry_count + 1}
                            </span>
                          )}
                        </div>

                        {/* Content Text */}
                        <p className="text-[#1C1C1E] dark:text-white font-medium mb-4 line-clamp-2 text-lg">
                          {item.content}
                        </p>

                        {/* Platforms */}
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          {item.platforms.map((platform) => {
                            const config = PLATFORM_CONFIG[platform];
                            return (
                              <div
                                key={platform}
                                className={`px-3 py-1.5 bg-gradient-to-r ${config?.bgGradient || 'from-gray-500 to-gray-600'} rounded-xl text-xs font-medium text-white shadow-md flex items-center gap-1.5`}
                              >
                                <i className={`${config?.icon || 'ri-global-line'}`}></i>
                                {config?.name || platform}
                              </div>
                            );
                          })}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-6 text-sm text-[#3A3A3C] dark:text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(item.scheduled_at)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {getTimeUntil(item.scheduled_at)}
                          </span>
                        </div>

                        {/* Error Message */}
                        {item.error && (
                          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                  Fehler beim Veröffentlichen
                                </p>
                                <p className="text-sm text-red-500 dark:text-red-400/80 mt-1">
                                  {item.error}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {item.status === 'queued' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all text-sm font-medium flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              Bearbeiten
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all text-sm font-medium flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Jetzt senden
                            </motion.button>
                          </>
                        )}
                        {item.status === 'failed' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-500/30 transition-all text-sm font-medium flex items-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Wiederholen
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-white/10 text-[#3A3A3C] dark:text-gray-400 rounded-xl hover:bg-white/20 transition-all text-sm font-medium flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Vorschau
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500/30 transition-all text-sm font-medium flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Entfernen
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueView;
