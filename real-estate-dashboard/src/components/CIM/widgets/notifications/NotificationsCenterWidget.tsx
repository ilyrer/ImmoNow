import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, Filter } from 'lucide-react';

interface NotificationData {
  unreadCount: number;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    createdAt: string;
    isRead: boolean;
  }>;
}

const NotificationsCenterWidget: React.FC = () => {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  useEffect(() => {
    const fetchNotificationData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch notifications
        const response = await fetch('/api/v1/notifications?unread_only=true&size=10');
        const data = await response.json();

        console.log('📊 Notifications Response:', data);

        setNotificationData({
          unreadCount: data.unread_count || 0,
          notifications: (data.notifications || []).map((notif: any) => ({
            id: notif.id || '',
            title: notif.title || 'Benachrichtigung',
            message: notif.message || 'Keine Nachricht',
            type: notif.type || 'info',
            createdAt: notif.created_at || new Date().toISOString(),
            isRead: notif.is_read || false
          }))
        });

      } catch (error) {
        console.error('❌ Error fetching notification data:', error);
        // Fallback data
        setNotificationData({
          unreadCount: 0,
          notifications: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotificationData();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchNotificationData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      // Update local state
      if (notificationData) {
        setNotificationData({
          ...notificationData,
          notifications: notificationData.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          ),
          unreadCount: Math.max(0, notificationData.unreadCount - 1)
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/v1/notifications/mark-all-read', {
        method: 'POST'
      });
      
      // Update local state
      if (notificationData) {
        setNotificationData({
          ...notificationData,
          notifications: notificationData.notifications.map(notif => ({ ...notif, isRead: true })),
          unreadCount: 0
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Benachrichtigungen...</p>
        </div>
      </div>
    );
  }

  if (!notificationData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Keine Benachrichtigungen verfügbar</p>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notificationData.notifications.filter(notif => !notif.isRead)
    : notificationData.notifications;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <Bell className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Benachrichtigungen
        </h3>
        <div className="flex items-center space-x-2">
          {notificationData.unreadCount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {notificationData.unreadCount}
            </div>
          )}
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          Ungelesen ({notificationData.unreadCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          Alle
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.slice(0, 5).map((notification, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getTypeColor(notification.type)} ${
                !notification.isRead ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 min-w-0 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {notification.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {notification.message}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(notification.createdAt).toLocaleString('de-DE')}
                    </div>
                  </div>
                </div>
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Als gelesen markieren"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
            <Bell className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === 'unread' ? 'Keine ungelesenen Benachrichtigungen' : 'Keine Benachrichtigungen'}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {notificationData.unreadCount > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={markAllAsRead}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <CheckCircle className="w-3 h-3" />
            <span>Alle als gelesen markieren</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsCenterWidget;
