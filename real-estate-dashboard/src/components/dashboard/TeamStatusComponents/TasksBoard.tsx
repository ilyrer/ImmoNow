import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { AIAssistant } from '../Kanban';
import { apiClient } from '../../../lib/api/client';

// Import AnimatePresence separat, um TypeScript-Probleme zu vermeiden
// @ts-ignore - Notwendig für Kompatibilität mit framer-motion@4.1.17
import { AnimatePresence } from 'framer-motion';

// Real API Task interface
interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  due_date?: string;
  dueDate?: string; // Backward compatibility
  assignee_id?: string;
  assignee_name?: string;
  assignee?: { name: string; avatar?: string }; // Backward compatibility
  property_id?: string;
  tags?: string[];
  progress?: number;
  attachments?: any[];
  comments?: any[];
  subtasks?: any[];
  created_at?: string;
  createdAt?: string; // Backward compatibility
  updated_at?: string;
  updatedAt?: string; // Backward compatibility
}

type TaskStatus = string;
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface TasksKPIData {
  totalTasks: number;
  overdueTasks: number;
  averageDuration: string;
  successRate: number;
}

interface TasksFilterParams {
  priority?: TaskPriority;
  assignee?: string;
  tags?: string[];
  dateRange?: string;
  searchTerm?: string;
}

// Real API functions
const getTasks = async (params?: any) => {
  try {
    const response = await apiClient.get('/api/v1/tasks', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { items: [], total: 0, page: 1, size: 10, pages: 0 };
  }
};

const updateTaskStatus = async (id: string, status: string) => {
  try {
    const response = await apiClient.put(`/api/v1/tasks/${id}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

const getTasksKPI = async () => {
  try {
    const response = await apiClient.get('/api/v1/analytics/tasks');
    const data = response.data || {};
    
    return {
      totalTasks: data.total_tasks || 0,
      overdueTasks: data.overdue_tasks || 0,
      averageDuration: data.average_completion_time || '0 Tage',
      successRate: data.completion_rate || 0,
    };
  } catch (error) {
    console.error('Error fetching task KPIs:', error);
    return {
      totalTasks: 0,
      overdueTasks: 0,
      averageDuration: '0 Tage',
      successRate: 0,
    };
  }
};

const getAvailableTags = async () => {
  try {
    // Tags are not directly available, extract from tasks
    const response = await apiClient.get('/api/v1/tasks', { params: { size: 100 } });
    const tasks = response.data?.items || [];
    const tagSet = new Set<string>();
    
    tasks.forEach((task: any) => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

const createTask = async (data: any) => {
  try {
    const response = await apiClient.post('/api/v1/tasks', data);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

const updateTask = async (id: string, data: any) => {
  try {
    const response = await apiClient.put(`/api/v1/tasks/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

const deleteTask = async (id: string) => {
  try {
    await apiClient.delete(`/api/v1/tasks/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Status-Spalten mit erweiterten Informationen
const statusColumns = [
  { 
    id: 'todo', 
    title: 'Zu erledigen', 
    color: 'bg-blue-500', 
    icon: 'ri-list-check',
    description: 'Neue und geplante Aufgaben'
  },
  { 
    id: 'inProgress', 
    title: 'In Bearbeitung', 
    color: 'bg-amber-500', 
    icon: 'ri-time-line',
    description: 'Aktuell bearbeitete Aufgaben'
  },
  { 
    id: 'review', 
    title: 'In Prüfung', 
    color: 'bg-purple-500', 
    icon: 'ri-eye-line',
    description: 'Zur Überprüfung anstehende Aufgaben'
  },
  { 
    id: 'done', 
    title: 'Erledigt', 
    color: 'bg-green-500', 
    icon: 'ri-check-double-line',
    description: 'Abgeschlossene Aufgaben'
  }
];

// KPI-Interface
interface KPIData {
  totalTasks: number;
  overdueTasks: number;
  averageDuration: string;
  successRate: number;
}

// Dummy-KPIs
const initialKPIs: KPIData = {
  totalTasks: 24,
  overdueTasks: 3,
  averageDuration: '2.5 Tage',
  successRate: 85
};

// Gruppenrichtlinien-Interface
interface GroupRule {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'error';
  condition: string;
}

// Dummy-Gruppenrichtlinien
const groupRules: GroupRule[] = [
  {
    id: 'r1',
    title: 'Deadline erforderlich',
    description: 'Alle Aufgaben müssen ein Fälligkeitsdatum haben',
    type: 'error',
    condition: 'dueDate === null'
  },
  {
    id: 'r2',
    title: 'Priorität setzen',
    description: 'Aufgaben müssen eine Priorität haben',
    type: 'warning',
    condition: 'priority === null'
  }
];

// Lokale Filter-Erweiterung
interface LocalFilters {
  priority?: TaskPriority | 'all';
  assignee?: string | 'all';
  tags?: string[];
  dateRange?: 'today' | 'week' | 'month' | 'all';
  searchTerm?: string;
}

const TasksBoard = forwardRef<any>((props, ref) => {
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LocalFilters>({
    priority: 'all',
    assignee: 'all',
    tags: [],
    dateRange: 'all'
  });
  const [taskInput, setTaskInput] = useState({
    title: '',
    description: '',
    teamContext: ''
  });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [kpis, setKpis] = useState<TasksKPIData>({
    totalTasks: 0,
    overdueTasks: 0,
    averageDuration: '0 Tage',
    successRate: 0
  });
  const [showRules, setShowRules] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Laden der Daten von der API beim ersten Rendern
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        // Filter Parameter für die API-Anfrage aufbauen
        const params: TasksFilterParams = {};
        if (filters.priority && filters.priority !== 'all') params.priority = filters.priority as TaskPriority;
        if (filters.assignee && filters.assignee !== 'all') params.assignee = filters.assignee;
        if (filters.dateRange && filters.dateRange !== 'all') params.dateRange = filters.dateRange;
        if (filters.tags && filters.tags.length > 0) params.tags = filters.tags;
        if (searchQuery) params.searchTerm = searchQuery;

        // API-Aufrufe
        const [tasksResponse, kpiResponse, tagsResponse] = await Promise.all([
          getTasks(params),
          getTasksKPI(),
          getAvailableTags()
        ]);

        // State aktualisieren - Transform items into status-grouped tasks
        const groupedTasks: Record<string, any[]> = {};
        (tasksResponse?.items || []).forEach((task: any) => {
          const status = task.status || 'todo';
          if (!groupedTasks[status]) groupedTasks[status] = [];
          groupedTasks[status].push(task);
        });
        setTasks(groupedTasks);
        setKpis(kpiResponse);
        setAvailableTags(tagsResponse);
      } catch (err) {
        console.error('Fehler beim Laden der Aufgaben:', err);
        setError('Fehler beim Laden der Aufgaben. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [searchQuery, filters]);

  // Drag & Drop Handler
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn = source.droppableId;
    const destinationColumn = destination.droppableId;

    // Lokales State-Update für sofortige Benutzerrückmeldung
    if (sourceColumn === destinationColumn) {
      // Reorder within same column
      const column = [...tasks[sourceColumn]];
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);
      setTasks({ ...tasks, [sourceColumn]: column });
    } else {
      // Move to different column
      const sourceItems = [...tasks[sourceColumn]];
      const destItems = [...tasks[destinationColumn]];
      const [removed] = sourceItems.splice(source.index, 1);
      
      // Aktualisiere Status der Aufgabe
      const updatedTask = { ...removed, status: destinationColumn as TaskStatus };
      destItems.splice(destination.index, 0, updatedTask);
      
      setTasks({
        ...tasks,
        [sourceColumn]: sourceItems,
        [destinationColumn]: destItems
      });

      // API-Aufruf zum Aktualisieren des Status
      try {
        await updateTaskStatus(removed.id, destinationColumn as TaskStatus);
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Aufgabenstatus:', error);
        // Bei Fehler Änderungen rückgängig machen und Benutzer informieren
        setError('Fehler beim Aktualisieren des Aufgabenstatus. Bitte versuchen Sie es später erneut.');
      }
    }
  };

  const handleAITaskSuggestion = (suggestion: any) => {
    const taskTitle = suggestion.title || taskInput.title;
    const taskDescription = suggestion.description || taskInput.description;

    setCurrentTask({
      id: `task-${Date.now()}`,
      title: taskTitle,
      description: taskDescription,
      priority: suggestion.priority,
      assignee: {
        name: suggestion.assigneeRecommendation || 'Nicht zugewiesen',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      dueDate: suggestion.suggestedDeadline,
      status: 'todo',
      progress: 0,
      tags: [],
      attachments: [],
      comments: [],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsTaskModalOpen(true);
  };

  // Neue Aufgabe oder Update einer bestehenden Aufgabe
  const handleSaveTask = async (taskData: any) => {
    try {
      if (currentTask && currentTask.id) {
        // Bestehende Aufgabe aktualisieren
        const updatedTask = await updateTask(currentTask.id, taskData);
        
        // Aktualisiere den lokalen State
        setTasks(prevTasks => {
          const status = updatedTask.status;
          const updatedTasks = { ...prevTasks };
          
          // Entferne die alte Version der Aufgabe
          Object.keys(updatedTasks).forEach(col => {
            updatedTasks[col] = updatedTasks[col].filter(t => t.id !== updatedTask.id);
          });
          
          // Füge die aktualisierte Aufgabe hinzu
          if (!updatedTasks[status]) updatedTasks[status] = [];
          updatedTasks[status].push(updatedTask);
          
          return updatedTasks;
        });
      } else {
        // Neue Aufgabe erstellen
        const newTask = await createTask(taskData);
        
        // Aktualisiere den lokalen State
        setTasks(prevTasks => {
          const status = newTask.status;
          const updatedTasks = { ...prevTasks };
          if (!updatedTasks[status]) updatedTasks[status] = [];
          updatedTasks[status].push(newTask);
          return updatedTasks;
        });
      }
      
      setIsTaskModalOpen(false);
      setCurrentTask(null);
    } catch (error) {
      console.error('Fehler beim Speichern der Aufgabe:', error);
      setError('Fehler beim Speichern der Aufgabe. Bitte versuchen Sie es später erneut.');
    }
  };

  // Aufgabe löschen
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      
      // Aktualisiere den lokalen State
      setTasks(prevTasks => {
        const updatedTasks = { ...prevTasks };
        Object.keys(updatedTasks).forEach(col => {
          updatedTasks[col] = updatedTasks[col].filter(t => t.id !== taskId);
        });
        return updatedTasks;
      });
    } catch (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error);
      setError('Fehler beim Löschen der Aufgabe. Bitte versuchen Sie es später erneut.');
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* KPI-Leiste */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-800/50 border-b border-gray-700/50">
        <motion.div 
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-500/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Gesamtaufgaben</p>
              <p className="text-2xl font-bold text-white mt-1">{kpis.totalTasks}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <i className="ri-task-line text-xl text-blue-400"></i>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg p-4 border border-red-500/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Überfällig</p>
              <p className="text-2xl font-bold text-white mt-1">{kpis.overdueTasks}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <i className="ri-alarm-warning-line text-xl text-red-400"></i>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-500/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Ø Bearbeitungszeit</p>
              <p className="text-2xl font-bold text-white mt-1">{kpis.averageDuration}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <i className="ri-time-line text-xl text-purple-400"></i>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Erfolgsquote</p>
              <p className="text-2xl font-bold text-white mt-1">{kpis.successRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <i className="ri-line-chart-line text-xl text-green-400"></i>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter- und Suchleiste */}
      <div className="p-6 bg-gray-800/30 border-b border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Aufgaben suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <i className="ri-search-line absolute left-3 top-2.5 text-gray-400"></i>
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value as TaskPriority | 'all' })}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Prioritäten</option>
              <option value="hoch">Hoch</option>
              <option value="mittel">Mittel</option>
              <option value="niedrig">Niedrig</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as 'today' | 'week' | 'month' | 'all' })}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Zeiträume</option>
              <option value="today">Heute</option>
              <option value="week">Diese Woche</option>
              <option value="month">Dieser Monat</option>
            </select>

            <button
              onClick={() => setShowRules(!showRules)}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <i className="ri-settings-4-line mr-2"></i>
              Richtlinien
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'kanban' ? 'calendar' : 'kanban')}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <i className={`${viewMode === 'kanban' ? 'ri-calendar-line' : 'ri-layout-grid-line'} mr-2`}></i>
              {viewMode === 'kanban' ? 'Kalender' : 'Kanban'}
            </button>
          </div>
        </div>
      </div>

      {/* Gruppenrichtlinien */}
      {/* @ts-ignore */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gray-800/30 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Gruppenrichtlinien</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupRules.map(rule => (
                  <div 
                    key={rule.id}
                    className="p-4 rounded-lg border border-gray-700 bg-gray-800/50"
                  >
                    <div className="flex items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        rule.type === 'error' ? 'bg-red-500/20' : 'bg-amber-500/20'
                      }`}>
                        <i className={`ri-${rule.type === 'error' ? 'error-warning' : 'information'}-line text-${
                          rule.type === 'error' ? 'red' : 'amber'
                        }-400`}></i>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{rule.title}</h4>
                        <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
          {statusColumns.map(column => (
            <div key={column.id} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${column.color}`}></div>
                  <h3 className="text-white font-medium">{column.title}</h3>
                  <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                    {tasks[column.id]?.length || 0}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCurrentTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="ri-add-line"></i>
                </button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided: DroppableProvided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3 min-h-[200px]"
                  >
                    {tasks[column.id]?.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided: DraggableProvided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-gray-700/50 rounded-lg p-4 cursor-pointer hover:bg-gray-700/70 transition-all transform hover:scale-[1.02] animate-fadeIn"
                            onClick={() => {
                              setCurrentTask(task);
                              setIsTaskModalOpen(true);
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-white font-medium">{task.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                task.priority === 'hoch' 
                                  ? 'bg-red-500/20 text-red-400'
                                  : task.priority === 'mittel'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                              {task.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <img
                                  src={task.assignee.avatar}
                                  alt={task.assignee.name}
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                                <span className="text-sm text-gray-300">
                                  {task.assignee.name}
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-400">
                                <i className="ri-calendar-line mr-1"></i>
                                {task.dueDate}
                              </div>
                            </div>

                            {task.progress > 0 && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                  <span>Fortschritt</span>
                                  <span>{task.progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${task.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {task.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-gray-600/50 rounded-full text-xs text-gray-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Task Modal */}
      {/* @ts-ignore */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsTaskModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    {currentTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
                  </h3>
                  <button
                    onClick={() => setIsTaskModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <form className="space-y-4">
                  {/* Titel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Titel
                    </label>
                    <input
                      type="text"
                      defaultValue={currentTask?.title}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Aufgabentitel eingeben"
                    />
                  </div>

                  {/* Beschreibung */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Beschreibung
                    </label>
                    <textarea
                      defaultValue={currentTask?.description}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Detaillierte Beschreibung der Aufgabe"
                    ></textarea>
                  </div>

                  {/* Priorität und Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Priorität
                      </label>
                      <select
                        defaultValue={currentTask?.priority}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="hoch">Hoch</option>
                        <option value="mittel">Mittel</option>
                        <option value="niedrig">Niedrig</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        defaultValue={currentTask?.status}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {statusColumns.map(column => (
                          <option key={column.id} value={column.id}>
                            {column.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fälligkeitsdatum und Zuständiger */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Fälligkeitsdatum
                      </label>
                      <input
                        type="date"
                        defaultValue={currentTask?.dueDate}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Zuständig
                      </label>
                      <select
                        defaultValue={currentTask?.assignee.name}
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="user1">Max Mustermann</option>
                        <option value="user2">Anna Schmidt</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Marketing', 'Kaltakquise', 'Follow-up'].map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-700/50 rounded-full text-sm text-gray-300 cursor-pointer hover:bg-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Datei-Anhänge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Datei-Anhänge
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                      <i className="ri-upload-cloud-line text-2xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-400">
                        Dateien hierher ziehen oder klicken zum Auswählen
                      </p>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  {currentTask ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KI-Assistent */}
      <AIAssistant onSuggestTask={handleAITaskSuggestion} />
    </motion.div>
  );
});

export default TasksBoard; 
