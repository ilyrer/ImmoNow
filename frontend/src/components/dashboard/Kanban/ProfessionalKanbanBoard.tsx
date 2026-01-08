import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  columns?: KanbanColumn[];
  onTaskClick: (task: Task) => void;
  onDragEnd: (result: DropResult) => void;
  onCreateTask: (columnId: string) => void;
  onAiCreateTask?: (columnId: string) => void;
  onSummarizeBoard?: () => void;
  onBulkUpdate?: (taskIds: string[], updates: Partial<Task>) => void;
}

// TODO(next-level): Spalten sind aktuell statisch. Für Multi-Board/Workflow sollen
// Status dynamisch vom Backend/Board-Config kommen (inkl. WIP/Transitions/RBAC).
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
    id: 'in_progress',
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
    id: 'on_hold',
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
  'on_hold': 'backlog',   // On-hold tasks show in Backlog
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
  columns,
  onTaskClick,
  onDragEnd,
  onCreateTask,
  onAiCreateTask,
  onSummarizeBoard,
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
  const [showFeatureMenu, setShowFeatureMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const boardColumns = columns && columns.length ? columns : DEFAULT_COLUMNS;

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowFeatureMenu(false);
      }
    };

    if (showFeatureMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFeatureMenu]);

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
    boardColumns.forEach(col => {
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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 relative overflow-hidden">

      {/* Header */}
      <div className="relative z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">

        {/* Title & Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-gray-900 font-semibold text-sm">
                PT
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Task Board
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                  Aufgabenverwaltung
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <StatBadge value={statistics.activeTasks} label="Aktiv" color="blue" />
              <StatBadge value={statistics.completedTasks} label="Erledigt" color="green" />
              {statistics.overdueTasks > 0 && (
                <StatBadge value={statistics.overdueTasks} label="Überfällig" color="red" />
              )}
              <StatBadge
                value={`${Math.round(statistics.completionRate)}%`}
                label="Fertig"
                color="gray"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Feature Menu */}
            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFeatureMenu(!showFeatureMenu)}
                className="px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 
                  dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 
                  dark:text-gray-300 transition-colors border border-gray-200 
                  dark:border-gray-700 flex items-center gap-2"
              >
                <span className="text-base">☰</span>
                <span>Menü</span>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showFeatureMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 
                      rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                  >
                    {onSummarizeBoard && (
                      <button
                        onClick={() => {
                          onSummarizeBoard();
                          setShowFeatureMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 
                          dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                          transition-colors flex items-center gap-2.5"
                      >
                        <span className="text-base">🤖</span>
                        <span>KI-Zusammenfassung</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowShortcuts(true);
                        setShowFeatureMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 
                        dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                        transition-colors flex items-center gap-2.5"
                    >
                      <span className="text-base">⌨️</span>
                      <span>Tastenkürzel</span>
                    </button>
                    <button
                      onClick={() => {
                        toggleBulkMode();
                        setShowFeatureMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 
                        dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                        transition-colors flex items-center gap-2.5"
                    >
                      <span className="text-base">{bulkMode ? '✕' : '☑'}</span>
                      <span>{bulkMode ? 'Mehrfach beenden' : 'Mehrfach-Auswahl'}</span>
                    </button>
                    {onAiCreateTask && (
                      <button
                        onClick={() => {
                          onAiCreateTask('todo');
                          setShowFeatureMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 
                          dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                          transition-colors flex items-center gap-2.5"
                      >
                        <span className="text-base">✨</span>
                        <span>KI-Task erstellen</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Primary Action */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCreateTask('todo')}
              className="px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 
                dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg 
                font-medium text-sm transition-colors flex items-center gap-2"
            >
              <span className="text-base">+</span>
              <span>Neue Aufgabe</span>
            </motion.button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Aufgaben durchsuchen... (Taste /)"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700 rounded-lg text-sm 
                text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
                focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent 
                transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors 
              border flex items-center gap-2 ${showFilters
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <span className="text-sm">⊛</span>
            <span>Filter</span>
            <span className="text-xs opacity-60">(F)</span>
            {Object.values(filters).filter(Boolean).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-xs font-medium">
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

      {/* Kanban Board - Responsive columns, no horizontal scroll */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext
          onDragEnd={onDragEnd}
          onDragStart={() => {
            // Haptic feedback (if supported)
            if (window.navigator.vibrate) {
              window.navigator.vibrate(10);
            }
          }}
        >
          <div className="h-full w-full flex gap-3 px-4 py-4">
            {boardColumns.map((column, index) => {
              const columnTasks = filteredTasks[column.id] || [];
              const isOverLimit = !!(column.limit && columnTasks.length > column.limit);
              const completionPercentage = column.id === 'done' && statistics.totalTasks > 0
                ? (columnTasks.length / statistics.totalTasks) * 100
                : 0;

              return (
                <motion.div
                  key={column.id}
                  layout
                  className="flex flex-col flex-1 min-w-0"
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
                  <Droppable droppableId={column.id} type="TASK">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 bg-gray-100/50 dark:bg-gray-900/50 
                          rounded-b-lg border border-gray-200 dark:border-gray-800 border-t-0 
                          p-3 space-y-2.5 min-h-[500px] max-h-[calc(100vh-400px)] overflow-y-auto 
                          transition-colors duration-150 custom-scrollbar ${snapshot.isDraggingOver
                            ? 'bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-300 dark:ring-blue-700'
                            : ''
                          }`}
                        style={{
                          minHeight: '500px',
                          transition: 'background-color 0.15s ease'
                        }}
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
  value: number | string;
  label: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
}> = ({ value, label, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
    gray: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-sm font-semibold ${colorClasses[color]}`}>{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">{label}</span>
    </div>
  );
};

const ColumnHeader: React.FC<{
  column: KanbanColumn;
  taskCount: number;
  isOverLimit: boolean;
  completionPercentage: number;
  onAddTask: () => void;
}> = ({ column, taskCount, isOverLimit, completionPercentage, onAddTask }) => (
  <div className="bg-white dark:bg-gray-900 rounded-t-lg border border-gray-200 dark:border-gray-800 border-b-0 p-3 sticky top-0 z-10">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2.5">
        <div
          className="w-1.5 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: column.color }}
        />
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {column.title}
          </h3>
          {column.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{column.description}</p>
          )}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAddTask}
        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 
          dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        title="Task hinzufügen"
      >
        <span className="text-base font-medium">+</span>
      </motion.button>
    </div>

    <div className="flex items-center justify-between">
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${isOverLimit
        ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
        {taskCount}{column.limit ? `/${column.limit}` : ''}
      </span>
      {isOverLimit && (
        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
          Limit erreicht
        </span>
      )}
    </div>

    {/* Progress bar for done column */}
    {column.id === 'done' && completionPercentage > 0 && (
      <div className="mt-2">
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-green-500 dark:bg-green-600"
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
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
      <span className="text-2xl opacity-40">{column.icon}</span>
    </div>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
      Keine Aufgaben
    </p>
    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
      Ziehe Tasks hierher oder erstelle neue
    </p>
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onAddTask}
      className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 
        dark:hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-700 
        dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700"
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
      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 
        dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 
        dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white 
        focus:border-transparent transition-all"
    >
      <option value="all">Alle Prioritäten</option>
      <option value="critical">Kritisch</option>
      <option value="high">Hoch</option>
      <option value="medium">Mittel</option>
      <option value="low">Niedrig</option>
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
      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 
        dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 
        dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white 
        focus:border-transparent transition-all"
    >
      <option value="all">Alle Mitarbeiter</option>
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
    initial={{ opacity: 0, y: -8, height: 0 }}
    animate={{ opacity: 1, y: 0, height: 'auto' }}
    exit={{ opacity: 0, y: -8, height: 0 }}
    className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg 
      border border-gray-200 dark:border-gray-700 overflow-hidden"
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Erweiterte Filter</h3>
      <button 
        onClick={onClose} 
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        ✕
      </button>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.overdueOnly || false}
          onChange={(e) => setFilters({ ...filters, overdueOnly: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-gray-900 dark:focus:ring-white"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Nur überfällige</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.blockedOnly || false}
          onChange={(e) => setFilters({ ...filters, blockedOnly: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-gray-900 dark:focus:ring-white"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Nur blockierte</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.hasAttachments || false}
          onChange={(e) => setFilters({ ...filters, hasAttachments: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-gray-900 dark:focus:ring-white"
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
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 
      rounded-lg border border-blue-200 dark:border-blue-900"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center 
          justify-center font-semibold text-sm text-white">
          {selectedCount}
        </div>
        <span className="font-medium text-gray-900 dark:text-white text-sm">
          {selectedCount} Aufgabe{selectedCount !== 1 ? 'n' : ''} ausgewählt
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSelectAll}
          className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 
            dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
            text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700"
        >
          Alle auswählen
        </button>
        <select
          onChange={(e) => onAction('status', e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-sm 
            font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 
            focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
        >
          <option value="">Status ändern...</option>
          <option value="todo">Zu erledigen</option>
          <option value="in_progress">In Arbeit</option>
          <option value="review">Überprüfung</option>
          <option value="done">Abgeschlossen</option>
        </select>
        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 
            dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg 
            text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700"
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
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg 
            border border-gray-200 dark:border-gray-700 shadow-xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tastenkürzel
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg 
                  hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 
                  dark:hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 
                    dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white 
                    rounded font-mono text-xs font-medium">
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
