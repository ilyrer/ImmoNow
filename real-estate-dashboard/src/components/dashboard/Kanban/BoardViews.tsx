import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  storyPoints?: number;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  sprint?: {
    id: string;
    name: string;
  };
}

interface BoardViewsProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  currentView: 'kanban' | 'list' | 'calendar' | 'timeline';
  onViewChange: (view: 'kanban' | 'list' | 'calendar' | 'timeline') => void;
}

const BoardViews: React.FC<BoardViewsProps> = ({
  tasks,
  onTaskClick,
  onTaskUpdate,
  currentView,
  onViewChange
}) => {
  const [sortBy, setSortBy] = useState<'title' | 'priority' | 'dueDate' | 'createdAt' | 'assignee'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { highest: 5, high: 4, medium: 3, low: 2, lowest: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'assignee':
          aValue = a.assignee.name.toLowerCase();
          bValue = b.assignee.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [tasks, sortBy, sortOrder]);

  // Group tasks by date for calendar view
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      const date = new Date(task.dueDate).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(task);
    });
    
    return grouped;
  }, [tasks]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [selectedDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth();
  };

  const priorityColors = {
    highest: 'text-red-500',
    high: 'text-orange-500',
    medium: 'text-yellow-500',
    low: 'text-blue-500',
    lowest: 'text-gray-500'
  };

  const statusColors = {
    backlog: 'bg-gray-100 text-gray-800',
    todo: 'bg-blue-100 text-blue-800',
    inProgress: 'bg-yellow-100 text-yellow-800',
    review: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
    onHold: 'bg-orange-100 text-orange-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const renderListView = () => (
    <div className="space-y-2">
      {/* List Header */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600 dark:text-gray-400">
          <div className="col-span-4">Task</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Zugewiesen</div>
          <div className="col-span-2">Fälligkeitsdatum</div>
          <div className="col-span-1">Priorität</div>
          <div className="col-span-1">Story Points</div>
        </div>
      </div>

      {/* List Items */}
      {sortedTasks.map((task) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onTaskClick(task)}
        >
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-mono">
                  {task.id.slice(0, 4)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                    {task.description}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-span-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status as keyof typeof statusColors]}`}>
                {task.status}
              </span>
            </div>
            
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <img
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {task.assignee.name}
                </span>
              </div>
            </div>
            
            <div className="col-span-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {formatDate(new Date(task.dueDate))}
              </span>
            </div>
            
            <div className="col-span-1">
              <span className={priorityColors[task.priority as keyof typeof priorityColors]}>
                {task.priority}
              </span>
            </div>
            
            <div className="col-span-1">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {task.storyPoints || '-'}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderCalendarView = () => (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {selectedDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            Heute
          </button>
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
          {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayTasks = tasksByDate[day.toISOString().split('T')[0]] || [];
            const isCurrentMonthDay = isCurrentMonth(day);
            const isTodayDay = isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-2 ${
                  isCurrentMonthDay ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isTodayDay ? 'text-blue-600 dark:text-blue-400' : 
                  isCurrentMonthDay ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="p-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/30"
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="truncate">{task.title}</div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayTasks.length - 3} weitere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Timeline
      </h2>
      
      <div className="space-y-4">
        {sortedTasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-start gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="w-px h-16 bg-gray-200 dark:bg-gray-600 mt-2"></div>
              </div>
              
              {/* Task Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status as keyof typeof statusColors]}`}>
                      {task.status}
                    </span>
                    <span className={priorityColors[task.priority as keyof typeof priorityColors]}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {task.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <img
                      src={task.assignee.avatar}
                      alt={task.assignee.name}
                      className="w-4 h-4 rounded-full"
                    />
                    {task.assignee.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="ri-calendar-line"></i>
                    {formatDate(new Date(task.dueDate))}
                  </div>
                  {task.storyPoints && (
                    <div className="flex items-center gap-1">
                      <i className="ri-flag-line"></i>
                      {task.storyPoints} SP
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full">
      {/* View Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {[
            { id: 'kanban', label: 'Kanban', icon: 'ri-layout-grid-line' },
            { id: 'list', label: 'Liste', icon: 'ri-list-check' },
            { id: 'calendar', label: 'Kalender', icon: 'ri-calendar-line' },
            { id: 'timeline', label: 'Timeline', icon: 'ri-time-line' }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === view.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <i className={`${view.icon} mr-2`}></i>
              {view.label}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        {currentView === 'list' && (
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="title">Titel</option>
              <option value="priority">Priorität</option>
              <option value="dueDate">Fälligkeitsdatum</option>
              <option value="createdAt">Erstellt</option>
              <option value="assignee">Zugewiesen</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <i className={`ri-sort-${sortOrder === 'asc' ? 'asc' : 'desc'}`}></i>
            </button>
          </div>
        )}
      </div>

      {/* View Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentView === 'list' && renderListView()}
          {currentView === 'calendar' && renderCalendarView()}
          {currentView === 'timeline' && renderTimelineView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BoardViews;
