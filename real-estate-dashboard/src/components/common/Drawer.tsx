import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  showOverlay?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

/**
 * Drawer Component
 * Apple Glass Design Drawer/Sidebar with smooth animations
 */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  className = '',
  showOverlay = true,
  closeOnOverlayClick = true,
  closeOnEsc = true
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  const positions = {
    left: {
      container: 'left-0',
      transform: isOpen ? 'translate-x-0' : '-translate-x-full'
    },
    right: {
      container: 'right-0',
      transform: isOpen ? 'translate-x-0' : 'translate-x-full'
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTab);
      };
    }
  }, [isOpen]);

  if (!isOpen && !showOverlay) return null;

  return (
    <div
      className={`fixed inset-0 z-50 ${!isOpen && 'pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      {/* Overlay */}
      {showOverlay && (
        <div
          className={`
            fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm
            transition-opacity duration-300
            ${isOpen ? 'opacity-100' : 'opacity-0'}
          `}
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed top-0 ${positions[position].container} h-full w-full ${sizes[size]}
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl
          shadow-2xl
          transition-transform duration-300 ease-out
          ${positions[position].transform}
          ${className}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          {title && (
            <div className="
              flex items-center justify-between 
              px-6 py-4 
              border-b border-gray-200 dark:border-gray-700
            ">
              <h2 
                id="drawer-title"
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="
                  p-2 rounded-lg
                  text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-colors duration-200
                "
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface DrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

interface DrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const DrawerBody: React.FC<DrawerBodyProps> = ({ children, className = '' }) => (
  <div className={`flex-1 ${className}`}>
    {children}
  </div>
);

interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const DrawerFooter: React.FC<DrawerFooterProps> = ({ children, className = '' }) => (
  <div className={`
    mt-6 pt-4 
    border-t border-gray-200 dark:border-gray-700
    flex items-center justify-end gap-3
    ${className}
  `}>
    {children}
  </div>
);
