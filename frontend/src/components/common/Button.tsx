import React from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ButtonProps as ShadcnButtonProps } from '@/components/ui/button';

interface ButtonProps extends Omit<ShadcnButtonProps, 'variant' | 'size'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'default', 
  children, 
  className,
  icon,
  ...props 
}) => {
  // Map custom 'primary' variant to 'default'
  const shadcnVariant = variant === 'primary' ? 'default' : variant;

  return (
    <ShadcnButton
      variant={shadcnVariant as any}
      size={size as any}
      className={cn(
        variant === 'primary' && "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </ShadcnButton>
  );
};
