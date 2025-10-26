import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassButton, GlassBadge } from './GlassUI';
import { 
  Download, 
  Share, 
  Trash2, 
  Copy, 
  Move, 
  Tag, 
  Archive,
  X,
  CheckSquare,
  Square,
  MoreVertical
} from 'lucide-react';

interface BulkActionsBarProps {
  isVisible: boolean;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
  className?: string;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  isVisible,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  className = ''
}) => {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  const bulkActions = [
    {
      id: 'download',
      label: 'Herunterladen',
      icon: Download,
      variant: 'default' as const,
      shortcut: 'Ctrl+D'
    },
    {
      id: 'share',
      label: 'Teilen',
      icon: Share,
      variant: 'default' as const,
      shortcut: 'Ctrl+Shift+S'
    },
    {
      id: 'copy',
      label: 'Kopieren',
      icon: Copy,
      variant: 'default' as const,
      shortcut: 'Ctrl+C'
    },
    {
      id: 'move',
      label: 'Verschieben',
      icon: Move,
      variant: 'default' as const,
      shortcut: 'Ctrl+X'
    },
    {
      id: 'tag',
      label: 'Tags hinzufügen',
      icon: Tag,
      variant: 'default' as const
    },
    {
      id: 'archive',
      label: 'Archivieren',
      icon: Archive,
      variant: 'default' as const
    },
    {
      id: 'delete',
      label: 'Löschen',
      icon: Trash2,
      variant: 'danger' as const,
      shortcut: 'Del'
    }
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
      >
        <GlassCard className="p-4 shadow-2xl border border-white/30 dark:border-gray-600/30">
          <div className="flex items-center space-x-4">
            {/* Selection Info */}
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={isAllSelected ? onClearSelection : onSelectAll}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isAllSelected ? (
                  <CheckSquare className="w-5 h-5 text-blue-500" />
                ) : isPartiallySelected ? (
                  <div className="w-5 h-5 border-2 border-blue-500 rounded bg-blue-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
                  </div>
                ) : (
                  <Square className="w-5 h-5 border-2 border-gray-400 rounded" />
                )}
                <span>
                  {isAllSelected ? 'Alle abwählen' : 
                   isPartiallySelected ? `${selectedCount} ausgewählt` : 
                   'Alle auswählen'}
                </span>
              </motion.button>

              <GlassBadge variant="info" size="sm">
                {selectedCount} von {totalCount} Dokumenten
              </GlassBadge>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-2">
              {bulkActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <GlassButton
                    onClick={() => onBulkAction(action.id)}
                    variant={action.variant}
                    size="sm"
                    icon={<action.icon className="w-4 h-4" />}
                    className={`${
                      action.variant === 'danger' 
                        ? 'hover:bg-red-500 hover:text-white' 
                        : ''
                    }`}
                  >
                    <span className="hidden sm:inline">{action.label}</span>
                    {action.shortcut && (
                      <span className="ml-1 text-xs opacity-70 hidden lg:inline">
                        {action.shortcut}
                      </span>
                    )}
                  </GlassButton>
                </motion.div>
              ))}
            </div>

            {/* Close Button */}
            <motion.button
              onClick={onClearSelection}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/30 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Progress Indicator */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-b-xl"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ transformOrigin: 'left' }}
          />
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default BulkActionsBar;
