/**
 * SocialHub Queue Component
 * Warteschlange für zu veröffentlichende Posts
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
// TODO: Implement real queue API
import {
  QueueItem,
  PLATFORM_ICONS,
  PLATFORM_COLORS,
} from '../Types';

interface QueueViewProps {
  onBack: () => void;
}

const QueueView: React.FC<QueueViewProps> = ({ onBack }) => {
  const [queueItems] = useState<QueueItem[]>([]); // TODO: Load from real API
  const [filter, setFilter] = useState<'all' | 'queued' | 'processing' | 'failed'>('all');

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

  const getPriorityColor = (priority: QueueItem['priority']): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const getStatusColor = (status: QueueItem['status']): string => {
    switch (status) {
      case 'queued': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'processing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'posted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  const getStatusLabel = (status: QueueItem['status']): string => {
    switch (status) {
      case 'queued': return 'In Warteschlange';
      case 'processing': return 'Wird verarbeitet';
      case 'posted': return 'Veröffentlicht';
      case 'failed': return 'Fehlgeschlagen';
    }
  };

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
              Warteschlange
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Überwachen Sie Ihre Beiträge in der Warteschlange
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center">
          <i className="ri-refresh-line mr-2"></i>
          Aktualisieren
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Warteschlange</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {queueItems.filter(i => i.status === 'queued').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-xl text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Wird verarbeitet</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {queueItems.filter(i => i.status === 'processing').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-loader-4-line text-xl text-purple-600 dark:text-purple-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Erfolgreich</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {queueItems.filter(i => i.status === 'posted').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-xl text-green-600 dark:text-green-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fehlgeschlagen</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {queueItems.filter(i => i.status === 'failed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-error-warning-line text-xl text-red-600 dark:text-red-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
              Filter:
            </span>
            {(['all', 'queued', 'processing', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f === 'all' && 'Alle'}
                {f === 'queued' && 'Wartend'}
                {f === 'processing' && 'Verarbeitung'}
                {f === 'failed' && 'Fehler'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      <Card>
        <CardHeader>
          <CardTitle>Beiträge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <i className="ri-inbox-line text-2xl text-gray-400 dark:text-gray-500"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Keine Beiträge in der Warteschlange
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Alle Beiträge wurden verarbeitet
                </p>
              </div>
            ) : (
              filteredItems
                .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
                .map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left Side */}
                      <div className="flex-1">
                        {/* Status & Priority */}
                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority === 'high' && 'Hoch'}
                            {item.priority === 'medium' && 'Mittel'}
                            {item.priority === 'low' && 'Niedrig'}
                          </span>
                          {item.retryCount > 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-full">
                              Versuch {item.retryCount + 1}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <p className="text-gray-900 dark:text-white font-medium mb-2 line-clamp-2">
                          {item.post.content.text}
                        </p>

                        {/* Platforms */}
                        <div className="flex items-center space-x-2 mb-3">
                          {item.post.platforms.map((platform) => (
                            <div
                              key={platform}
                              className={`px-2 py-1 rounded text-xs font-medium ${PLATFORM_COLORS[platform]}`}
                            >
                              <i className={`${PLATFORM_ICONS[platform]} mr-1`}></i>
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </div>
                          ))}
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center">
                            <i className="ri-calendar-line mr-1"></i>
                            {formatDateTime(item.scheduledFor)}
                          </span>
                          <span className="flex items-center">
                            <i className="ri-time-line mr-1"></i>
                            {getTimeUntil(item.scheduledFor)}
                          </span>
                        </div>

                        {/* Error Message */}
                        {item.error && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <i className="ri-error-warning-line text-red-600 dark:text-red-400 mt-0.5"></i>
                              <div>
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                  Fehler beim Veröffentlichen
                                </p>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                  {item.error}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side - Actions */}
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        {item.status === 'queued' && (
                          <>
                            <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm">
                              <i className="ri-edit-line mr-1"></i>
                              Bearbeiten
                            </button>
                            <button className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm">
                              <i className="ri-send-plane-line mr-1"></i>
                              Jetzt senden
                            </button>
                          </>
                        )}
                        {item.status === 'failed' && (
                          <button className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm">
                            <i className="ri-refresh-line mr-1"></i>
                            Wiederholen
                          </button>
                        )}
                        <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                          <i className="ri-eye-line mr-1"></i>
                          Vorschau
                        </button>
                        <button className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm">
                          <i className="ri-delete-bin-line mr-1"></i>
                          Entfernen
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueView;
