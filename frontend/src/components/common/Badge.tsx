import React from 'react';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BadgeProps as ShadcnBadgeProps } from '@/components/ui/badge';

interface BadgeProps extends Omit<ShadcnBadgeProps, 'variant'> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'danger' | 'error';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className,
  ...props
}) => {
  // Map custom variants to shadcn variants
  const shadcnVariant = variant === 'success' || variant === 'warning' || variant === 'danger' || variant === 'error'
    ? 'destructive'
    : variant;

  const customVariantClasses = {
    success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    error: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  };

  return (
    <ShadcnBadge
      variant={shadcnVariant as any}
      className={cn(
        variant === 'success' && customVariantClasses.success,
        variant === 'warning' && customVariantClasses.warning,
        (variant === 'danger' || variant === 'error') && customVariantClasses.error,
        className
      )}
      {...props}
    >
      {children}
    </ShadcnBadge>
  );
};
