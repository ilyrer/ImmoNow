import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Task, KanbanColumn, TaskFilters, BoardStatistics } from '../../../types/kanban';
import { EnhancedTaskCard } from './EnhancedTaskCard';

/**
 * ============================================================================
 * PROFESSIONAL KANBAN BOARD
 * Enterprise-grade task management with Linear/Notion-level features
 * Features: Advanced filtering, bulk actions, keyboard shortcuts, analytics
 * ============================================================================
 */

interface ProfessionalKanbanBoardProps {
  tasks: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
  onDragEnd: (result: DropResult) => void;
  onCreateTask: (columnId: string) => void;
  onBulkUpdate?: (taskIds: string[], updates: Partial<Task>) => void;
}

// Main board columns (visible on the board)
const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    color: '#6B7280',
    icon: '○',
    description: 'Geplant',
    order: 0
  },
  {
    id: 'todo',
    title: 'Zu erledigen',
    color: '#8E8E93',
    icon: '◐',
    description: 'Bereit',
    limit: 8,
    order: 1
  },
  {
    id: 'inProgress',
    title: 'In Arbeit',
    color: '#0A84FF',
    icon: '◉',
    description: 'Aktiv',
    limit: 5,
    order: 2
  },
  {
    id: 'review',
    title: 'Überprüfung',
    color: '#FF9F0A',
    icon: '◎',
    description: 'Freigabe',
    limit: 3,
    order: 3
  },
  {
    id: 'done',
    title: 'Abgeschlossen',
    color: '#32D74B',
    icon: '●',
    description: 'Erledigt',
    order: 4
  }
];

// All available statuses (for dropdown in task detail)
export const ALL_STATUSES: KanbanColumn[] = [
  ...DEFAULT_COLUMNS,
  {
    id: 'blocked',
    title: 'Blockiert',
    color: '#FF453A',
    icon: '⊘',
    description: 'Problem',
    order: 5
  },
  {
    id: 'onHold',
    title: 'Pausiert',
    color: '#AC8E68',
    icon: '‖',
    description: 'Warten',
    order: 6
  },
  {
    id: 'cancelled',
    title: 'Abgebrochen',
    color: '#8E8E93',
    icon: '✕',
    description: 'Storniert',
    order: 7
  }
];

// Map non-board statuses to visible columns
const STATUS_COLUMN_MAPPING: Record<string, string> = {
  'blocked': 'todo',      // Blocked tasks show in Todo
  'onHold': 'backlog',    // On-hold tasks show in Backlog
  'cancelled': 'done'     // Cancelled tasks show in Done
};

const KEYBOARD_SHORTCUTS = [
  { key: 'N', description: 'Neue Aufgabe' },
  { key: 'F', description: 'Filter öffnen' },
  { key: '/', description: 'Suche fokussieren' },
  { key: 'Esc', description: 'Schließen' },
  { key: '←/→', description: 'Spalte wechseln' },
  { key: 'Shift+Click', description: 'Mehrfachauswahl' },
  { key: 'Ctrl+A', description: 'Alle auswählen' }
];

export const ProfessionalKanbanBoard: React.FC<ProfessionalKanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onDragEnd,
  onCreateTask,
  onBulkUpdate
}) => {
  // State
  const [filters, setFilters] = useState<TaskFilters>({});
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeColumn, setActiveColumn] = useState<string>('');

  // Statistics
  const statistics: BoardStatistics = useMemo(() => {
    const allTasks = Object.values(tasks).flat();
    const activeTasks = allTasks.filter(t => t.status !== 'done' && !t.archived);
    const completedTasks = allTasks.filter(t => t.status === 'done');
    const blockedTasks = allTasks.filter(t => t.blocked || t.status === 'blocked');
    const now = new Date();
    const overdueTasks = activeTasks.filter(t => new Date(t.dueDate) < now);

    const totalEstimatedHours = allTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const totalActualHours = allTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    
    const completionRate = allTasks.length > 0 
      ? (completedTasks.length / allTasks.length) * 100 
      : 0;

    const tasksByPriority = allTasks.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<Task['priority'], number>);

    const tasksByStatus = allTasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<Task['status'], number>);

    const tasksByAssignee = allTasks.reduce((acc, t) => {
      acc[t.assignee.id] = (acc[t.assignee.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const upcomingDeadlines = activeTasks
      .filter(t => {
        const dueDate = new Date(t.dueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 7;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    const recentActivity = allTasks
      .flatMap(t => t.activityLog)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totalTasks: allTasks.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      blockedTasks: blockedTasks.length,
      overdueTasks: overdueTasks.length,
      totalEstimatedHours,
      totalActualHours,
      completionRate,
      averageCompletionTime: 0, // Calculate based on actual data
      tasksByPriority,
      tasksByStatus,
      tasksByAssignee,
      upcomingDeadlines,
      recentActivity
    };
  }, [tasks]);

  // Filtered tasks with status mapping for non-board statuses
  const filteredTasks = useMemo(() => {
    const result: Record<string, Task[]> = {};
    
    // Initialize all board columns
    DEFAULT_COLUMNS.forEach(col => {
      result[col.id] = [];
    });
    
    // Distribute tasks to appropriate columns
    Object.keys(tasks).forEach(columnId => {
      tasks[columnId].forEach(task => {
        // Determine which column this task should appear in
        let targetColumn = task.status;
        if (STATUS_COLUMN_MAPPING[task.status]) {
          targetColumn = STATUS_COLUMN_MAPPING[task.status] as Task['status'];
        }
        
        // Only show if column exists on board
        if (!result[targetColumn]) {
          return;
        }
        
        // Apply filters
        let shouldShow = true;
        
        // Search filter
        if (filters.search && shouldShow) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch = 
            task.title.toLowerCase().includes(searchLower) ||
            task.description.toLowerCase().includes(searchLower) ||
            task.id.toLowerCase().includes(searchLower) ||
            task.property?.location?.toLowerCase().includes(searchLower) ||
            task.tags.some(tag => tag.toLowerCase().includes(searchLower));
          shouldShow = matchesSearch;
        }

        // Priority filter
        if (filters.priorities && filters.priorities.length > 0 && shouldShow) {
          shouldShow = filters.priorities.includes(task.priority);
        }

        // Status filter
        if (filters.statuses && filters.statuses.length > 0 && shouldShow) {
          shouldShow = filters.statuses.includes(task.status);
        }

        // Assignee filter
        if (filters.assignees && filters.assignees.length > 0 && shouldShow) {
          shouldShow = filters.assignees.includes(task.assignee.id);
        }

        // Date range filter
        if (filters.dateRange && shouldShow) {
          const dueDate = new Date(task.dueDate);
          const start = new Date(filters.dateRange.start);
          const end = new Date(filters.dateRange.end);
          shouldShow = dueDate >= start && dueDate <= end;
        }

        // Overdue filter
        if (filters.overdueOnly && shouldShow) {
          const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
          shouldShow = isOverdue;
        }

        // Blocked filter
        if (filters.blockedOnly && shouldShow) {
          shouldShow = !!task.blocked || task.status === 'blocked';
        }

        // Has attachments filter
        if (filters.hasAttachments && shouldShow) {
          shouldShow = task.attachments.length > 0;
        }

        // Has comments filter
        if (filters.hasComments && shouldShow) {
          shouldShow = task.comments.length > 0;
        }

        if (shouldShow) {
          result[targetColumn].push(task);
        }
      });
    });

    return result;
  }, [tasks, filters]);

  // Unique assignees
  const allAssignees = useMemo(() => {
    const assigneeMap = new Map();
    Object.values(tasks).flat().forEach(task => {
      if (!assigneeMap.has(task.assignee.id)) {
        assigneeMap.set(task.assignee.id, task.assignee);
      }
    });
    return Array.from(assigneeMap.values());
  }, [tasks]);

  // Keyboard shortcuts
  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault();
        onCreateTask('todo');
        break;
      case 'f':
        e.preventDefault();
        setShowFilters(prev => !prev);
        break;
      case '/':
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="durchsuchen"]')?.focus();
        break;
      case '?':
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        break;
      case 'escape':
        e.preventDefault();
        setShowFilters(false);
        setShowShortcuts(false);
        setBulkMode(false);
        setSelectedTasks(new Set());
        break;
    }

    // Ctrl+A for select all
    if (e.ctrlKey && e.key === 'a' && bulkMode) {
      e.preventDefault();
      const allTaskIds = Object.values(filteredTasks).flat().map(t => t.id);
      setSelectedTasks(new Set(allTaskIds));
    }
  }, [onCreateTask, bulkMode, filteredTasks]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  // Task selection handlers
  const handleTaskSelect = useCallback((taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    const allTaskIds = Object.values(filteredTasks).flat().map(t => t.id);
    setSelectedTasks(new Set(allTaskIds));
  }, [filteredTasks]);

  const clearSelection = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);

  const toggleBulkMode = useCallback(() => {
    setBulkMode(prev => !prev);
    if (bulkMode) {
      setSelectedTasks(new Set());
    }
  }, [bulkMode]);

  // Bulk actions
  const handleBulkAction = useCallback((action: string, value?: any) => {
    if (selectedTasks.size === 0) return;

    const updates: Partial<Task> = {};
    switch (action) {
      case 'status':
        updates.status = value;
        break;
      case 'priority':
        updates.priority = value;
        break;
      case 'assignee':
        updates.assignee = value;
        break;
    }

    onBulkUpdate?.(Array.from(selectedTasks), updates);
    setSelectedTasks(new Set());
  }, [selectedTasks, onBulkUpdate]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50/50 via-purple-50/50 
      to-pink-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 relative overflow-hidden">
      
      {/* Glassmorphism Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-400 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <div className="relative z-20 bg-white/30 dark:bg-white/5 backdrop-blur-3xl border-b 
        border-white/20 dark:border-white/10 px-6 py-5">
        
        {/* Title & Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 
                rounded-2xl flex items-center justify-center shadow-glass-lg">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 
                  to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 
                  bg-clip-text text-transparent">
                  Professional Task Board
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Enterprise Task Management System
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <StatBadge icon="◉" value={statistics.activeTasks} label="Aktiv" color="blue" />
              <StatBadge icon="●" value={statistics.completedTasks} label="Erledigt" color="green" />
              {statistics.overdueTasks > 0 && (
                <StatBadge icon="⚠" value={statistics.overdueTasks} label="Überfällig" color="red" />
              )}
              {statistics.blockedTasks > 0 && (
                <StatBadge icon="⊘" value={statistics.blockedTasks} label="Blockiert" color="orange" />
              )}
              <StatBadge 
                icon="▢" 
                value={`${Math.round(statistics.completionRate)}%`} 
                label="Fertigstellung" 
                color="purple" 
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShortcuts(true)}
              className="px-4 py-2.5 bg-white/40 dark:bg-white/10 hover:bg-white/60 
                dark:hover:bg-white/15 rounded-xl text-sm font-medium text-gray-700 
                dark:text-gray-300 transition-all backdrop-blur-2xl border 
                border-white/20 dark:border-white/10"
              title="Tastenkürzel (Taste ?)"
            >
              ▤ Shortcuts
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleBulkMode}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 
                backdrop-blur-2xl border ${bulkMode
                  ? 'bg-purple-500/80 text-white border-purple-600/50 shadow-glass-lg'
                  : 'bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/15'
                }`}
            >
              {bulkMode ? '✕ Beenden' : '☑ Mehrfach'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCreateTask('todo')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 
                hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold 
                text-sm transition-all duration-200 shadow-glass-lg hover:shadow-glass-xl 
                hover:scale-105 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Neue Aufgabe
              <span className="text-xs opacity-75 ml-1">(N)</span>
            </motion.button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">◉</span>
            <input
              type="text"
              placeholder="Aufgaben durchsuchen... (Taste /)"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-12 pr-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                border border-white/20 dark:border-white/10 rounded-xl text-sm 
                text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 shadow-glass-sm 
                transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all 
              backdrop-blur-2xl border flex items-center gap-2 ${showFilters
                ? 'bg-blue-500/80 text-white border-blue-600/50 shadow-glass-lg'
                : 'bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/15'
              }`}
          >
            <span>⊛</span>
            Filter
            <span className="text-xs opacity-75">(F)</span>
            {Object.values(filters).filter(Boolean).length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-xs">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </motion.button>

          <QuickFilterBar filters={filters} setFilters={setFilters} assignees={allAssignees} />
        </div>

        {/* Advanced Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <AdvancedFilterPanel
              filters={filters}
              setFilters={setFilters}
              assignees={allAssignees}
              onClose={() => setShowFilters(false)}
            />
          )}
        </AnimatePresence>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedTasks.size > 0 && (
            <BulkActionsBar
              selectedCount={selectedTasks.size}
              onSelectAll={selectAllVisible}
              onClearSelection={clearSelection}
              onAction={handleBulkAction}
              assignees={allAssignees}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Kanban Board - Responsive columns without horizontal scroll */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full flex gap-4 p-6">
            {DEFAULT_COLUMNS.map((column, index) => {
              const columnTasks = filteredTasks[column.id] || [];
              const isOverLimit = !!(column.limit && columnTasks.length > column.limit);
              const completionPercentage = column.id === 'done' && statistics.totalTasks > 0
                ? (columnTasks.length / statistics.totalTasks) * 100
                : 0;

              return (
                <motion.div
                  key={column.id}
                  layout
                  className="flex flex-col flex-1 min-w-[250px] max-w-[400px]"
                >
                  {/* Column Header */}
                  <ColumnHeader
                    column={column}
                    taskCount={columnTasks.length}
                    isOverLimit={isOverLimit}
                    completionPercentage={completionPercentage}
                    onAddTask={() => onCreateTask(column.id)}
                  />

                  {/* Column Content */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 bg-white/20 dark:bg-white/5 backdrop-blur-xl 
                          rounded-b-2xl border border-white/20 dark:border-white/10 border-t-0 
                          p-4 space-y-3 min-h-[500px] max-h-[calc(100vh-400px)] overflow-y-auto 
                          transition-all duration-200 custom-scrollbar ${snapshot.isDraggingOver 
                            ? 'bg-blue-500/10 ring-2 ring-blue-400/50 ring-inset scale-105' 
                            : ''
                          }`}
                      >
                        <AnimatePresence>
                          {columnTasks.map((task, index) => (
                            <EnhancedTaskCard
                              key={task.id}
                              task={task}
                              index={index}
                              onClick={() => onTaskClick(task)}
                              selected={selectedTasks.has(task.id)}
                              onSelect={handleTaskSelect}
                              bulkMode={bulkMode}
                            />
                          ))}
                        </AnimatePresence>
                        {provided.placeholder}

                        {/* Empty State */}
                        {columnTasks.length === 0 && (
                          <EmptyColumnState column={column} onAddTask={() => onCreateTask(column.id)} />
                        )}
                      </div>
                    )}
                  </Droppable>
                </motion.div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StatBadge: React.FC<{
  icon: string;
  value: number | string;
  label: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple';
}> = ({ icon, value, label, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`px-4 py-2 backdrop-blur-2xl rounded-xl border shadow-glass-sm 
        ${colorClasses[color]} transition-all cursor-default`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-bold">{value}</span>
        <span className="text-xs opacity-80">{label}</span>
      </div>
    </motion.div>
  );
};

const ColumnHeader: React.FC<{
  column: KanbanColumn;
  taskCount: number;
  isOverLimit: boolean;
  completionPercentage: number;
  onAddTask: () => void;
}> = ({ column, taskCount, isOverLimit, completionPercentage, onAddTask }) => (
  <div className="bg-white/40 dark:bg-white/10 backdrop-blur-2xl rounded-t-2xl 
    border border-white/20 dark:border-white/10 border-b-0 p-4 shadow-glass">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shadow-glass-sm 
            transition-transform hover:scale-110"
          style={{ backgroundColor: `${column.color}20` }}
        >
          <span className="text-2xl">{column.icon}</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
            {column.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">{column.description}</p>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={onAddTask}
        className="p-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/15 
          rounded-lg transition-all"
        title="Task hinzufügen"
      >
        <span className="text-gray-700 dark:text-gray-300 font-bold text-lg">+</span>
      </motion.button>
    </div>
    
    <div className="flex items-center justify-between mb-2">
      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
        isOverLimit 
          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse' 
          : 'bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-white/20 dark:border-white/10'
      }`}>
        {taskCount}{column.limit ? `/${column.limit}` : ''}
      </span>
      {isOverLimit && (
        <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
          WIP Limit erreicht!
        </span>
      )}
    </div>

    {/* Progress bar for done column */}
    {column.id === 'done' && completionPercentage > 0 && (
      <div className="mt-2">
        <div className="w-full h-2 bg-white/30 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-green-400 to-green-600"
          />
        </div>
      </div>
    )}
  </div>
);

const EmptyColumnState: React.FC<{
  column: KanbanColumn;
  onAddTask: () => void;
}> = ({ column, onAddTask }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="text-7xl mb-4 opacity-30">{column.icon}</div>
    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
      Keine Aufgaben
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-500 mb-5">
      Ziehe Tasks hierher oder erstelle neue
    </p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onAddTask}
      className="px-5 py-2.5 bg-white/40 dark:bg-white/10 hover:bg-white/60 
        dark:hover:bg-white/15 rounded-xl text-sm font-semibold text-gray-700 
        dark:text-gray-300 transition-all backdrop-blur-sm border 
        border-white/20 dark:border-white/10 shadow-glass-sm"
    >
      + Aufgabe erstellen
    </motion.button>
  </motion.div>
);

// Quick Filter Bar Component (continued in next message due to length limit)
interface QuickFilterBarProps {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  assignees: any[];
}

const QuickFilterBar: React.FC<QuickFilterBarProps> = ({ filters, setFilters, assignees }) => (
  <div className="flex items-center gap-2">
    <select
      value={filters.priorities?.[0] || 'all'}
      onChange={(e) => {
        const value = e.target.value;
        setFilters({
          ...filters,
          priorities: value === 'all' ? undefined : [value as Task['priority']]
        });
      }}
      className="px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl border 
        border-white/20 dark:border-white/10 rounded-xl text-sm font-medium 
        text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 
        shadow-glass-sm transition-all"
    >
      <option value="all">◈ Alle Prioritäten</option>
      <option value="critical">▲▲ Kritisch</option>
      <option value="high">▲ Hoch</option>
      <option value="medium">▬ Mittel</option>
      <option value="low">▼ Niedrig</option>
    </select>

    <select
      value={filters.assignees?.[0] || 'all'}
      onChange={(e) => {
        const value = e.target.value;
        setFilters({
          ...filters,
          assignees: value === 'all' ? undefined : [value]
        });
      }}
      className="px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl border 
        border-white/20 dark:border-white/10 rounded-xl text-sm font-medium 
        text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 
        shadow-glass-sm transition-all"
    >
      <option value="all">👥 Alle Mitarbeiter</option>
      {assignees.map(assignee => (
        <option key={assignee.id} value={assignee.id}>
          {assignee.name}
        </option>
      ))}
    </select>
  </div>
);

// Advanced Filter Panel (simplified, would expand in production)
const AdvancedFilterPanel: React.FC<{
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  assignees: any[];
  onClose: () => void;
}> = ({ filters, setFilters, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, height: 0 }}
    animate={{ opacity: 1, y: 0, height: 'auto' }}
    exit={{ opacity: 0, y: -20, height: 0 }}
    className="mt-4 p-6 bg-white/60 dark:bg-white/15 backdrop-blur-3xl rounded-2xl 
      border border-white/20 dark:border-white/10 shadow-glass-lg overflow-hidden"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Erweiterte Filter</h3>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.overdueOnly || false}
          onChange={(e) => setFilters({ ...filters, overdueOnly: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Nur überfällige</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.blockedOnly || false}
          onChange={(e) => setFilters({ ...filters, blockedOnly: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Nur blockierte</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.hasAttachments || false}
          onChange={(e) => setFilters({ ...filters, hasAttachments: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Mit Anhängen</span>
      </label>
    </div>
  </motion.div>
);

// Bulk Actions Bar
const BulkActionsBar: React.FC<{
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onAction: (action: string, value?: any) => void;
  assignees: any[];
}> = ({ selectedCount, onSelectAll, onClearSelection, onAction, assignees }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-2xl 
      rounded-xl border border-blue-500/30 shadow-glass-lg"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center 
          justify-center font-bold text-lg text-blue-600 dark:text-blue-400">
          {selectedCount}
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">
          {selectedCount} Aufgabe{selectedCount !== 1 ? 'n' : ''} ausgewählt
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSelectAll}
          className="px-4 py-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 
            dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-lg 
            text-sm font-medium transition-all"
        >
          Alle auswählen
        </button>
        <select
          onChange={(e) => onAction('status', e.target.value)}
          className="px-4 py-2 bg-white/40 dark:bg-white/10 rounded-lg text-sm 
            font-medium text-gray-700 dark:text-gray-300 border-0"
        >
          <option value="">Status ändern...</option>
          <option value="todo">◐ Zu erledigen</option>
          <option value="inProgress">◉ In Arbeit</option>
          <option value="review">◎ Überprüfung</option>
          <option value="done">● Abgeschlossen</option>
        </select>
        <button
          onClick={onClearSelection}
          className="px-4 py-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 
            dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-lg 
            text-sm font-medium transition-all"
        >
          Auswahl löschen
        </button>
      </div>
    </div>
  </motion.div>
);

// Keyboard Shortcuts Modal
const KeyboardShortcutsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
        >
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl rounded-3xl 
            border border-white/20 dark:border-white/10 shadow-glass-xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ⌨️ Tastenkürzel
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl 
                  bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/15"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/40 
                    dark:bg-white/10 rounded-xl"
                >
                  <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                  <kbd className="px-3 py-1.5 bg-gray-700 dark:bg-gray-600 text-white 
                    rounded-lg font-mono text-sm font-semibold">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default ProfessionalKanbanBoard;
