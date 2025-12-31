import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  footer?: React.ReactNode;
}

/**
 * Drawer Component
 * Apple Glass Design Drawer/Sidebar using shadcn/ui Sheet
 */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  position = 'right',
  size = 'md',
  className,
  footer
}) => {
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    full: 'sm:max-w-full'
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side={position}
        className={cn(
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl",
          sizeClasses[size],
          className
        )}
      >
        {(title || description) && (
          <SheetHeader>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        <div className="flex-1 overflow-y-auto py-4">
          {children}
        </div>
        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
};

interface DrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({ children, className }) => (
  <SheetHeader className={cn("mb-4", className)}>
    {children}
  </SheetHeader>
);

interface DrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const DrawerBody: React.FC<DrawerBodyProps> = ({ children, className }) => (
  <div className={cn("flex-1", className)}>
    {children}
  </div>
);

interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const DrawerFooter: React.FC<DrawerFooterProps> = ({ children, className }) => (
  <SheetFooter className={cn("mt-6 pt-4 border-t border-gray-200 dark:border-gray-700", className)}>
    {children}
  </SheetFooter>
);
