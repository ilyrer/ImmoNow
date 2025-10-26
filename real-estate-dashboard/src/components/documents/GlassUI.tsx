import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  selected?: boolean;
  expired?: boolean;
  variant?: 'default' | 'elevated' | 'subtle';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = true,
  onClick,
  selected = false,
  expired = false,
  variant = 'default'
}) => {
  const baseClasses = 'document-card-glass';
  const variantClasses = {
    default: '',
    elevated: 'glass-hover-lift',
    subtle: 'glass-hover-glow'
  };
  
  const stateClasses = [
    selected ? 'selected' : '',
    expired ? 'expired' : '',
    hover ? variantClasses[variant] : ''
  ].filter(Boolean).join(' ');

  const cardElement = (
    <div
      className={`${baseClasses} ${stateClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );

  if (hover) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {cardElement}
      </motion.div>
    );
  }

  return cardElement;
};

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  icon,
  className = '',
  type = 'button'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    default: 'glass-button',
    primary: 'glass-button primary',
    secondary: 'glass-button',
    danger: 'glass-button'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
};

interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'search';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  error?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  className = '',
  icon,
  error = false
}) => {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`glass-input w-full ${icon ? 'pl-10' : ''} ${
          error ? 'border-red-500' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
};

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const variantClasses = {
    default: 'glass-badge',
    success: 'glass-badge bg-green-500/20 text-green-700 border-green-500/30',
    warning: 'glass-badge bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    error: 'glass-badge bg-red-500/20 text-red-700 border-red-500/30',
    info: 'glass-badge bg-blue-500/20 text-blue-700 border-blue-500/30'
  };

  return (
    <span className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};

interface GlassProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export const GlassProgress: React.FC<GlassProgressProps> = ({
  value,
  max = 100,
  className = '',
  showLabel = false
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`glass-progress ${className}`}>
      <div
        className="glass-progress-bar"
        style={{ width: `${percentage}%` }}
      />
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

interface GlassTooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const GlassTooltip: React.FC<GlassTooltipProps> = ({
  children,
  content,
  position = 'top',
  className = ''
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className={`relative group ${className}`}>
      {children}
      <div className={`absolute ${positionClasses[position]} glass-tooltip opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50`}>
        {content}
        <div className={`absolute w-2 h-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transform rotate-45 ${
          position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 -mt-1' :
          position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1' :
          position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 -ml-1' :
          'right-full top-1/2 transform -translate-y-1/2 -mr-1'
        }`} />
      </div>
    </div>
  );
};

interface GlassDropdownProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const GlassDropdown: React.FC<GlassDropdownProps> = ({
  children,
  isOpen,
  onClose,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`glass-dropdown ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface GlassModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  children,
  isOpen,
  onClose,
  size = 'md',
  className = ''
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`glass-modal w-full ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Components are already exported above with their declarations
