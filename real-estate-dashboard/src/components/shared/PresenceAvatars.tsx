/**
 * PresenceAvatars Component
 * Shows who is currently online/viewing/typing
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
}

interface PresenceAvatarsProps {
  users: User[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const PresenceAvatars: React.FC<PresenceAvatarsProps> = ({
  users,
  maxVisible = 5,
  size = 'md',
  showCount = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-2">
        <AnimatePresence>
          {visibleUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-gray-800 relative`}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {getInitials(user.name)}
                </div>
              )}
              
              {/* Status indicator */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(user.status || 'offline')}`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Remaining count */}
      {remainingCount > 0 && showCount && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium ml-2`}
        >
          +{remainingCount}
        </motion.div>
      )}

      {/* Total count */}
      {users.length > 0 && showCount && (
        <div className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {users.length} {users.length === 1 ? 'Person' : 'Personen'} online
        </div>
      )}
    </div>
  );
};
