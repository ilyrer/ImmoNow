import React from 'react';
import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
  CardDescription,
  CardContent as ShadcnCardContent,
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// Apple Glass Design Card Component using shadcn/ui
export const Card: React.FC<CardProps> = ({ children, className, ...props }) => (
  <ShadcnCard
    className={cn(
      "bg-white dark:bg-glass-dark backdrop-blur-4xl rounded-xl border border-gray-200 dark:border-glass-dark-border shadow-soft dark:shadow-apple-soft transition-all duration-200 hover:scale-[1.02] hover:shadow-card dark:hover:shadow-apple-card",
      className
    )}
    {...props}
  >
    {children}
  </ShadcnCard>
);

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className, ...props }) => (
  <ShadcnCardHeader
    className={cn("px-6 py-4 border-b border-gray-200 dark:border-glass-dark-border", className)}
    {...props}
  >
    {children}
  </ShadcnCardHeader>
);

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className, ...props }) => (
  <ShadcnCardTitle
    className={cn("text-lg font-semibold text-gray-900 dark:text-dark-text-primary", className)}
    {...props}
  >
    {children}
  </ShadcnCardTitle>
);

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className, ...props }) => (
  <ShadcnCardContent
    className={cn("px-6 py-4", className)}
    {...props}
  >
    {children}
  </ShadcnCardContent>
);

export { CardDescription, CardFooter };
