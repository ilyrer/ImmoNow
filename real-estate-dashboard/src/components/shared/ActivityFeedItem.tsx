/**
 * ActivityFeedItem Component
 * Single activity item in the activity feed
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  PlusCircle, 
  Calendar, 
  MessageCircle, 
  User, 
  Home,
  FileText,
  Clock
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  member_id: string;
  member_name: string;
  member_avatar?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedItemProps {
  activity: ActivityItem;
  className?: string;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  activity,
  className = '',
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'property_added':
      case 'property_updated':
        return <Home className="w-4 h-4 text-blue-500" />;
      case 'appointment_created':
      case 'appointment_scheduled':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'comment_added':
        return <MessageCircle className="w-4 h-4 text-orange-500" />;
      case 'user_joined':
        return <User className="w-4 h-4 text-indigo-500" />;
      case 'document_uploaded':
        return <FileText className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
      case 'task_completed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'property_added':
      case 'property_updated':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'appointment_created':
      case 'appointment_scheduled':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'comment_added':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'user_joined':
        return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
      case 'document_uploaded':
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Gerade eben';
    } else if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} Min`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `vor ${hours} Std`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-lg border ${getActivityColor(activity.type)} ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Activity Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getActivityIcon(activity.type)}
        </div>

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Member Avatar */}
            <div className="flex-shrink-0">
              {activity.member_avatar ? (
                <img
                  src={activity.member_avatar}
                  alt={activity.member_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                  {getInitials(activity.member_name)}
                </div>
              )}
            </div>

            {/* Activity Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {activity.title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {activity.description}
              </p>
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-500">
              {formatTimestamp(activity.timestamp)}
            </div>
          </div>

          {/* Metadata */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(activity.metadata).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                >
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
