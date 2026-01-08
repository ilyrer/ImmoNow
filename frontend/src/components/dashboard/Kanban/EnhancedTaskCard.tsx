import React from 'react';
import { motion } from 'framer-motion';
import { Draggable } from '@hello-pangea/dnd';
import { Task, TaskPriority } from '../../../types/kanban';

/**
 * ============================================================================
 * ENHANCED TASK CARD
 * Premium task card with Apple Glassmorphism design
 * Features: Priority badges, property info, subtasks, progress, assignee
 * ============================================================================
 */

interface EnhancedTaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
  selected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
  bulkMode?: boolean;
  isDragging?: boolean;
}

type PriorityConfigKey = 'critical' | 'high' | 'medium' | 'low';

const PRIORITY_CONFIG: Record<PriorityConfigKey, any> = {
  critical: {
    icon: '▲▲',
    label: 'Kritisch',
    color: '#FF453A',
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20'
  },
  high: {
    icon: '▲',
    label: 'Hoch',
    color: '#FF9F0A',
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20'
  },
  medium: {
    icon: '▬',
    label: 'Mittel',
    color: '#FFD60A',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20'
  },
  low: {
    icon: '▼',
    label: 'Niedrig',
    color: '#32D74B',
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20'
  }
};

const getPriorityKey = (priority: TaskPriority): PriorityConfigKey => {
  // Map various priority values to config keys
  const priorityMap: Record<string, PriorityConfigKey> = {
    'highest': 'critical',
    'critical': 'critical',
    'urgent': 'critical',
    'high': 'high',
    'medium': 'medium',
    'low': 'low',
    'lowest': 'low'
  };
  return priorityMap[priority.toLowerCase()] || 'medium';
};

const EnhancedTaskCardComponent: React.FC<EnhancedTaskCardProps> = ({
  task,
  index,
  onClick,
  selected = false,
  onSelect,
  bulkMode = false,
}) => {
  const priorityConfig = PRIORITY_CONFIG[getPriorityKey(task.priority)];
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const hasProperty = !!task.property;
  const hasComments = task.comments.length > 0;
  const hasAttachments = task.attachments.length > 0;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(task.id, !selected);
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={bulkMode && !selected}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group relative bg-white dark:bg-gray-800 rounded-lg 
            p-3 border cursor-pointer
            ${snapshot.isDragging
              ? `shadow-xl scale-[1.02] border-blue-400 bg-white dark:bg-gray-800 z-50 
                 ring-2 ring-blue-300 dark:ring-blue-700`
              : selected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md ring-1 ring-blue-300 dark:ring-blue-700'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md hover:-translate-y-0.5'
            }
            ${snapshot.isDragging ? '' : 'transition-all duration-150'}
          `}
          style={{
            ...provided.draggableProps.style,
            transition: snapshot.isDragging ? 'none' : 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Selection Checkbox - Bulk Mode */}
          {bulkMode && (
            <div
              className="absolute top-3 left-3 z-10"
              onClick={handleCheckboxClick}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-5 h-5 rounded flex items-center justify-center transition-all
                  cursor-pointer border
                  ${selected
                    ? 'bg-blue-600 dark:bg-blue-500 border-blue-700 dark:border-blue-400'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                {selected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-white text-sm font-bold"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.div>
            </div>
          )}

          <div className={bulkMode ? 'ml-7' : ''}>
            {/* Header: ID & Priority */}
            <div className="flex items-center justify-between mb-2 pr-20">
              <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 
                bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                {task.id}
              </span>
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                ${priorityConfig.bg} ${priorityConfig.border} border`}>
                <span>{priorityConfig.icon}</span>
                <span className={priorityConfig.text}>
                  {priorityConfig.label}
                </span>
              </div>
            </div>

            {/* Task Title */}
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-2 
              leading-snug">
              {task.title}
            </h4>

            {/* Task Description */}
            {task.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Property Information - PROMINENT */}
            {hasProperty && task.property && (
              <motion.div
                whileHover={{ scale: 1.005 }}
                className="mb-2.5 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border 
                  border-blue-200 dark:border-blue-900 transition-all"
              >
                {/* Property Type & Object Number */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm opacity-70">
                      {task.property.type === 'apartment' ? '🏢' :
                        task.property.type === 'house' ? '🏠' :
                          task.property.type === 'commercial' ? '🏪' : '🏗️'}
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                      {task.property.type === 'apartment' ? 'Wohnung' :
                        task.property.type === 'house' ? 'Haus' :
                          task.property.type === 'commercial' ? 'Gewerbe' : 'Grundstück'}
                    </span>
                  </div>
                  {task.property.objectNumber && (
                    <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 
                      bg-white/60 dark:bg-gray-700/60 px-1.5 py-0.5 rounded">
                      #{task.property.objectNumber}
                    </span>
                  )}
                </div>

                {/* Location */}
                {task.property.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 mb-1.5">
                    <span className="text-[10px]">📍</span>
                    <span className="font-medium truncate">{task.property.location}</span>
                  </div>
                )}

                {/* Price & Details */}
                <div className="flex items-center justify-between">
                  {task.property.price && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(task.property.price)}
                      </span>
                    </div>
                  )}
                  {(task.property.area || task.property.rooms) && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                      {task.property.area && (
                        <span className="flex items-center gap-0.5">
                          <span className="opacity-70">▢</span>
                          {task.property.area}m²
                        </span>
                      )}
                      {task.property.rooms && (
                        <span className="flex items-center gap-0.5">
                          <span className="opacity-70">🚪</span>
                          {task.property.rooms}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Client Info */}
                {task.property.clientName && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-200/30 
                    dark:border-blue-700/30 text-xs text-gray-600 dark:text-gray-400">
                    <span className="opacity-70">◉</span>
                    <span className="font-medium">{task.property.clientName}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Financing Status Badge */}
            {task.financingStatus && task.financingStatus !== 'not_required' && (
              <div className="mb-2.5">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium
                  border transition-colors
                  ${task.financingStatus === 'approved'
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'
                    : task.financingStatus === 'rejected'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900'
                      : 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900'
                  }`}>
                  <span className="text-xs">€</span>
                  <span>
                    {task.financingStatus === 'approved' ? 'Finanzierung ✓' :
                      task.financingStatus === 'rejected' ? 'Finanzierung ✗' :
                        'Finanzierung prüfen'}
                  </span>
                </div>
              </div>
            )}

            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {task.labels.slice(0, 2).map((label) => (
                  <motion.span
                    key={label.id}
                    whileHover={{ scale: 1.03 }}
                    className="px-1.5 py-0.5 text-[10px] font-medium rounded text-white"
                    style={{
                      backgroundColor: label.color
                    }}
                  >
                    {label.name}
                  </motion.span>
                ))}
                {task.labels.length > 2 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 
                    dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    +{task.labels.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {task.progress > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Fortschritt</span>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">{task.progress}%</span>
                </div>
                <div className="relative w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-blue-500 dark:bg-blue-600 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Subtasks Preview */}
            {totalSubtasks > 0 && (
              <div className="mb-2 flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-gray-800 rounded">
                <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-semibold
                  ${completedSubtasks === totalSubtasks
                    ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                    : 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                  }`}>
                  {completedSubtasks === totalSubtasks ? '✓' : completedSubtasks}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {completedSubtasks}/{totalSubtasks} Teilaufgaben
                  </div>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all"
                      style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Blocked Status */}
            {task.blocked && (
              <div className="mb-2.5 p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900">
                <div className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400 font-medium">
                  <span>🚫</span>
                  <span>Blockiert: {task.blocked.reason}</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Assignee */}
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-700"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full 
                    border border-white dark:border-gray-800" />
                </div>
                <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 
                  max-w-[80px] truncate">
                  {task.assignee.name}
                </span>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-1">
                {/* Due Date */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium
                    ${isOverdue
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                >
                  <span className="text-[9px]">{isOverdue ? '⚠' : '📅'}</span>
                  <span>
                    {new Date(task.dueDate).toLocaleDateString('de-DE', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </motion.div>

                {/* Comments */}
                {hasComments && (
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium
                      bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-[9px]">💬</span>
                    <span>{task.comments.length}</span>
                  </motion.div>
                )}

                {/* Attachments */}
                {hasAttachments && (
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium
                      bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-[9px]">📎</span>
                    <span>{task.attachments.length}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Estimated Hours Badge */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 
              rounded text-[10px] font-semibold text-gray-600 dark:text-gray-400">
              ⏱ {task.estimatedHours}h
            </div>
          </div>

          {/* Drag Handle Indicator */}
          {!snapshot.isDragging && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 
              transition-opacity pointer-events-none">
              <div className="flex flex-col gap-0.5">
                <div className="w-0.5 h-0.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                <div className="w-0.5 h-0.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                <div className="w-0.5 h-0.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

// Memoize to prevent unnecessary re-renders during drag operations
export const EnhancedTaskCard = React.memo(EnhancedTaskCardComponent, (prevProps, nextProps) => {
  // Only re-render if relevant props changed
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.index === nextProps.index &&
    prevProps.selected === nextProps.selected &&
    prevProps.bulkMode === nextProps.bulkMode
  );
});

export default EnhancedTaskCard;
