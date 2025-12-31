import React, { useEffect, useState } from 'react';
import apiClient from '../../../../lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface Activity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
  user_name?: string;
}

const ActivityFeedWidget: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to fetch from dashboard analytics first
        const response = await apiClient.get('/api/v1/analytics/dashboard');
        const data = (response as any)?.data || {};
        
        // Extract recent activities
        const recentActivities = data.recent_activities || [];
        
        setActivities(recentActivities.slice(0, 5));
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Fehler beim Laden der Aktivitäten');
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();

    // Auto-refresh every minute
    const interval = setInterval(fetchActivities, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: string): string => {
    const normalizedType = type?.toLowerCase() || '';
    if (normalizedType.includes('property') || normalizedType.includes('immobilie')) return 'ri-home-4-line';
    if (normalizedType.includes('appointment') || normalizedType.includes('termin') || normalizedType.includes('calendar')) return 'ri-calendar-line';
    if (normalizedType.includes('document') || normalizedType.includes('dokument') || normalizedType.includes('upload')) return 'ri-file-text-line';
    if (normalizedType.includes('task') || normalizedType.includes('aufgabe')) return 'ri-task-line';
    if (normalizedType.includes('contact') || normalizedType.includes('kontakt') || normalizedType.includes('client')) return 'ri-user-line';
    if (normalizedType.includes('message') || normalizedType.includes('nachricht') || normalizedType.includes('email')) return 'ri-mail-line';
    return 'ri-notification-line';
  };

  const getActivityColor = (type: string): string => {
    const normalizedType = type?.toLowerCase() || '';
    if (normalizedType.includes('property') || normalizedType.includes('immobilie')) return 'blue';
    if (normalizedType.includes('appointment') || normalizedType.includes('termin')) return 'green';
    if (normalizedType.includes('document') || normalizedType.includes('dokument')) return 'purple';
    if (normalizedType.includes('task') || normalizedType.includes('aufgabe')) return 'orange';
    if (normalizedType.includes('contact') || normalizedType.includes('kontakt')) return 'pink';
    if (normalizedType.includes('message') || normalizedType.includes('email')) return 'teal';
    return 'gray';
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'gerade eben';
      if (diffMins < 60) return `vor ${diffMins} Min`;
      if (diffHours < 24) return `vor ${diffHours} Std`;
      if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'Kürzlich';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Aktivitäten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 dark:text-red-400 py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Aktivitäten</CardTitle>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
      </CardHeader>
      <CardContent>

      {activities.length > 0 ? (
        <>
          <div className="space-y-4">
            {activities.map((activity) => {
              const icon = getActivityIcon(activity.type);
              const color = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/30 flex-shrink-0`}>
                    <i className={`${icon} text-${color}-600 dark:text-${color}-400 text-sm`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.user_name || activity.user ? (
                        <span className="font-medium">{activity.user_name || activity.user} </span>
                      ) : null}
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Weitere Aktivitäten laden
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <i className="ri-notification-line text-4xl text-gray-400 mb-4"></i>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Aktivitäten
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            Es sind noch keine Aktivitäten verfügbar.
          </p>
        </div>
      )}

      {/* Live Status */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live-Daten</span>
          </div>
          <span>Aktualisiert: {new Date().toLocaleTimeString('de-DE')}</span>
        </div>
      </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeedWidget;
