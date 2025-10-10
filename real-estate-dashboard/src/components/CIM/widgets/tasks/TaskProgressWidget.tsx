import React, { useEffect, useState } from 'react';
import apiClient from '../../../../lib/api/client';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  assigned_to?: {
    id: number;
    name: string;
    email: string;
  };
  property?: {
    id: number;
    title: string;
  };
  category?: string;
  progress?: number;
}

const TaskProgressWidget: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get('/tasks');
        
        // Handle different response structures
        const tasksData = response.data?.tasks || response.data || [];
        
        // Ensure we have an array
        const tasksArray = Array.isArray(tasksData) ? tasksData : [];
        
        setTasks(tasksArray);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        
        // Check if it's an authentication error
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('Invalid token') || err.message.includes('Unauthorized'))) {
          setError('Session abgelaufen - Bitte neu anmelden');
        } else {
          setError('Fehler beim Laden der Aufgaben');
        }
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Map backend priority to frontend priority
  const mapPriority = (priority: string): 'low' | 'medium' | 'high' => {
    const normalized = priority?.toLowerCase();
    if (normalized === 'high' || normalized === 'urgent') return 'high';
    if (normalized === 'medium' || normalized === 'normal') return 'medium';
    return 'low';
  };

  // Calculate progress based on status
  const calculateProgress = (task: Task): number => {
    if (task.progress !== undefined && task.progress !== null) {
      return task.progress;
    }
    // Fallback: calculate from status
    switch (task.status) {
      case 'completed': return 100;
      case 'in_progress': return 50;
      case 'cancelled': return 0;
      case 'pending': return 0;
      default: return 0;
    }
  };

  // Get category from task data
  const getCategory = (task: Task): string => {
    if (task.category) return task.category;
    // Infer from property or default
    if (task.property) return 'Immobilie';
    return 'Allgemein';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Hoch';
      case 'medium': return 'Mittel';
      case 'low': return 'Niedrig';
      default: return 'Normal';
    }
  };

  const getCategoryIcon = (category: string) => {
    const normalized = category?.toLowerCase();
    if (normalized?.includes('dokument')) return 'ri-file-text-line';
    if (normalized?.includes('termin') || normalized?.includes('besichtigung')) return 'ri-calendar-line';
    if (normalized?.includes('marketing') || normalized?.includes('exposé')) return 'ri-megaphone-line';
    if (normalized?.includes('finanzen') || normalized?.includes('kredit')) return 'ri-money-euro-circle-line';
    if (normalized?.includes('immobilie') || normalized?.includes('property')) return 'ri-home-line';
    return 'ri-task-line';
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  // Calculate stats from real data
  const tasksWithProgress = tasks.map(task => ({
    ...task,
    progress: calculateProgress(task),
    mappedPriority: mapPriority(task.priority),
    category: getCategory(task),
    dueDate: task.due_date,
    assignee: task.assigned_to?.name || 'Nicht zugewiesen'
  }));

  const completedTasks = tasksWithProgress.filter(task => task.status === 'completed').length;
  const totalProgress = tasksWithProgress.length > 0 
    ? Math.round(tasksWithProgress.reduce((sum, task) => sum + task.progress, 0) / tasksWithProgress.length)
    : 0;
  const overdueTasks = tasksWithProgress.filter(task => 
    isOverdue(task.dueDate) && task.status !== 'completed'
  ).length;

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <i className="ri-task-line mr-2 text-blue-600 dark:text-blue-400"></i>
            Aufgaben
          </h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <i className="ri-task-line mr-2 text-blue-600 dark:text-blue-400"></i>
            Aufgaben
          </h3>
        </div>
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <i className="ri-task-line mr-2 text-blue-600 dark:text-blue-400"></i>
          Aufgaben
        </h3>
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400">Fortschritt</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {totalProgress}%
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {completedTasks}/{tasksWithProgress.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Abgeschlossen
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center">
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {overdueTasks}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Überfällig
          </div>
        </div>
      </div>

      {/* Task List */}
      {tasksWithProgress.length > 0 ? (
        <>
          <div className="space-y-3 mb-4">
            {tasksWithProgress.slice(0, 3).map((task) => (
              <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-2 flex-1 min-w-0">
                    <i className={`${getCategoryIcon(task.category)} text-blue-600 dark:text-blue-400 text-sm mt-0.5 flex-shrink-0`}></i>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {task.assignee}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      bg-${getPriorityColor(task.mappedPriority)}-100 
                      dark:bg-${getPriorityColor(task.mappedPriority)}-900/30
                      text-${getPriorityColor(task.mappedPriority)}-600 
                      dark:text-${getPriorityColor(task.mappedPriority)}-400
                    `}>
                      {getPriorityText(task.mappedPriority)}
                    </span>
                    
                    <span className={`text-xs font-medium ${
                      isOverdue(task.dueDate) && task.status !== 'completed'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        task.progress === 100
                          ? 'bg-green-500'
                          : task.progress >= 50
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-0">
                    {task.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
              <i className="ri-add-line mr-1"></i>
              Neue Aufgabe
            </button>
            <button className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors">
              Alle anzeigen
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <i className="ri-task-line text-4xl text-gray-400 mb-4"></i>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Aufgaben
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Es sind noch keine Aufgaben vorhanden.
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <i className="ri-add-line mr-1"></i>
            Erste Aufgabe erstellen
          </button>
        </div>
      )}

      {/* Live Status */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live-Daten</span>
          </div>
          <span>Aktualisiert: {new Date().toLocaleTimeString('de-DE')}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskProgressWidget;
