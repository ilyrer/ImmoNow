/**
 * SocialHub Scheduler Component
 * Kalenderansicht für geplante Posts
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
// TODO: Implement real scheduler API
import {
  SchedulerEvent,
  PLATFORM_ICONS,
  POST_STATUS_COLORS,
  POST_STATUS_LABELS,
} from '../Types';

interface SchedulerViewProps {
  onBack: () => void;
}

const SchedulerView: React.FC<SchedulerViewProps> = ({ onBack }) => {
  const [events] = useState<SchedulerEvent[]>([]); // TODO: Load from real API
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');

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

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = formatDate(event.scheduledTime);
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, SchedulerEvent[]>);

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
              Beitragsplaner
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Verwalten Sie Ihre geplanten Social Media Beiträge
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {mode === 'day' && 'Tag'}
                {mode === 'week' && 'Woche'}
                {mode === 'month' && 'Monat'}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center">
            <i className="ri-add-line mr-2"></i>
            Neuer Beitrag
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Geplante Beiträge</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {events.filter(e => e.status === 'scheduled').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-calendar-line text-xl text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Heute geplant</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {events.filter(e => formatDate(e.scheduledTime) === formatDate(new Date().toISOString())).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-xl text-green-600 dark:text-green-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Veröffentlicht</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {events.filter(e => e.status === 'posted').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-xl text-purple-600 dark:text-purple-400"></i>
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
                  {events.filter(e => e.status === 'failed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <i className="ri-error-warning-line text-xl text-red-600 dark:text-red-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar/Timeline View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Zeitplan</CardTitle>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <i className="ri-arrow-left-s-line text-gray-600 dark:text-gray-400"></i>
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <i className="ri-arrow-right-s-line text-gray-600 dark:text-gray-400"></i>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Timeline View */}
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <i className="ri-calendar-2-line mr-2"></i>
                  {date}
                </h3>
                <div className="space-y-3 ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                  {dateEvents
                    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                    .map((event) => (
                      <div
                        key={event.id}
                        className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {/* Time Badge */}
                        <div className="absolute -left-[28px] top-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <i className="ri-time-line text-white text-xs"></i>
                        </div>

                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Time */}
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {formatTime(event.scheduledTime)}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                event.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : event.status === 'posted'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                {event.status === 'scheduled' && 'Geplant'}
                                {event.status === 'posted' && 'Veröffentlicht'}
                                {event.status === 'failed' && 'Fehlgeschlagen'}
                              </span>
                            </div>

                            {/* Content */}
                            <p className="text-gray-900 dark:text-white font-medium mb-2 line-clamp-2">
                              {event.post.content.text}
                            </p>

                            {/* Platforms */}
                            <div className="flex items-center space-x-2 mb-2">
                              {event.platforms.map((platform) => (
                                <div
                                  key={platform}
                                  className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-700"
                                  title={platform}
                                >
                                  <i className={`${PLATFORM_ICONS[platform]} text-sm text-gray-600 dark:text-gray-400`}></i>
                                </div>
                              ))}
                            </div>

                            {/* Meta */}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Erstellt von {event.createdBy}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                              <i className="ri-edit-line"></i>
                            </button>
                            <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                              <i className="ri-eye-line"></i>
                            </button>
                            <button className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            {Object.keys(groupedEvents).length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <i className="ri-calendar-line text-2xl text-gray-400 dark:text-gray-500"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Keine geplanten Beiträge
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Erstellen Sie Ihren ersten geplanten Beitrag
                </p>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <i className="ri-add-line mr-2"></i>
                  Beitrag planen
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulerView;
