import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Task Interface (vereinfacht)
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'hoch' | 'mittel' | 'niedrig';
  assignee: {
    name: string;
    avatar: string;
    id: string;
  };
  dueDate: string;
  status: 'backlog' | 'todo' | 'inProgress' | 'review' | 'done' | 'blocked';
  progress: number;
  tags: string[];
  estimatedHours: number;
  impactScore: number;
  effortScore: number;
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
  createdAt: string;
  updatedAt: string;
  lastActivity: {
    user: string;
    action: string;
    timestamp: string;
  };
}

interface PriorityMatrix {
  urgent_important: Task[];
  important_not_urgent: Task[];
  urgent_not_important: Task[];
  neither: Task[];
}

interface ViewProps {
  tasks: Record<string, Task[]>;
  isDarkMode: boolean;
  onTaskClick: (task: Task) => void;
  selectedTasks: string[];
  onTaskSelect: (taskId: string, selected: boolean) => void;
  bulkEditMode: boolean;
}

// 1. Priority Matrix View (Eisenhower Matrix)
export const PriorityMatrixView: React.FC<ViewProps> = ({ 
  tasks, 
  isDarkMode, 
  onTaskClick, 
  selectedTasks,
  onTaskSelect,
  bulkEditMode 
}) => {
  // Calculate priority matrix
  const calculateMatrix = (): PriorityMatrix => {
    const allTasks = Object.values(tasks).flat();
    const matrix: PriorityMatrix = {
      urgent_important: [],
      important_not_urgent: [],
      urgent_not_important: [],
      neither: []
    };

    allTasks.forEach(task => {
      const isUrgent = new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const isImportant = task.impactScore >= 7;
      
      if (isUrgent && isImportant) matrix.urgent_important.push(task);
      else if (isImportant && !isUrgent) matrix.important_not_urgent.push(task);
      else if (isUrgent && !isImportant) matrix.urgent_not_important.push(task);
      else matrix.neither.push(task);
    });

    return matrix;
  };

  const matrix = calculateMatrix();

  const quadrants = [
    {
      key: 'urgent_important',
      title: 'Do First',
      subtitle: 'Urgent & Important',
      color: 'from-red-500 to-pink-500',
      borderColor: 'border-red-500/30',
      bgColor: isDarkMode ? 'bg-red-900/20' : 'bg-red-50',
      tasks: matrix.urgent_important,
      icon: '🔥'
    },
    {
      key: 'important_not_urgent',
      title: 'Schedule',
      subtitle: 'Important, Not Urgent',
      color: 'from-blue-500 to-indigo-500',
      borderColor: 'border-blue-500/30',
      bgColor: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50',
      tasks: matrix.important_not_urgent,
      icon: '📋'
    },
    {
      key: 'urgent_not_important',
      title: 'Delegate',
      subtitle: 'Urgent, Not Important',
      color: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-500/30',
      bgColor: isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50',
      tasks: matrix.urgent_not_important,
      icon: '👥'
    },
    {
      key: 'neither',
      title: 'Eliminate',
      subtitle: 'Neither Urgent nor Important',
      color: 'from-gray-500 to-slate-500',
      borderColor: 'border-gray-500/30',
      bgColor: isDarkMode ? 'bg-gray-900/20' : 'bg-gray-50',
      tasks: matrix.neither,
      icon: '🗑️'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {quadrants.map((quadrant, index) => (
        <motion.div
          key={quadrant.key}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className={`${quadrant.bgColor} ${quadrant.borderColor} border-2 rounded-2xl p-6 relative overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{quadrant.icon}</span>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {quadrant.title}
                </h3>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {quadrant.subtitle}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-white/70 text-gray-700'
            }`}>
              {quadrant.tasks.length}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {quadrant.tasks.map((task, taskIndex) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: taskIndex * 0.05 }}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-white/70 hover:bg-white/90'
                  } border border-white/10 hover:shadow-lg group relative`}
                  onClick={() => onTaskClick(task)}
                >
                  {bulkEditMode && (
                    <div className="absolute top-2 left-2">
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                          {task.title}
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 line-clamp-2`}>
                          {task.description}
                        </p>
                      </div>
                      <div className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'hoch' ? 'bg-orange-500/20 text-orange-400' :
                        task.priority === 'mittel' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {task.priority}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <img
                          src={task.assignee.avatar}
                          alt={task.assignee.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.assignee.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Impact: {task.impactScore}/10
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.estimatedHours}h
                        </div>
                      </div>
                    </div>

                    {task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.labels.slice(0, 3).map((label) => (
                          <span
                            key={label.id}
                            className="px-2 py-1 text-xs rounded-full"
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
                            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            +{task.labels.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {quadrant.tasks.length === 0 && (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="text-4xl mb-2">✨</div>
                <p>No tasks in this quadrant</p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// 2. Focus Mode View
export const FocusModeView: React.FC<ViewProps> = ({ 
  tasks, 
  isDarkMode, 
  onTaskClick 
}) => {
  const allTasks = Object.values(tasks).flat();
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's tasks sorted by priority and impact
  const todaysTasks = allTasks
    .filter(task => task.dueDate === today)
    .sort((a, b) => {
      const priorityOrder = { critical: 4, hoch: 3, mittel: 2, niedrig: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0) || 
             b.impactScore - a.impactScore;
    });

  const focusTasks = todaysTasks.slice(0, 3); // Top 3 tasks for focus
  const upcomingTasks = allTasks
    .filter(task => new Date(task.dueDate) > new Date(today))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Today's Focus */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-8 rounded-2xl ${
          isDarkMode ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30' : 'bg-gradient-to-br from-blue-50 to-purple-50'
        } border border-blue-500/20`}
      >
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            🎯 Today's Focus
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your top 3 priorities for maximum impact
          </p>
        </div>

        <div className="space-y-4">
          {focusTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-xl cursor-pointer transition-all ${
                isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-white/70 hover:bg-white/90'
              } border border-white/10 hover:shadow-xl group`}
              onClick={() => onTaskClick(task)}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                  index === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                  'bg-gradient-to-r from-purple-400 to-purple-600 text-white'
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    {task.description.length > 100 ? 
                      task.description.substring(0, 100) + '...' : 
                      task.description
                    }
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <img
                        src={task.assignee.avatar}
                        alt={task.assignee.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {task.assignee.name}
                      </span>
                    </div>
                    
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'hoch' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {task.priority}
                    </div>
                    
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Impact: {task.impactScore}/10
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                    Start Focus
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {focusTasks.length === 0 && (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
            <p>No urgent tasks for today. Great job!</p>
          </div>
        )}
      </motion.div>

      {/* Upcoming Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-6 rounded-2xl ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
        } border border-gray-500/20`}
      >
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          📅 Upcoming This Week
        </h3>
        
        <div className="space-y-3">
          {upcomingTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                isDarkMode ? 'bg-gray-700/50 hover:bg-gray-600/50' : 'bg-gray-50/50 hover:bg-gray-100/50'
              }`}
              onClick={() => onTaskClick(task)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.assignee.name}
                    </span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  task.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                  task.priority === 'hoch' ? 'bg-orange-500/20 text-orange-400' :
                  task.priority === 'mittel' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {task.priority}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// 3. Timeline View (Gantt-style)
export const TimelineView: React.FC<ViewProps> = ({ 
  tasks, 
  isDarkMode, 
  onTaskClick 
}) => {
  const allTasks = Object.values(tasks).flat()
    .filter(task => task.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 21);

  const getDaysFromStart = (date: string) => {
    const taskDate = new Date(date);
    const diffTime = taskDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl ${
        isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
      } border border-gray-500/20`}>
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
          📊 Project Timeline
        </h3>
        
        {/* Timeline Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-64 text-sm font-medium">Task</div>
            <div className="flex-1 grid grid-cols-7 gap-1 text-xs text-center">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i * 4);
                return (
                  <div key={i} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline Tasks */}
        <div className="space-y-3">
          {allTasks.slice(0, 10).map((task, index) => {
            const taskDays = getDaysFromStart(task.dueDate);
            const taskWidth = Math.max(task.estimatedHours / 8 * 4, 1); // Convert hours to days, min 1 day
            const leftPosition = Math.max(0, (taskDays / totalDays) * 100);
            const widthPercentage = Math.min((taskWidth / totalDays) * 100, 100 - leftPosition);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center space-x-2"
              >
                <div className="w-64">
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                    {task.title}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <img
                      src={task.assignee.avatar}
                      alt={task.assignee.name}
                      className="w-4 h-4 rounded-full"
                    />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.assignee.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 relative h-8">
                  <div className={`absolute inset-y-0 ${
                    isDarkMode ? 'bg-gray-700/30' : 'bg-gray-200/30'
                  } rounded`} style={{ left: 0, right: 0 }}></div>
                  
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercentage}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    className={`absolute inset-y-1 rounded cursor-pointer transition-all hover:shadow-lg ${
                      task.priority === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      task.priority === 'hoch' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      task.priority === 'mittel' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      'bg-gradient-to-r from-gray-500 to-gray-600'
                    }`}
                    style={{ left: `${leftPosition}%` }}
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="px-2 py-1 text-white text-xs font-medium truncate">
                      {task.title}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
