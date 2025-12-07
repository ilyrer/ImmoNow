import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = false,
}) => {
  return (
    <div
      className={`
        relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl
        rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700
        ${hover ? 'hover:shadow-3xl hover:scale-[1.01] transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export interface GlassButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  className = '',
}) => {
  const variants = {
    primary: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 border-blue-500/30',
    secondary: 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 border-gray-500/30',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 border-red-500/30',
    success: 'bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        backdrop-blur-sm rounded-xl border
        font-medium transition-all duration-200
        flex items-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:shadow-lg
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
}) => {
  const variants = {
    default: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30',
    success: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        ${variants[variant]}
        ${sizes[size]}
        inline-flex items-center rounded-full border backdrop-blur-sm
        font-medium
      `}
    >
      {children}
    </span>
  );
};

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-500/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
        {description}
      </p>
      {action && (
        <GlassButton onClick={action.onClick} variant="primary">
          {action.label}
        </GlassButton>
      )}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin`}
      />
    </div>
  );
};
