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

export const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({
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
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group relative bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-2xl 
            p-4 border transition-all duration-200 cursor-pointer
            ${snapshot.isDragging 
              ? `shadow-glass-xl scale-105 rotate-2 border-blue-400/60 bg-white/60 dark:bg-white/10 z-50 
                 ring-2 ring-blue-500/50 ${priorityConfig.glow}` 
              : selected
                ? 'border-blue-500/50 bg-blue-50/40 dark:bg-blue-900/20 shadow-glass-lg ring-2 ring-blue-500/30'
                : 'border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 hover:shadow-glass-md hover:bg-white/50 dark:hover:bg-white/8 hover:-translate-y-0.5'
            }`}
        >
          {/* Selection Checkbox - Bulk Mode */}
          {bulkMode && (
            <div 
              className="absolute top-3 left-3 z-10"
              onClick={handleCheckboxClick}
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all
                  cursor-pointer
                  ${selected 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-700 shadow-lg' 
                    : 'bg-white/40 dark:bg-white/10 border-2 border-white/30 dark:border-white/20 hover:bg-white/60 dark:hover:bg-white/15'
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

          <div className={bulkMode ? 'ml-8' : ''}>
            {/* Header: ID & Priority */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 
                bg-white/50 dark:bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm
                border border-white/20 dark:border-white/10">
                {task.id}
              </span>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-sm
                ${priorityConfig.bg} ${priorityConfig.border} border shadow-sm`}>
                <span className="text-xs">{priorityConfig.icon}</span>
                <span className={`text-xs font-semibold ${priorityConfig.text}`}>
                  {priorityConfig.label}
                </span>
              </div>
            </div>

            {/* Task Title */}
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 
              leading-snug tracking-tight">
              {task.title}
            </h4>

            {/* Task Description */}
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Property Information - PROMINENT */}
            {hasProperty && task.property && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="mb-3 p-3 bg-gradient-to-br from-blue-50/80 to-purple-50/80 
                  dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 
                  border-blue-200/50 dark:border-blue-700/30 backdrop-blur-sm shadow-sm
                  hover:shadow-md transition-all"
              >
                {/* Property Type & Object Number */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg opacity-70">
                      {task.property.type === 'apartment' ? '■' : 
                       task.property.type === 'house' ? '▢' : 
                       task.property.type === 'commercial' ? '▦' : '◈'}
                    </span>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                      {task.property.type === 'apartment' ? 'Wohnung' : 
                       task.property.type === 'house' ? 'Haus' : 
                       task.property.type === 'commercial' ? 'Gewerbe' : 'Grundstück'}
                    </span>
                  </div>
                  {task.property.objectNumber && (
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400 
                      bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded">
                      #{task.property.objectNumber}
                    </span>
                  )}
                </div>

                {/* Location */}
                {task.property.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                    <span className="text-blue-500 opacity-70">◉</span>
                    <span className="font-medium truncate">{task.property.location}</span>
                  </div>
                )}

                {/* Price & Details */}
                <div className="flex items-center justify-between">
                  {task.property.price && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 opacity-70">€</span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-sm">
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
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                      {task.property.area && (
                        <span className="flex items-center gap-1">
                          <span className="opacity-70">▢</span>
                          {task.property.area}m²
                        </span>
                      )}
                      {task.property.rooms && (
                        <span className="flex items-center gap-1">
                          <span className="opacity-70">▣</span>
                          {task.property.rooms} Zi.
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
              <div className="mb-3">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                  backdrop-blur-sm border shadow-sm transition-all
                  ${task.financingStatus === 'approved' 
                    ? 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30 hover:bg-green-500/15' 
                    : task.financingStatus === 'rejected'
                      ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30 hover:bg-red-500/15'
                      : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/15'
                  }`}>
                  <span className="text-base opacity-70">€</span>
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
              <div className="flex flex-wrap gap-1.5 mb-3">
                {task.labels.slice(0, 3).map((label) => (
                  <motion.span
                    key={label.id}
                    whileHover={{ scale: 1.05 }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white 
                      shadow-sm backdrop-blur-sm border border-white/20"
                    style={{ 
                      backgroundColor: label.color,
                      boxShadow: `0 2px 8px ${label.color}30`
                    }}
                  >
                    {label.name}
                  </motion.span>
                ))}
                {task.labels.length > 3 && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/40 
                    dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-white/20 
                    dark:border-white/10 backdrop-blur-sm">
                    +{task.labels.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {task.progress > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Fortschritt</span>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">{task.progress}%</span>
                </div>
                <div className="relative w-full h-2.5 bg-white/50 dark:bg-white/10 rounded-full 
                  overflow-hidden backdrop-blur-sm border border-white/20 dark:border-white/10 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 
                      rounded-full shadow-md relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 
                      to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              </div>
            )}

            {/* Subtasks Preview */}
            {totalSubtasks > 0 && (
              <div className="mb-3 flex items-center gap-2 p-2 bg-white/30 dark:bg-white/5 
                rounded-lg border border-white/20 dark:border-white/10">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold
                  ${completedSubtasks === totalSubtasks 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                    : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  }`}>
                  {completedSubtasks === totalSubtasks ? '✓' : completedSubtasks}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {completedSubtasks}/{totalSubtasks} Teilaufgaben
                  </div>
                  <div className="w-full h-1 bg-white/30 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                      style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Blocked Status */}
            {task.blocked && (
              <div className="mb-3 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                  <span>🚫</span>
                  <span>Blockiert: {task.blocked.reason}</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/20 dark:border-white/10">
              {/* Assignee */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="w-8 h-8 rounded-full border-2 border-white/50 dark:border-white/30 shadow-md"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full 
                    border-2 border-white dark:border-gray-900" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 
                    max-w-[100px] truncate leading-tight">
                    {task.assignee.name}
                  </span>
                  {task.assignee.role && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[100px] truncate">
                      {task.assignee.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-1.5">
                {/* Due Date */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium
                    backdrop-blur-sm border transition-all ${isOverdue 
                      ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30 shadow-red-500/10' 
                      : 'bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-white/20 dark:border-white/10'
                    }`}
                >
                  <span className="opacity-70">{isOverdue ? '⚠' : '◷'}</span>
                  <span>
                    {new Date(task.dueDate).toLocaleDateString('de-DE', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </motion.div>

                {/* Comments */}
                {hasComments && (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium
                      bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 
                      border border-white/20 dark:border-white/10 backdrop-blur-sm"
                  >
                    <span className="opacity-70">◉</span>
                    <span>{task.comments.length}</span>
                  </motion.div>
                )}

                {/* Attachments */}
                {hasAttachments && (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium
                      bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 
                      border border-white/20 dark:border-white/10 backdrop-blur-sm"
                  >
                    <span className="opacity-70">⎆</span>
                    <span>{task.attachments.length}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Estimated Hours Badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-blue-500/15 backdrop-blur-sm 
              rounded-lg border border-blue-500/30 text-xs font-bold text-blue-700 
              dark:text-blue-300 shadow-sm">
              <span className="opacity-70">◷</span> {task.estimatedHours}h
            </div>
          </div>

          {/* Drag Handle Indicator */}
          {!snapshot.isDragging && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 
              transition-opacity pointer-events-none">
              <div className="flex flex-col gap-1 p-1.5 bg-white/40 dark:bg-white/10 rounded-lg">
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              </div>
            </div>
          )}

          {/* Drag Ghost Effect */}
          {snapshot.isDragging && (
            <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 
                to-purple-500/20 pointer-events-none opacity-100 animate-pulse"
            />
          )}
        </div>
      )}
    </Draggable>
  );
};

export default EnhancedTaskCard;
