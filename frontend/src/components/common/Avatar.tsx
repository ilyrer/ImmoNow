import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'away' | 'busy' | 'offline';
  className?: string;
  showStatus?: boolean;
}

/**
 * Avatar Component
 * Apple Glass Design Avatar with status indicators
 * Supports image or initials fallback
 */
export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  name = '',
  size = 'md', 
  status,
  className = '',
  showStatus = false
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400 dark:bg-gray-600'
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`
          ${sizes[size]} 
          rounded-full 
          overflow-hidden 
          bg-gradient-to-br from-blue-500 to-purple-600
          dark:from-blue-600 dark:to-purple-700
          flex items-center justify-center
          text-white font-semibold
          backdrop-blur-sm
          border-2 border-white/20 dark:border-white/10
          shadow-soft
          transition-all duration-200
          hover:scale-105
        `}
        role="img"
        aria-label={alt || name || 'Avatar'}
      >
        {src ? (
          <img 
            src={src} 
            alt={alt || name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      
      {showStatus && status && (
        <span 
          className={`
            absolute bottom-0 right-0 
            ${statusSizes[size]} 
            ${statusColors[status]}
            rounded-full 
            border-2 border-white dark:border-gray-800
            ring-2 ring-white/50 dark:ring-gray-800/50
          `}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name: string;
    alt?: string;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

/**
 * AvatarGroup Component
 * Display multiple avatars with overflow indicator
 */
export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = 'md',
  className = ''
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);

  const overlapClasses = {
    xs: '-space-x-2',
    sm: '-space-x-3',
    md: '-space-x-3',
    lg: '-space-x-4',
    xl: '-space-x-5',
    '2xl': '-space-x-6'
  };

  return (
    <div className={`flex items-center ${overlapClasses[size]} ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className="ring-2 ring-white dark:ring-gray-800 rounded-full"
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
          />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className="ring-2 ring-white dark:ring-gray-800 rounded-full"
          style={{ zIndex: 0 }}
        >
          <div 
            className={`
              ${size === 'xs' ? 'w-6 h-6 text-xs' : ''}
              ${size === 'sm' ? 'w-8 h-8 text-sm' : ''}
              ${size === 'md' ? 'w-10 h-10 text-base' : ''}
              ${size === 'lg' ? 'w-12 h-12 text-lg' : ''}
              ${size === 'xl' ? 'w-16 h-16 text-xl' : ''}
              ${size === '2xl' ? 'w-20 h-20 text-2xl' : ''}
              rounded-full 
              bg-gray-200 dark:bg-gray-700
              flex items-center justify-center
              text-gray-700 dark:text-gray-300
              font-semibold
              backdrop-blur-sm
              border-2 border-white/20 dark:border-white/10
            `}
          >
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
};
