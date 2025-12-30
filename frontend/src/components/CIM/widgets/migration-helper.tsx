/**
 * Helper utilities for migrating widgets to shadcn/ui
 * This file provides common patterns for widget migration
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const WidgetCard = Card;
export const WidgetCardContent = CardContent;
export const WidgetCardHeader = CardHeader;
export const WidgetCardTitle = CardTitle;
export const WidgetCardDescription = CardDescription;
export const WidgetSkeleton = Skeleton;
export const WidgetBadge = Badge;
export const WidgetButton = Button;
export const WidgetAlertIcon = AlertCircle;

/**
 * Common loading state component for widgets
 */
export const WidgetLoadingState: React.FC<{ title?: string }> = ({ title }) => (
  <Card className="h-full">
    <CardHeader>
      {title ? <Skeleton className="h-6 w-32" /> : <Skeleton className="h-6 w-24" />}
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center h-32">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Common error state component for widgets
 */
export const WidgetErrorState: React.FC<{ title: string; error: string }> = ({ title, error }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center text-red-600 dark:text-red-400 py-8">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        {error}
      </div>
    </CardContent>
  </Card>
);

