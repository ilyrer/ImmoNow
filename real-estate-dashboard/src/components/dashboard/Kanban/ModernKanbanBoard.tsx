import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Task Interface
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'hoch' | 'mittel' | 'niedrig';
  assignee: {
    name: string;
    avatar: string;
    id: string;
    capacity?: number;
  };
  dueDate: string;
  status: 'backlog' | 'todo' | 'inProgress' | 'review' | 'done' | 'blocked';
  progress: number;
  tags: string[];
  estimatedHours: number;
  actualHours?: number;
  complexity: 'trivial' | 'easy' | 'medium' | 'hard' | 'epic';
  impactScore: number;
  effortScore: number;
  dependencies: string[];
  watchers: string[];
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
  customFields: Record<string, any>;
  focusTime?: {
    estimated: number;
    actual?: number;
    deepWorkRequired: boolean;
  };
  attachments: any[];
  comments: any[];
  subtasks: any[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  lastActivity: {
    user: string;
    action: string;
    timestamp: string;
  };
}

interface Column {
  id: string;
  title: string;
  color: string;
  icon: string;
  description: string;
  limit?: number | null;
}

interface ModernKanbanBoardProps {
  tasks: Record<string, Task[]>;
  statusColumns: Column[];
  isDarkMode: boolean;
  onDragEnd: (result: DropResult) => void;
  onTaskClick: (task: Task) => void;
  onCreateTask: (columnId: string) => void;
  selectedTasks: string[];
  onTaskSelect: (taskId: string, selected: boolean) => void;
  bulkEditMode: boolean;
  // Sprint controls (optional)
  sprints?: Array<{ id: string; name: string; status?: string }>;
  selectedSprintId?: string | null;
  onChangeSprint?: (sprintId: string | null) => void;
  onCreateSprint?: () => void;
  sprintInfo?: { id: string; name: string; status: 'planning' | 'active' | 'completed' } | null;
  sprintStats?: { total: number; done: number; remaining: number } | null;
  onSprintStart?: () => void;
  onSprintComplete?: () => void;
}

const ModernKanbanBoard: React.FC<ModernKanbanBoardProps> = ({
  tasks,
  statusColumns,
  isDarkMode,
  onDragEnd,
  onTaskClick,
  onCreateTask,
  selectedTasks,
  onTaskSelect,
  bulkEditMode,
  sprints,
  selectedSprintId,
  onChangeSprint,
  onCreateSprint
  , sprintInfo, sprintStats, onSprintStart, onSprintComplete
}) => {
  const [wipViolations, setWipViolations] = useState<Record<string, boolean>>({});
  const [columnCollapsed, setColumnCollapsed] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // Check WIP limit violations
  useEffect(() => {
    const violations: Record<string, boolean> = {};
    statusColumns.forEach(column => {
      if (column.limit && tasks[column.id]) {
        violations[column.id] = tasks[column.id].length > column.limit;
      }
    });
    setWipViolations(violations);
  }, [tasks, statusColumns]);

  // Priority color marker (no emojis)
  const getPriorityMarker = (priority: string) => {
    const map: Record<string, string> = {
      critical: 'bg-red-500',
      hoch: 'bg-orange-500',
      mittel: 'bg-yellow-500',
      niedrig: 'bg-green-500'
    };
    return map[priority] || 'bg-gray-400';
  };

  // Filter tasks based on search and filters
  const getFilteredTasks = (columnTasks: Task[]) => {
    return columnTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || task.assignee.id === filterAssignee;
      
      return matchesSearch && matchesPriority && matchesAssignee;
    });
  };

  // Get unique assignees for filter
  const getUniqueAssignees = () => {
    const assignees = new Set<string>();
    Object.values(tasks).flat().forEach(task => {
      assignees.add(task.assignee.id);
    });
    return Array.from(assignees);
  };

  // Calculate column metrics
  const getColumnMetrics = (columnId: string) => {
    const columnTasks = tasks[columnId] || [];
    const totalHours = columnTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    const avgPriority = columnTasks.length > 0 ? 
      columnTasks.reduce((sum, task) => {
        const priorityValue = { critical: 4, hoch: 3, mittel: 2, niedrig: 1 }[task.priority] || 1;
        return sum + priorityValue;
      }, 0) / columnTasks.length : 0;
    
    return { totalHours, avgPriority };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header with Filters */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'} backdrop-blur-sm`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Kanban Board
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Moderne, professionelle Aufgabenverwaltung
            </p>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sprint header info */}
            {sprintInfo && (
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800/70' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <span className="text-sm font-medium">Sprint:</span>
                <span className="text-sm font-semibold">{sprintInfo.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  sprintInfo.status === 'active' ? 'bg-green-100 text-green-700' : sprintInfo.status === 'planning' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                }`}>{sprintInfo.status}</span>
                {sprintStats && (
                  <div className="hidden md:flex items-center gap-3 ml-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span>Done</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-green-500" initial={{width:0}} animate={{width: `${Math.min(100, (sprintStats.done / Math.max(1, sprintStats.total)) * 100)}%`}} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span>Remaining</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-blue-500" initial={{width:0}} animate={{width: `${Math.min(100, (sprintStats.remaining / Math.max(1, sprintStats.total)) * 100)}%`}} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-2">
                  {onSprintStart && sprintInfo.status === 'planning' && (
                    <button onClick={onSprintStart} className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs">Starten</button>
                  )}
                  {onSprintComplete && sprintInfo.status === 'active' && (
                    <button onClick={onSprintComplete} className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs">Abschließen</button>
                  )}
                </div>
              </div>
            )}
            {/* Search */}
            <div className="relative">
              <i className={`ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
              <input
                type="text"
                placeholder="Aufgaben durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              />
            </div>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
            >
              <option value="all">Alle Prioritäten</option>
              <option value="critical">Kritisch</option>
              <option value="hoch">Hoch</option>
              <option value="mittel">Mittel</option>
              <option value="niedrig">Niedrig</option>
            </select>

            {/* Sprint Filter (optional) */}
            {sprints && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedSprintId || ''}
                  onChange={(e) => onChangeSprint?.(e.target.value || null)}
                  className={`px-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                >
                  <option value="">Alle Sprints</option>
                  {sprints.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {onCreateSprint && (
                  <button
                    onClick={onCreateSprint}
                    className={`px-3 py-2 rounded-lg font-medium transition-all ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Sprint erstellen
                  </button>
                )}
              </div>
            )}

            {/* Assignee Filter */}
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
            >
              <option value="all">Alle Mitarbeiter</option>
              {getUniqueAssignees().map(assigneeId => {
                const assignee = Object.values(tasks).flat().find(task => task.assignee.id === assigneeId)?.assignee;
                return assignee ? (
                  <option key={assigneeId} value={assigneeId}>{assignee.name}</option>
                ) : null;
              })}
            </select>

            {/* Create Task Button */}
            <button
              onClick={() => onCreateTask('todo')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              <i className="ri-add-line"></i>
              Neue Aufgabe
            </button>
          </div>
        </div>

        {/* Board Stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          {statusColumns.map(column => {
            const columnTasks = getFilteredTasks(tasks[column.id] || []);
            const isOverLimit = wipViolations[column.id];
            
            return (
              <div
                key={column.id}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                } border ${isOverLimit ? 'border-red-500/50' : 'border-transparent'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {column.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isOverLimit 
                      ? 'bg-red-500/20 text-red-400' 
                      : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {columnTasks.length}{column.limit ? `/${column.limit}` : ''}
                  </span>
                  {isOverLimit && <i className="ri-error-warning-line text-red-500 text-sm"></i>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board (horizontal scroll with flex layout) */}
      <div className="flex-1 p-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full">
            {statusColumns.map((column) => {
              const columnTasks = getFilteredTasks(tasks[column.id] || []);
              const isOverLimit = wipViolations[column.id];
              const isCollapsed = columnCollapsed[column.id];
              const metrics = getColumnMetrics(column.id);

              return (
                <motion.div
                  key={column.id}
                  layout
                  className={`flex flex-col flex-1 min-w-0 ${
                    isDarkMode ? 'bg-gray-800/30' : 'bg-white/30'
                  } backdrop-blur-sm rounded-2xl border ${
                    isOverLimit ? 'border-red-500/30' : isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
                  } shadow-lg hover:shadow-xl transition-all duration-300`}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Column Header */}
                  <div className={`p-4 border-b ${
                    isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${column.color} shadow-sm`}></div>
                        <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {column.title}
                        </h3>
                        
                        {/* Task Count with WIP Limit */}
                        <div className="flex items-center gap-1">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            isOverLimit 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isDarkMode 
                                ? 'bg-gray-700 text-gray-300' 
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {columnTasks.length}
                            {column.limit && `/${column.limit}`}
                          </span>
                          
                          {isOverLimit && (
                            <motion.i
                              className="ri-error-warning-line text-red-500"
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            ></motion.i>
                          )}
                        </div>
                      </div>

                      {/* Column Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setColumnCollapsed(prev => ({ ...prev, [column.id]: !prev[column.id] }))}
                          className={`p-1 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <i className={`ri-${isCollapsed ? 'expand' : 'contract'}-up-down-line ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}></i>
                        </button>
                        
                        <button
                          onClick={() => onCreateTask(column.id)}
                          className={`p-1 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                          }`}
                        >
                          <i className="ri-add-line"></i>
                        </button>
                      </div>
                    </div>

                    {/* Column Description */}
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                      {column.description}
                    </p>

                    {/* Column Metrics */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <i className="ri-time-line"></i>
                        <span>{metrics.totalHours}h</span>
                      </div>
                      <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <i className="ri-bar-chart-line"></i>
                        <span>Ø {metrics.avgPriority.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* WIP Limit Warning */}
                    {isOverLimit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <i className="ri-alarm-warning-line text-red-500"></i>
                          <span className="text-xs text-red-600 font-medium">
                            WIP-Limit überschritten! Fokus auf Abschluss.
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Column Content */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-4 space-y-3 min-h-[200px] transition-colors ${
                          snapshot.isDraggingOver 
                            ? isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/50'
                            : ''
                        }`}
                      >
                        <AnimatePresence>
                          {!isCollapsed && columnTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                    snapshot.isDragging
                                      ? 'shadow-2xl rotate-3 scale-105'
                                      : isDarkMode 
                                        ? 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/30' 
                                        : 'bg-white/70 hover:bg-white/90 border border-gray-200/30'
                                  } backdrop-blur-sm group relative hover:scale-102`}
                                  onClick={() => onTaskClick(task)}
                                >
                                  {/* Bulk Edit Checkbox */}
                                  {bulkEditMode && (
                                    <div className="absolute top-2 left-2 z-10">
                                      <input
                                        type="checkbox"
                                        checked={selectedTasks.includes(task.id)}
                                        onChange={(e) => onTaskSelect(task.id, e.target.checked)}
                                        className="rounded border-gray-300"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  )}

                                  <div className={`${bulkEditMode ? 'ml-6' : ''}`}>
                                    {/* Task Header */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} line-clamp-2 mb-1`}>
                                          {task.title}
                                        </h4>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                                          {task.description}
                                        </p>
                                      </div>
                                      
                                      {/* Priority Badge */}
                                      <div className={`ml-2 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-2 ${
                                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        <span className={`inline-block w-2 h-2 rounded-full ${getPriorityMarker(task.priority)}`}></span>
                                        {task.priority}
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    {task.progress > 0 && (
                                      <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                            Fortschritt
                                          </span>
                                          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {task.progress}%
                                          </span>
                                        </div>
                                        <div className={`w-full h-2 rounded-full overflow-hidden ${
                                          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                                        }`}>
                                          <motion.div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${task.progress}%` }}
                                            transition={{ duration: 0.5, delay: 0.1 }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Labels */}
                                    {task.labels.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-3">
                                        {task.labels.slice(0, 3).map((label) => (
                                          <span
                                            key={label.id}
                                            className="px-2 py-1 text-xs font-medium rounded-full"
                                            style={{ 
                                              backgroundColor: `${label.color}20`, 
                                              color: label.color 
                                            }}
                                          >
                                            {label.name}
                                          </span>
                                        ))}
                                        {task.labels.length > 3 && (
                                          <span className={`px-2 py-1 text-xs rounded-full ${
                                            isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                                          }`}>
                                            +{task.labels.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Task Footer */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={task.assignee.avatar}
                                          alt={task.assignee.name}
                                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                        />
                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                          {task.assignee.name}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-3 text-xs">
                                        {/* Due Date */}
                                        <div className="flex items-center gap-1">
                                          <i className={`ri-calendar-line ${
                                            new Date(task.dueDate) < new Date() 
                                              ? 'text-red-500' 
                                              : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                          }`}></i>
                                          <span className={`${
                                            new Date(task.dueDate) < new Date() 
                                              ? 'text-red-500 font-medium' 
                                              : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                          }`}>
                                            {new Date(task.dueDate).toLocaleDateString('de-DE', { 
                                              month: 'short', 
                                              day: 'numeric' 
                                            })}
                                          </span>
                                        </div>

                                        {/* Estimated Hours */}
                                        <div className="flex items-center gap-1">
                                          <i className={`ri-time-line ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                            {task.estimatedHours}h
                                          </span>
                                        </div>

                                        {/* Comments Count */}
                                        {task.comments.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <i className={`ri-chat-3-line ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                              {task.comments.length}
                                            </span>
                                          </div>
                                        )}

                                        {/* Attachments Count */}
                                        {task.attachments.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <i className={`ri-attachment-line ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                              {task.attachments.length}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Dependencies Indicator */}
                                    {task.dependencies.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-200/20">
                                        <div className="flex items-center gap-1">
                                          <i className={`ri-links-line text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {task.dependencies.length} Abhängigkeiten
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                        
                        {provided.placeholder}
                        
                        {/* Empty State */}
                        {columnTasks.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`text-center py-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            <p className="text-sm font-medium mb-2">Keine Aufgaben</p>
                            <button
                              onClick={() => onCreateTask(column.id)}
                              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                              }`}
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

export default ModernKanbanBoard; 
