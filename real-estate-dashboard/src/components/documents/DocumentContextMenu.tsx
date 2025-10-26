import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Download, 
  Share, 
  Edit, 
  Trash2, 
  Copy, 
  Move, 
  Tag, 
  Star, 
  Archive, 
  MoreVertical,
  FileText,
  FolderPlus,
  Link,
  Settings,
  History,
  Lock,
  Unlock
} from 'lucide-react';

interface ContextMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning';
  disabled?: boolean;
  shortcut?: string;
}

interface ContextMenuGroup {
  id: string;
  label?: string;
  actions: ContextMenuAction[];
}

interface DocumentContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  document?: any;
  documents?: any[];
  onAction: (action: string, document?: any) => void;
  className?: string;
}

const DocumentContextMenu: React.FC<DocumentContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  document,
  documents = [],
  onAction,
  className = ''
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position if menu would go off-screen
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let newX = position.x;
      let newY = position.y;

      // Adjust horizontal position
      if (rect.right > viewport.width) {
        newX = viewport.width - rect.width - 10;
      }
      if (newX < 10) {
        newX = 10;
      }

      // Adjust vertical position
      if (rect.bottom > viewport.height) {
        newY = viewport.height - rect.height - 10;
      }
      if (newY < 10) {
        newY = 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isOpen, position]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const isMultipleSelection = documents.length > 1;

  const getMenuGroups = (): ContextMenuGroup[] => {
    if (isMultipleSelection) {
      return [
        {
          id: 'bulk-actions',
          actions: [
            {
              id: 'bulk-download',
              label: 'Alle herunterladen',
              icon: <Download className="w-4 h-4" />,
              onClick: () => onAction('bulk-download', documents),
              shortcut: 'Ctrl+D'
            },
            {
              id: 'bulk-move',
              label: 'Verschieben nach...',
              icon: <Move className="w-4 h-4" />,
              onClick: () => onAction('bulk-move', documents)
            },
            {
              id: 'bulk-copy',
              label: 'Kopieren nach...',
              icon: <Copy className="w-4 h-4" />,
              onClick: () => onAction('bulk-copy', documents)
            },
            {
              id: 'bulk-tag',
              label: 'Tags hinzufügen',
              icon: <Tag className="w-4 h-4" />,
              onClick: () => onAction('bulk-tag', documents)
            }
          ]
        },
        {
          id: 'bulk-danger',
          actions: [
            {
              id: 'bulk-delete',
              label: 'Alle löschen',
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => onAction('bulk-delete', documents),
              variant: 'danger',
              shortcut: 'Del'
            }
          ]
        }
      ];
    }

    return [
      {
        id: 'primary',
        actions: [
          {
            id: 'preview',
            label: 'Vorschau',
            icon: <Eye className="w-4 h-4" />,
            onClick: () => onAction('preview', document),
            shortcut: 'Space'
          },
          {
            id: 'download',
            label: 'Herunterladen',
            icon: <Download className="w-4 h-4" />,
            onClick: () => onAction('download', document),
            shortcut: 'Ctrl+D'
          },
          {
            id: 'share',
            label: 'Teilen',
            icon: <Share className="w-4 h-4" />,
            onClick: () => onAction('share', document),
            shortcut: 'Ctrl+Shift+S'
          }
        ]
      },
      {
        id: 'edit',
        actions: [
          {
            id: 'edit',
            label: 'Bearbeiten',
            icon: <Edit className="w-4 h-4" />,
            onClick: () => onAction('edit', document),
            shortcut: 'F2'
          },
          {
            id: 'rename',
            label: 'Umbenennen',
            icon: <FileText className="w-4 h-4" />,
            onClick: () => onAction('rename', document),
            shortcut: 'F2'
          },
          {
            id: 'copy',
            label: 'Kopieren',
            icon: <Copy className="w-4 h-4" />,
            onClick: () => onAction('copy', document),
            shortcut: 'Ctrl+C'
          },
          {
            id: 'move',
            label: 'Verschieben',
            icon: <Move className="w-4 h-4" />,
            onClick: () => onAction('move', document),
            shortcut: 'Ctrl+X'
          }
        ]
      },
      {
        id: 'organize',
        actions: [
          {
            id: 'favorite',
            label: document?.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen',
            icon: <Star className={`w-4 h-4 ${document?.isFavorite ? 'fill-current' : ''}`} />,
            onClick: () => onAction('toggle-favorite', document),
            shortcut: 'Ctrl+F'
          },
          {
            id: 'tag',
            label: 'Tags verwalten',
            icon: <Tag className="w-4 h-4" />,
            onClick: () => onAction('manage-tags', document)
          },
          {
            id: 'archive',
            label: 'Archivieren',
            icon: <Archive className="w-4 h-4" />,
            onClick: () => onAction('archive', document)
          }
        ]
      },
      {
        id: 'advanced',
        actions: [
          {
            id: 'versions',
            label: 'Versionen anzeigen',
            icon: <History className="w-4 h-4" />,
            onClick: () => onAction('show-versions', document),
            disabled: !document?.versions || document.versions.length <= 1
          },
          {
            id: 'permissions',
            label: 'Berechtigungen',
            icon: <Settings className="w-4 h-4" />,
            onClick: () => onAction('permissions', document)
          },
          {
            id: 'properties',
            label: 'Eigenschaften',
            icon: <FileText className="w-4 h-4" />,
            onClick: () => onAction('properties', document),
            shortcut: 'Alt+Enter'
          }
        ]
      },
      {
        id: 'danger',
        actions: [
          {
            id: 'delete',
            label: 'Löschen',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => onAction('delete', document),
            variant: 'danger',
            shortcut: 'Del'
          }
        ]
      }
    ];
  };

  const handleActionClick = (action: ContextMenuAction) => {
    if (!action.disabled) {
      action.onClick();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={`context-menu-glass fixed z-50 min-w-48 ${className}`}
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y
        }}
      >
        {getMenuGroups().map((group, groupIndex) => (
          <div key={group.id}>
            {groupIndex > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            )}
            
            {group.label && (
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {group.label}
              </div>
            )}
            
            <div className="py-1">
              {group.actions.map((action) => (
                <motion.button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                    action.disabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : action.variant === 'danger'
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : action.variant === 'warning'
                      ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                  whileHover={!action.disabled ? { backgroundColor: 'rgba(0,0,0,0.05)' } : {}}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`${action.disabled ? 'opacity-50' : ''}`}>
                      {action.icon}
                    </span>
                    <span>{action.label}</span>
                  </div>
                  {action.shortcut && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {action.shortcut}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentContextMenu;
