import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
  };
  dueDate: string;
  status: 'backlog' | 'todo' | 'inProgress' | 'review' | 'done' | 'blocked';
  progress: number;
  tags: string[];
  estimatedHours: number;
  actualHours?: number;
  propertyType?: 'apartment' | 'house' | 'commercial' | 'land';
  propertyId?: string;
  clientId?: string;
  location?: string;
  price?: number;
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
  attachments: any[];
  comments: any[];
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
  financingStatus?: 'pending' | 'approved' | 'rejected';
  linkedDocuments?: string[];
}

interface Column {
  id: string;
  title: string;
  color: string;
  icon: string;
  description: string;
  limit?: number;
}

interface PremiumKanbanBoardProps {
  tasks: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
  onDragEnd: (result: DropResult) => void;
  onCreateTask: (columnId: string) => void;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

// ============================================================================
// PRIORITY HELPERS
// ============================================================================

const getPriorityConfig = (priority: Task['priority']) => {
  const configs = {
    critical: {
      icon: '🔴',
      color: '#FF453A',
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      border: 'border-red-500/30',
      label: 'Kritisch'
    },
    high: {
      icon: '🟠',
      color: '#FF9F0A',
      bg: 'bg-orange-500/10',
      text: 'text-orange-500',
      border: 'border-orange-500/30',
      label: 'Hoch'
    },
    medium: {
      icon: '🟡',
      color: '#FFD60A',
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-500/30',
      label: 'Mittel'
    },
    low: {
      icon: '🟢',
      color: '#32D74B',
      bg: 'bg-green-500/10',
      text: 'text-green-500',
      border: 'border-green-500/30',
      label: 'Niedrig'
    }
  };
  return configs[priority] || configs.medium;
};

// ============================================================================
// TASK CARD COMPONENT
// ============================================================================

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  bulkMode?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index, 
  onClick, 
  selected = false, 
  onSelect,
  bulkMode = false 
}) => {
  const priorityConfig = getPriorityConfig(task.priority);
  const isOverdue = new Date(task.dueDate) < new Date();
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group relative bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-2xl p-4 
            border transition-all duration-200 cursor-pointer
            ${snapshot.isDragging 
              ? 'shadow-glass-xl scale-105 rotate-2 border-blue-400/60 bg-white/60 dark:bg-white/10 z-50' 
              : selected
                ? 'border-blue-500/50 bg-blue-50/40 dark:bg-blue-900/20 shadow-glass-lg ring-2 ring-blue-500/30'
                : 'border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 hover:shadow-glass-md hover:bg-white/50 dark:hover:bg-white/8'
            }`}
          onClick={onClick}
        >
          {/* Selection Checkbox */}
          {bulkMode && (
            <div 
              className="absolute top-3 left-3 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all
                ${selected 
                  ? 'bg-blue-500 border-2 border-blue-600' 
                  : 'bg-white/40 dark:bg-white/10 border-2 border-white/30 dark:border-white/20'
                }`}
              >
                {selected && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
          )}

          <div className={bulkMode ? 'ml-8' : ''}>
            {/* Task ID & Priority */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 
                bg-white/50 dark:bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                {task.id}
              </span>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-sm
                ${priorityConfig.bg} ${priorityConfig.border} border`}>
                <span className="text-xs">{priorityConfig.icon}</span>
                <span className={`text-xs font-semibold ${priorityConfig.text}`}>
                  {priorityConfig.label}
                </span>
              </div>
            </div>

            {/* Task Title */}
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug">
              {task.title}
            </h4>

            {/* Task Description */}
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Property Info */}
            {(task.location || task.price) && (
              <div className="mb-3 p-2.5 bg-gradient-to-br from-blue-50/50 to-purple-50/50 
                dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl border border-white/30 
                dark:border-white/10 backdrop-blur-sm">
                {task.location && (
                  <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 mb-1.5">
                    <span className="text-blue-500">📍</span>
                    <span className="font-medium">{task.location}</span>
                  </div>
                )}
                {task.price && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-500">💶</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                      }).format(task.price)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {task.labels.slice(0, 2).map((label) => (
                  <span
                    key={label.id}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white shadow-sm backdrop-blur-sm"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
                {task.labels.length > 2 && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/40 
                    dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-white/20 
                    dark:border-white/10 backdrop-blur-sm">
                    +{task.labels.length - 2}
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
                <div className="w-full h-2 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden 
                  backdrop-blur-sm border border-white/20 dark:border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Financing Status Badge */}
            {task.financingStatus && (
              <div className="mb-3">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                  ${task.financingStatus === 'approved' 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30' 
                    : task.financingStatus === 'rejected'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                      : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'
                  }`}>
                  <span>💰</span>
                  <span>
                    {task.financingStatus === 'approved' ? 'Finanzierung OK' :
                     task.financingStatus === 'rejected' ? 'Finanzierung abgelehnt' :
                     'Finanzierung prüfen'}
                  </span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/20 dark:border-white/10">
              {/* Assignee */}
              <div className="flex items-center gap-2">
                <img
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                  className="w-7 h-7 rounded-full border-2 border-white/50 dark:border-white/30 shadow-sm"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                  {task.assignee.name}
                </span>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-2">
                {/* Due Date */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                  backdrop-blur-sm ${isOverdue 
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30' 
                    : 'bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-white/20 dark:border-white/10'
                  }`}>
                  <span>{isOverdue ? '⏰' : '📅'}</span>
                  <span>
                    {new Date(task.dueDate).toLocaleDateString('de-DE', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>

                {/* Comments */}
                {task.comments.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                    bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 
                    border border-white/20 dark:border-white/10 backdrop-blur-sm">
                    <span>💬</span>
                    <span>{task.comments.length}</span>
                  </div>
                )}

                {/* Attachments */}
                {task.attachments.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                    bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 
                    border border-white/20 dark:border-white/10 backdrop-blur-sm">
                    <span>📎</span>
                    <span>{task.attachments.length}</span>
                  </div>
                )}

                {/* Subtasks */}
                {task.subtasks.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                    bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 
                    border border-white/20 dark:border-white/10 backdrop-blur-sm">
                    <span>✓</span>
                    <span>{completedSubtasks}/{task.subtasks.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Estimated Hours Badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-blue-500/10 backdrop-blur-sm 
              rounded-lg border border-blue-500/30 text-xs font-bold text-blue-600 dark:text-blue-400">
              {task.estimatedHours}h
            </div>
          </div>

          {/* Drag Handle Indicator */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 
            transition-opacity pointer-events-none">
            <div className="flex flex-col gap-1">
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

// ============================================================================
// MAIN KANBAN BOARD COMPONENT
// ============================================================================

const PremiumKanbanBoard: React.FC<PremiumKanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onDragEnd,
  onCreateTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, boolean>>({});

  // Column Configuration
  const columns: Column[] = [
    {
      id: 'todo',
      title: 'Zu erledigen',
      color: '#8E8E93',
      icon: '📋',
      description: 'Geplante Aufgaben',
      limit: 8
    },
    {
      id: 'inProgress',
      title: 'In Arbeit',
      color: '#0A84FF',
      icon: '⚡',
      description: 'Aktiv bearbeitet',
      limit: 5
    },
    {
      id: 'review',
      title: 'Überprüfung',
      color: '#FF9F0A',
      icon: '👁️',
      description: 'Zur Freigabe',
      limit: 3
    },
    {
      id: 'done',
      title: 'Abgeschlossen',
      color: '#32D74B',
      icon: '✅',
      description: 'Erfolgreich erledigt'
    }
  ];

  // Get unique assignees
  const allAssignees = useMemo(() => {
    const assigneeMap = new Map();
    Object.values(tasks).flat().forEach(task => {
      if (!assigneeMap.has(task.assignee.id)) {
        assigneeMap.set(task.assignee.id, task.assignee);
      }
    });
    return Array.from(assigneeMap.values());
  }, [tasks]);

  // Filter tasks
  const getFilteredTasks = useCallback((columnTasks: Task[]) => {
    return columnTasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || task.assignee.id === filterAssignee;

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [searchQuery, filterPriority, filterAssignee]);

  // Calculate stats
  const stats = useMemo(() => {
    const allTasks = Object.values(tasks).flat();
    const activeTasks = allTasks.filter(t => t.status !== 'done').length;
    const completedTasks = tasks.done?.length || 0;
    const overdueCount = allTasks.filter(t => 
      t.status !== 'done' && new Date(t.dueDate) < new Date()
    ).length;
    const totalHours = allTasks.reduce((sum, t) => sum + t.estimatedHours, 0);

    return { activeTasks, completedTasks, overdueCount, totalHours };
  }, [tasks]);

  // Bulk actions
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    if (bulkMode) setSelectedTasks([]);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAllVisible = () => {
    const visibleTaskIds = columns.flatMap(col => 
      getFilteredTasks(tasks[col.id] || []).map(t => t.id)
    );
    setSelectedTasks(visibleTaskIds);
  };

  const clearSelection = () => {
    setSelectedTasks([]);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 
      dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 relative overflow-hidden">
      
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
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-300 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <div className="relative z-20 bg-white/30 dark:bg-white/5 backdrop-blur-3xl border-b 
        border-white/20 dark:border-white/10 px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          {/* Title & Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 
                rounded-2xl flex items-center justify-center shadow-glass">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 
                  dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  Task Board
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Professionelles Aufgabenmanagement
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/40 dark:bg-white/10 backdrop-blur-2xl rounded-xl 
                border border-white/20 dark:border-white/10 shadow-glass-sm">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">⚡</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.activeTasks}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Aktiv</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-white/40 dark:bg-white/10 backdrop-blur-2xl rounded-xl 
                border border-white/20 dark:border-white/10 shadow-glass-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stats.completedTasks}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Erledigt</span>
                </div>
              </div>
              {stats.overdueCount > 0 && (
                <div className="px-4 py-2 bg-red-500/10 backdrop-blur-2xl rounded-xl 
                  border border-red-500/30 shadow-glass-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">⏰</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {stats.overdueCount}
                    </span>
                    <span className="text-xs text-red-600 dark:text-red-400">Überfällig</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleBulkMode}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 
                backdrop-blur-2xl border ${bulkMode
                  ? 'bg-purple-500/80 text-white border-purple-600/50 shadow-glass-lg'
                  : 'bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/15'
                }`}
            >
              {bulkMode ? '✕ Beenden' : '☑️ Mehrfach'}
            </button>
            <button
              onClick={() => onCreateTask('todo')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 
                hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 
                shadow-glass-lg hover:shadow-glass-xl hover:scale-105 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Neue Aufgabe
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Aufgaben durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
                border border-white/20 dark:border-white/10 rounded-xl text-sm 
                text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 shadow-glass-sm 
                transition-all"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl border 
              border-white/20 dark:border-white/10 rounded-xl text-sm font-medium 
              text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 
              focus:border-blue-500/50 shadow-glass-sm transition-all"
          >
            <option value="all">⭐ Alle Prioritäten</option>
            <option value="critical">🔴 Kritisch</option>
            <option value="high">🟠 Hoch</option>
            <option value="medium">🟡 Mittel</option>
            <option value="low">🟢 Niedrig</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl border 
              border-white/20 dark:border-white/10 rounded-xl text-sm font-medium 
              text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 
              focus:border-blue-500/50 shadow-glass-sm transition-all"
          >
            <option value="all">👥 Alle Mitarbeiter</option>
            {allAssignees.map(assignee => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-blue-500/10 backdrop-blur-2xl rounded-xl border 
                border-blue-500/30 shadow-glass-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center 
                    justify-center font-bold text-blue-600 dark:text-blue-400">
                    {selectedTasks.length}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedTasks.length} Aufgabe{selectedTasks.length !== 1 ? 'n' : ''} ausgewählt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllVisible}
                    className="px-4 py-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 
                      dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-lg 
                      text-sm font-medium transition-all backdrop-blur-sm"
                  >
                    Alle auswählen
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 
                      dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-lg 
                      text-sm font-medium transition-all backdrop-blur-sm"
                  >
                    Auswahl löschen
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full flex gap-6 p-6 min-w-max">
            {columns.map((column) => {
              const columnTasks = getFilteredTasks(tasks[column.id] || []);
              const isOverLimit = column.limit && columnTasks.length > column.limit;

              return (
                <motion.div
                  key={column.id}
                  layout
                  className="flex flex-col w-80"
                  style={{ flex: '0 0 320px' }}
                >
                  {/* Column Header */}
                  <div className="bg-white/40 dark:bg-white/10 backdrop-blur-2xl rounded-t-2xl 
                    border border-white/20 dark:border-white/10 border-b-0 p-4 shadow-glass">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glass-sm"
                          style={{ backgroundColor: `${column.color}20` }}
                        >
                          <span className="text-xl">{column.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase 
                            tracking-wide">
                            {column.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {column.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onCreateTask(column.id)}
                        className="p-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 
                          dark:hover:bg-white/15 rounded-lg transition-all"
                      >
                        <span className="text-gray-700 dark:text-gray-300">+</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        isOverLimit 
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30' 
                          : 'bg-white/40 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-white/20 dark:border-white/10'
                      }`}>
                        {columnTasks.length}{column.limit ? `/${column.limit}` : ''}
                      </span>
                      {isOverLimit && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                          WIP Limit!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column Content */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 bg-white/20 dark:bg-white/5 backdrop-blur-xl 
                          rounded-b-2xl border border-white/20 dark:border-white/10 border-t-0 
                          p-4 space-y-3 min-h-[500px] overflow-y-auto transition-all duration-200 
                          ${snapshot.isDraggingOver 
                            ? 'bg-blue-500/10 ring-2 ring-blue-400/50 ring-inset' 
                            : ''
                          }`}
                      >
                        <AnimatePresence>
                          {columnTasks.map((task, index) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              index={index}
                              onClick={() => onTaskClick(task)}
                              selected={selectedTasks.includes(task.id)}
                              onSelect={(selected) => toggleTaskSelection(task.id)}
                              bulkMode={bulkMode}
                            />
                          ))}
                        </AnimatePresence>
                        {provided.placeholder}

                        {/* Empty State */}
                        {columnTasks.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-12 text-center"
                          >
                            <div className="text-6xl mb-3 opacity-30">{column.icon}</div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Keine Aufgaben
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                              Ziehe Tasks hierher oder erstelle neue
                            </p>
                            <button
                              onClick={() => onCreateTask(column.id)}
                              className="px-4 py-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 
                                dark:hover:bg-white/15 rounded-lg text-sm font-medium 
                                text-gray-700 dark:text-gray-300 transition-all backdrop-blur-sm"
                            >
                              Aufgabe erstellen
                            </button>
                          </motion.div>
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
    </div>
  );
};

export default PremiumKanbanBoard;
