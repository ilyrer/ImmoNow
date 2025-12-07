import React from 'react';
import { useTasks } from '../../../../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle, Users, TrendingUp } from 'lucide-react';

const LiveTasksWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data: tasks, isLoading, error } = useTasks();

  // Debug-Logging für tasks-Daten
  console.log('🎯 LiveTasksWidget - Debug Info:', {
    tasks,
    isArray: Array.isArray(tasks),
    type: typeof tasks,
    length: tasks?.tasks?.length || tasks?.total || 0,
    isLoading,
    error
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Aufgaben</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Live Task Board</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Aufgaben</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fehler beim Laden</p>
            </div>
          </div>
        </div>
        <div className="text-center text-red-600 dark:text-red-400">
          Fehler beim Laden der Task-Daten
        </div>
      </div>
    );
  }

  // Safely handle tasks data
  const tasksArray = tasks?.tasks ? (Array.isArray(tasks.tasks) ? tasks.tasks : []) : [];
  const totalTasks = tasks?.total || tasksArray.length || 0;

  // Get display tasks (limit to 5)
  const displayTasks = tasksArray.slice(0, 5);

  // Calculate stats
  const todoTasks = tasksArray.filter((task: any) => task.status === 'todo').length;
  const inProgressTasks = tasksArray.filter((task: any) => task.status === 'inProgress').length;
  const doneTasks = tasksArray.filter((task: any) => task.status === 'done').length;
  const overdueTasks = tasksArray.filter((task: any) => isOverdue(task.due_date)).length;

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'highest':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'lowest':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'backlog':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'todo':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'inprogress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'backlog':
        return 'Backlog';
      case 'todo':
        return 'To Do';
      case 'inprogress':
        return 'In Arbeit';
      case 'review':
        return 'Review';
      case 'done':
        return 'Erledigt';
      case 'blocked':
        return 'Blockiert';
      default:
        return status || 'Unbekannt';
    }
  };

  const getIssueTypeIcon = (issueType: string) => {
    switch (issueType?.toLowerCase()) {
      case 'listing':
        return <Users className="h-4 w-4" />;
      case 'viewing':
        return <Clock className="h-4 w-4" />;
      case 'contract':
        return <CheckCircle className="h-4 w-4" />;
      case 'maintenance':
        return <AlertCircle className="h-4 w-4" />;
      case 'marketing':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const formatDueDate = (dueDate: string) => {
    return dueDate ? new Date(dueDate).toLocaleDateString('de-DE') : 'Kein Datum';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Aufgaben</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Live Task Board</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tasks')}
          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium transition-colors"
        >
          Alle anzeigen →
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{todoTasks}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">To Do</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{inProgressTasks}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">In Arbeit</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{doneTasks}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Erledigt</p>
        </div>
      </div>

      {/* Task List */}
      {displayTasks.length > 0 ? (
        <div className="space-y-4">
          {displayTasks.map((task: any, index: number) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => navigate(`/tasks/${task.id}`)}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  {getIssueTypeIcon(task.issue_type)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white truncate max-w-48">
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span className="truncate max-w-32">
                      {task.due_date ? formatDueDate(task.due_date) : 'Kein Datum'}
                    </span>
                    {isOverdue(task.due_date) && (
                      <span className="text-red-500 font-medium">Überfällig</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority || 'Normal'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Aufgaben derzeit
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Es sind noch keine Task-Daten vom Backend verfügbar.
          </p>
          <button
            onClick={() => navigate('/tasks')}
            className="mt-4 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
          >
            Tasks verwalten →
          </button>
        </div>
      )}

      {/* Overdue Alert */}
      {overdueTasks > 0 && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200 font-medium">
              {overdueTasks} überfällige Aufgabe{overdueTasks > 1 ? 'n' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Live Status */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live-Daten</span>
          </div>
          <span>Letzte Aktualisierung: {new Date().toLocaleTimeString('de-DE')}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveTasksWidget; 
