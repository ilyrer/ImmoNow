import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

// Apple Glass Design Card Component
export const Card: React.FC<CardProps> = ({ children, className }) => (
  <div className={`bg-white dark:bg-glass-dark backdrop-blur-4xl rounded-xl border border-gray-200 dark:border-glass-dark-border shadow-soft dark:shadow-apple-soft transition-all duration-200 hover:scale-102 hover:shadow-card dark:hover:shadow-apple-card ${className || ''}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={`px-6 py-4 border-b border-gray-200 dark:border-glass-dark-border ${className || ''}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-dark-text-primary ${className || ''}`}>
    {children}
  </h3>
);

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={`px-6 py-4 ${className || ''}`}>
    {children}
  </div>
);
