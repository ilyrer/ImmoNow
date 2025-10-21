/**
 * LiveIndicator Component
 * Shows live status indicator for real-time data
 */

import React from 'react';
import { motion } from 'framer-motion';

interface LiveIndicatorProps {
  isLive?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  isLive = true,
  pulse = true,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.7, 1],
    },
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} rounded-full ${
          isLive ? 'bg-green-500' : 'bg-gray-400'
        }`}
        variants={pulse ? pulseVariants : undefined}
        animate={pulse && isLive ? 'animate' : undefined}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span className={`text-xs font-medium ${
        isLive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
      }`}>
        {isLive ? 'Live' : 'Offline'}
      </span>
    </div>
  );
};
