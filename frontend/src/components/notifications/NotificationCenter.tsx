/**
 * NotificationCenter Component
 * Vollständige Notification-Verwaltung mit Filtering, Sorting und Actions
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  Filter,
  X,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useNotificationManager } from '../../hooks/useNotifications';
import {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NOTIFICATION_TYPE_CONFIG,
  NOTIFICATION_CATEGORY_CONFIG,
  NOTIFICATION_PRIORITY_CONFIG,
} from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  className?: string;
  maxHeight?: string;
  onClose?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = '',
  maxHeight = '600px',
  onClose,
}) => {
  const navigate = useNavigate();
  const {
    notifications,
    total,
    pages,
    page,
    setPage,
    hasNext,
    hasPrev,
    stats,
    unreadCount,
    isLoading,
    filters,
    setFilters,
    markAsRead,
    markAllAsRead,
    updateNotification,
    deleteNotification,
    bulkAction,
    isMarkingAsRead,
    isUpdating,
    isDeleting,
  } = useNotificationManager();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Select/Deselect notifications
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(notifications.map((n) => n.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Actions
  const handleMarkAsRead = async (id: string) => {
    await markAsRead([id]);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Benachrichtigung löschen?')) {
      await deleteNotification(id);
    }
  };

  const handleBulkMarkAsRead = async () => {
    await bulkAction(Array.from(selectedIds), 'mark_read');
    deselectAll();
  };

  const handleBulkDelete = async () => {
    if (confirm(`${selectedIds.size} Benachrichtigungen löschen?`)) {
      await bulkAction(Array.from(selectedIds), 'delete');
      deselectAll();
    }
  };

  const handleBulkArchive = async () => {
    await bulkAction(Array.from(selectedIds), 'archive');
    deselectAll();
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate to action URL if exists
    if (notification.action_url) {
      navigate(notification.action_url);
      if (onClose) onClose();
    }
  };

  // Get icon config based on metadata or type
  const getNotificationIcon = (notification: Notification) => {
    if (notification.metadata?.icon) {
      return notification.metadata.icon;
    }
    return NOTIFICATION_TYPE_CONFIG[notification.type].icon;
  };

  const getNotificationColor = (notification: Notification) => {
    if (notification.metadata?.color) {
      return notification.metadata.color;
    }
    return NOTIFICATION_TYPE_CONFIG[notification.type].color;
  };

  const getNotificationBgColor = (notification: Notification) => {
    return NOTIFICATION_TYPE_CONFIG[notification.type].bgColor;
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: de,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Benachrichtigungen
              </h3>
              {stats && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {unreadCount} ungelesen von {stats.total}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Filter"
            >
              <Filter className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAsRead}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              Alle als gelesen markieren
            </button>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {selectedIds.size} ausgewählt
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleBulkMarkAsRead}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Als gelesen markieren"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Archivieren"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600"
                title="Löschen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={deselectAll}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Status
              </label>
              <select
                value={filters.read === undefined ? 'all' : filters.read ? 'read' : 'unread'}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    read:
                      e.target.value === 'all'
                        ? undefined
                        : e.target.value === 'read',
                  })
                }
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="all">Alle</option>
                <option value="unread">Ungelesen</option>
                <option value="read">Gelesen</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Kategorie
              </label>
              <select
                value={filters.category || 'all'}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    category:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as NotificationCategory),
                  })
                }
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="all">Alle Kategorien</option>
                {Object.values(NotificationCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {NOTIFICATION_CATEGORY_CONFIG[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Priorität
              </label>
              <select
                value={filters.priority || 'all'}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priority:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as NotificationPriority),
                  })
                }
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="all">Alle Prioritäten</option>
                {Object.values(NotificationPriority).map((prio) => (
                  <option key={prio} value={prio}>
                    {NOTIFICATION_PRIORITY_CONFIG[prio].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Typ
              </label>
              <select
                value={filters.type || 'all'}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    type:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as NotificationType),
                  })
                }
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="all">Alle Typen</option>
                {Object.values(NotificationType).map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.read !== undefined ||
            filters.category ||
            filters.priority ||
            filters.type) && (
            <button
              onClick={() => setFilters({})}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Laden...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
              Keine Benachrichtigungen
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Sie haben derzeit keine Benachrichtigungen
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notification) => {
              const icon = getNotificationIcon(notification);
              const color = getNotificationColor(notification);
              const bgColor = getNotificationBgColor(notification);
              const isSelected = selectedIds.has(notification.id);

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`
                    border-b border-gray-200 dark:border-gray-700 p-4 
                    transition-colors cursor-pointer
                    ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                    ${isSelected ? 'bg-blue-100 dark:bg-blue-900/20' : ''}
                    hover:bg-gray-50 dark:hover:bg-gray-800/50
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(notification.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 rounded border-gray-300 dark:border-gray-600"
                    />

                    {/* Icon */}
                    <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <i className={`${icon} ${color} text-lg`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                          {notification.priority !== NotificationPriority.NORMAL && (
                            <span
                              className={`text-xs font-medium ${
                                NOTIFICATION_PRIORITY_CONFIG[notification.priority].color
                              }`}
                            >
                              {NOTIFICATION_PRIORITY_CONFIG[notification.priority].label}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <i className={NOTIFICATION_CATEGORY_CONFIG[notification.category].icon}></i>
                          {NOTIFICATION_CATEGORY_CONFIG[notification.category].label}
                        </span>
                        {notification.related_entity_title && (
                          <span className="flex items-center gap-1">
                            <span>•</span>
                            {notification.related_entity_title}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {notification.action_label && notification.action_url && (
                        <button
                          className="mt-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notification);
                          }}
                        >
                          {notification.action_label}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-1">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title="Als gelesen markieren"
                        >
                          <Check className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!hasPrev}
              className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Zurück
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Seite {page} von {pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasNext}
              className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
