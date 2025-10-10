import React, { useState, forwardRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { AIAssistant } from './AIAssistant';
import { AITaskSuggestion } from '../../../services/ai.service';
import TaskModal from './TaskModal';
import { 
  useTaskBoard, 
  useTasks, 
  useCreateTask, 
  useUpdateTask, 
  useMoveTask, 
  useDeleteTask,
  useEmployees, 
  useDefaultBoardColumnsMap
} from '../../../hooks/useApi';
import { Task } from '../../../types/kanban';

export interface RealEstateTask {
  id: string;
  title: string;
  description: string;
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  assignee: {
    name: string;
    avatar: string;
    id: string;
    role: string;
  };
  dueDate: string;
  status: 'backlog' | 'todo' | 'inProgress' | 'review' | 'done' | 'blocked' | 'onHold' | 'cancelled';
  progress: number;
  tags: string[];
  estimatedHours: number;
  actualHours: number;
  propertyType?: 'apartment' | 'house' | 'commercial' | 'land';
  location?: string;
  price?: number;
  labels: { id: string; name: string; color: string; }[];
  attachments: any[];
  comments: any[];
  subtasks: any[];
  createdAt: string;
  updatedAt: string;
  reporter: string;
  watchers: TaskAssignee[] | string[];
  issueType: 'listing' | 'viewing' | 'contract' | 'maintenance' | 'marketing';
  clientId?: string;
  propertyId?: string;
  complexity: 'trivial' | 'easy' | 'medium' | 'hard' | 'epic';
  impactScore: number;
  effortScore: number;
  dependencies: string[];
  blockedBy?: string;
  blocking: string[];
  customFields: Record<string, any>;
}

interface TaskAssignee {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

interface TaskModal {
  isOpen: boolean;
  task: RealEstateTask | null;
  mode: 'view' | 'edit' | 'create';
}

const TasksBoard = forwardRef<any>((props, ref) => {
  const [currentView, setCurrentView] = useState<'roadmap' | 'backlog' | 'board' | 'reports' | 'properties' | 'clients' | 'analytics' | 'settings'>('board');
  const [isDarkMode] = useState(true);
  const [taskModal, setTaskModal] = useState<TaskModal>({ isOpen: false, task: null, mode: 'view' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPropertyType, setFilterPropertyType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // API Hooks
  const { data: taskBoardData, isLoading: taskBoardLoading, error: taskBoardError } = useTaskBoard();
  const { data: defaultColumnsMap } = useDefaultBoardColumnsMap();
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: employeesData } = useEmployees();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const moveTaskMutation = useMoveTask();
  const deleteTaskMutation = useDeleteTask();

  // Map UI status id to backend enum
  const toBackendStatus = useCallback((status: RealEstateTask['status']): string => (
    status === 'inProgress' ? 'in_progress' : status
  ), []);

  // Build status -> column_id mapping from backend mapping endpoint with fallback to board payload heuristic
  const statusToColumnId = useMemo(() => {
    const map: Record<string, number> = {};
    // Preferred: backend-provided mapping
    const serverMap = (defaultColumnsMap as any)?.status_to_column as Record<string, number> | undefined;
    if (serverMap && typeof serverMap === 'object') {
      Object.entries(serverMap).forEach(([k, v]) => {
        if (typeof v === 'number') map[k] = v;
      });
    }
    // Fallback: infer from first item per list
    if (Object.keys(map).length === 0 && taskBoardData && typeof taskBoardData === 'object') {
      Object.entries(taskBoardData as any).forEach(([key, list]: [string, any]) => {
        if (Array.isArray(list) && list.length > 0) {
          const backendKey = key === 'inProgress' ? 'in_progress' : key;
          const colId = (list[0] as any)?.column_id;
          if (typeof colId === 'number') map[backendKey] = colId;
        }
      });
    }
    return map;
  }, [taskBoardData, defaultColumnsMap]);

  // Transform API employees to team members format
  const teamMembers = useMemo(() => {
    if (!employeesData || !Array.isArray(employeesData)) {
      return [];
    }

    return employeesData.map((employee: any) => ({
      id: employee.id,
      name: employee.name || `${employee.first_name} ${employee.last_name}`,
      avatar: employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=random`,
      role: employee.position || 'Mitarbeiter'
    }));
  }, [employeesData]);

  // Transform API tasks to component format
  const transformApiTaskToComponent = useCallback((apiTask: Task): RealEstateTask => {
    // Find assignee details
    const assigneeDetails = teamMembers.find(member => member.id === apiTask.assignee?.id) || {
      id: apiTask.assignee?.id || '',
      name: apiTask.assignee?.name || 'Unzugewiesen',
      avatar: apiTask.assignee?.avatar || 'https://ui-avatars.com/api/?name=U&background=random',
      role: apiTask.assignee?.role || 'Mitarbeiter'
    };

    return {
      id: apiTask.id,
      title: apiTask.title,
  description: apiTask.description || '',
  priority: (apiTask.priority || 'medium') as any,
      assignee: assigneeDetails,
      dueDate: apiTask.due_date || new Date().toISOString().split('T')[0],
      status: apiTask.status,
  progress: apiTask.progress ?? 0,
      tags: apiTask.tags || [],
  estimatedHours: apiTask.estimated_hours ?? 0,
  actualHours: apiTask.actual_hours ?? 0,
      propertyType: apiTask.property_type,
      location: apiTask.location,
      price: apiTask.price,
      labels: apiTask.labels || [],
      attachments: apiTask.attachments || [],
      comments: apiTask.comments || [],
      subtasks: apiTask.subtasks || [],
  createdAt: apiTask.created_at || new Date().toISOString(),
  updatedAt: apiTask.updated_at || new Date().toISOString(),
  reporter: apiTask.reporter || 'system',
      watchers: apiTask.watchers || [],
  issueType: (apiTask.issue_type || 'listing') as any,
      clientId: apiTask.client_id,
      propertyId: apiTask.property_id,
  complexity: (apiTask.complexity || 'medium') as any,
  impactScore: apiTask.impact_score ?? 0,
  effortScore: apiTask.effort_score ?? 0,
      dependencies: apiTask.dependencies || [],
      blockedBy: apiTask.blocked_by,
      blocking: apiTask.blocking || [],
      customFields: apiTask.custom_fields || {}
    };
  }, [teamMembers]);

  // Process tasks from API or use taskBoard data
  const tasks = useMemo((): Record<string, RealEstateTask[]> => {
    const defaultTasks: Record<string, RealEstateTask[]> = {
      backlog: [],
      todo: [],
      inProgress: [],
      review: [],
      done: [],
      blocked: []
    };
    
    if (tasksData && Array.isArray(tasksData)) {
      // If we have direct tasks data, organize by status
      const organizedTasks = { ...defaultTasks };

      tasksData.forEach((apiTask: Task) => {
        const transformedTask = transformApiTaskToComponent(apiTask);
        const status = transformedTask.status;
        if (organizedTasks[status]) {
          organizedTasks[status].push(transformedTask);
        }
      });

      return organizedTasks;
    } else if (taskBoardData) {
      // Transform taskBoard data
      const transformedTaskBoard = { ...defaultTasks };
      
      Object.entries(taskBoardData).forEach(([status, taskList]) => {
        if (Array.isArray(taskList) && transformedTaskBoard[status]) {
          transformedTaskBoard[status] = taskList.map((apiTask: Task) => 
            transformApiTaskToComponent(apiTask)
          );
        }
      });

      return transformedTaskBoard;
    }

    return defaultTasks;
  }, [taskBoardData, tasksData, transformApiTaskToComponent]);

  // Debug logging
  console.log('📋 TasksBoard - Debug Info:', {
    taskBoardData,
    tasksData,
    transformedTasks: tasks,
    taskBoardLoading,
    tasksLoading,
    teamMembers,
    taskBoardError
  });

  const statusColumns = [
    { id: 'todo', title: 'ZU ERLEDIGEN', count: tasks.todo.length, color: '#6B7280', icon: '📋', gradient: 'from-gray-500 to-gray-600' },
    { id: 'inProgress', title: 'IN BEARBEITUNG', count: tasks.inProgress.length, color: '#3B82F6', icon: '⚡', gradient: 'from-blue-500 to-blue-600' },
    { id: 'review', title: 'ÜBERPRÜFUNG', count: tasks.review.length, color: '#F59E0B', icon: '👁️', gradient: 'from-amber-500 to-orange-600' },
    { id: 'done', title: 'ABGESCHLOSSEN', count: tasks.done.length, color: '#10B981', icon: '✅', gradient: 'from-green-500 to-emerald-600' }
  ];

  const availableLabels = [
    { id: 'urgent', name: 'URGENT', color: '#FF4757' },
    { id: 'marketing', name: 'MARKETING', color: '#FF6B6B' },
    { id: 'documentation', name: 'DOCS', color: '#4ECDC4' },
    { id: 'viewing', name: 'VIEWING', color: '#45B7D1' },
    { id: 'commercial', name: 'COMMERCIAL', color: '#96CEB4' },
    { id: 'contract', name: 'CONTRACT', color: '#F39C12' },
    { id: 'legal', name: 'LEGAL', color: '#E74C3C' },
    { id: 'digital', name: 'DIGITAL', color: '#9B59B6' },
    { id: 'maintenance', name: 'MAINTENANCE', color: '#FFA726' },
    { id: 'valuation', name: 'VALUATION', color: '#26A69A' },
    { id: 'feedback', name: 'FEEDBACK', color: '#FFAB00' },
    { id: 'client', name: 'CLIENT', color: '#42A5F5' },
    { id: 'sold', name: 'SOLD', color: '#4CAF50' },
    { id: 'success', name: 'SUCCESS', color: '#8BC34A' },
    { id: 'priority', name: 'PRIORITY', color: '#FF5722' },
    { id: 'followup', name: 'FOLLOW-UP', color: '#795548' }
  ];

  // Handle drag end with API call
  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move task via API
    const newStatus = destination.droppableId as RealEstateTask['status'];
    // Map UI status to backend status enum and resolve column
    const backendStatus = toBackendStatus(newStatus);
    const targetColumnId = statusToColumnId[backendStatus];
    // Persist status via update endpoint (ensures backend reflects column change)
    updateTaskMutation.mutate({ id: draggableId, task: { status: backendStatus } as any });
    // Also send position for ordering; include column_id when known for cross-column move
    moveTaskMutation.mutate(
      targetColumnId ? { taskId: draggableId, column_id: targetColumnId, position: destination.index } : { taskId: draggableId, newStatus, position: destination.index },
      {
        onSuccess: () => {
          console.log(`✅ Task ${draggableId} moved to ${newStatus}`);
        },
        onError: (error) => {
          console.error('❌ Error moving task:', error);
        }
      }
    );
  }, [moveTaskMutation, updateTaskMutation, statusToColumnId, toBackendStatus]);

  const createNewTask = (): RealEstateTask => {
    const now = new Date();
    const newId = `RE-${Date.now()}`;
    
    return {
      id: newId,
      title: 'Neue Aufgabe',
      description: '',
      priority: 'medium',
      assignee: teamMembers[0] || { id: '', name: 'Unzugewiesen', avatar: '', role: '' },
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'todo',
      progress: 0,
      tags: [],
      estimatedHours: 4,
      actualHours: 0,
      propertyType: 'apartment',
      location: 'München, Schwabing',
      price: 0,
      labels: [],
      attachments: [],
      comments: [],
      subtasks: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      reporter: 'System',
      watchers: [],
      issueType: 'marketing',
      complexity: 'trivial',
      impactScore: 0,
      effortScore: 0,
      dependencies: [],
      blocking: [],
      customFields: {}
    };
  };

  const saveTask = (task: RealEstateTask) => {
    if (taskModal.mode === 'create') {
      // Transform to API format
      const apiTask: Partial<Task> = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignee: {
          id: task.assignee.id,
          name: task.assignee.name,
          avatar: task.assignee.avatar,
          role: task.assignee.role
        },
        due_date: task.dueDate,
        status: task.status,
        estimated_hours: task.estimatedHours,
        actual_hours: task.actualHours,
        property_type: task.propertyType,
        location: task.location,
        price: task.price,
        tags: task.tags,
        issue_type: task.issueType,
        property_id: task.propertyId,
        client_id: task.clientId,
        complexity: task.complexity,
        impact_score: task.impactScore,
        effort_score: task.effortScore
      };
      
      createTaskMutation.mutate(apiTask);
    } else {
      // Transform to API format for update
      const apiTask: Partial<Task> = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignee: {
          id: task.assignee.id,
          name: task.assignee.name,
          avatar: task.assignee.avatar,
          role: task.assignee.role
        },
        due_date: task.dueDate,
        status: task.status,
        estimated_hours: task.estimatedHours,
        actual_hours: task.actualHours,
        property_type: task.propertyType,
        location: task.location,
        price: task.price,
        tags: task.tags,
        issue_type: task.issueType,
        property_id: task.propertyId,
        client_id: task.clientId,
        complexity: task.complexity,
        impact_score: task.impactScore,
        effort_score: task.effortScore
      };
      
      updateTaskMutation.mutate({ id: task.id, task: apiTask });
    }
    setTaskModal({ isOpen: false, task: null, mode: 'view' });
  };

  const markSelectedTasksAsDone = () => {
    selectedTasks.forEach(taskId => {
      moveTaskMutation.mutate(
        { taskId, newStatus: 'done' },
        {
          onSuccess: () => {
            console.log(`✅ Task ${taskId} marked as done`);
          }
        }
      );
    });
    
    setSelectedTasks([]);
    setShowBulkActions(false);
  };

  const deleteSelectedTasks = () => {
    selectedTasks.forEach(taskId => {
      deleteTaskMutation.mutate(taskId, {
        onSuccess: () => {
          console.log(`✅ Task ${taskId} deleted`);
        }
      });
    });
    
    setSelectedTasks([]);
    setShowBulkActions(false);
  };

  const moveSelectedTasksTo = (targetStatus: RealEstateTask['status']) => {
    selectedTasks.forEach(taskId => {
      moveTaskMutation.mutate(
        { taskId, newStatus: targetStatus },
        {
          onSuccess: () => {
            console.log(`✅ Task ${taskId} moved to ${targetStatus}`);
          }
        }
      );
    });
    
    setSelectedTasks([]);
    setShowBulkActions(false);
  };

  const assignSelectedTasksTo = (assigneeId: string) => {
    selectedTasks.forEach(taskId => {
      // Find the assignee details
      const assignee = teamMembers.find(member => member.id === assigneeId);
      if (assignee) {
        const apiTask: Partial<Task> = {
          assignee: {
            id: assignee.id,
            name: assignee.name,
            avatar: assignee.avatar,
            role: assignee.role
          }
        };
        
        updateTaskMutation.mutate({ id: taskId, task: apiTask });
      }
    });
    
    setSelectedTasks([]);
    setShowBulkActions(false);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSelection = prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId];
      
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const selectAllTasks = () => {
    const allTaskIds = Object.values(tasks).flat().map(t => t.id);
    setSelectedTasks(allTaskIds);
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedTasks([]);
    setShowBulkActions(false);
    setBulkEditMode(false);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'highest': return '🔺';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔽';
      case 'lowest': return '⬇️';
      default: return '⚪';
    }
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'listing': return '🏠';
      case 'viewing': return '👁️';
      case 'contract': return '📄';
      case 'maintenance': return '🔧';
      case 'marketing': return '📢';
      default: return '📋';
    }
  };

  const getPropertyTypeIcon = (type?: string) => {
    switch (type) {
      case 'apartment': return '🏢';
      case 'house': return '🏡';
      case 'commercial': return '🏬';
      case 'land': return '🌍';
      default: return '🏠';
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const filteredTasks = (columnTasks: RealEstateTask[]) => {
    return columnTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (task.location && task.location.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesAssignee = filterAssignee === 'all' || task.assignee.id === filterAssignee;
      const matchesPropertyType = filterPropertyType === 'all' || task.propertyType === filterPropertyType;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      
      return matchesSearch && matchesAssignee && matchesPropertyType && matchesPriority;
    });
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex flex-col">
      {/* Portal container for drag previews */}
      <div id="drag-portal" style={{ position: 'fixed', top: 0, left: 0, zIndex: 10000, pointerEvents: 'none' }}></div>
      
      {/* Glasmorphism Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      {/* Enhanced Glasmorphism Header */}
      <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-b border-white/20 dark:border-white/10 px-6 py-4 shadow-glass relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-glass">
                <span className="text-white text-xl font-bold">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  Kanban Board
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Immobilien Task Management</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Stats with Glassmorphism */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 px-4 py-2 rounded-xl shadow-glass-sm">
                <span className="text-blue-500">⚡</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{Object.values(tasks).flat().filter(t => t.status !== 'done').length} Aktiv</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 px-4 py-2 rounded-xl shadow-glass-sm">
                <span className="text-emerald-500">✅</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tasks.done.length} Erledigt</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setBulkEditMode(!bulkEditMode);
                if (bulkEditMode) clearSelection();
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm border ${
                bulkEditMode 
                  ? 'bg-purple-500/80 text-white shadow-glass border-white/20' 
                  : 'bg-white/30 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/20 border-white/20 dark:border-white/10'
              }`}
            >
              {bulkEditMode ? '✕ Auswahl beenden' : '☑️ Mehrfachauswahl'}
            </button>
            
            <button 
              onClick={() => setTaskModal({ isOpen: true, task: createNewTask(), mode: 'create' })}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-glass hover:shadow-glass-lg backdrop-blur-sm border border-white/20"
            >
              <span className="text-lg">➕</span>
              Neue Aufgabe
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Glassmorphism Filters */}
      <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl border-b border-white/20 dark:border-white/10 px-6 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Enhanced Glassmorphism Search */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg">🔍</span>
              <input
                type="text"
                placeholder="Suchen nach Titel, Beschreibung, Standort..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white/30 dark:bg-white/10 border border-white/20 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 w-80 backdrop-blur-sm shadow-glass-sm"
              />
            </div>

            {/* Team Avatars with Enhanced Glassmorphism */}
            <div className="flex items-center space-x-1">
              {teamMembers.slice(0, 4).map((member, index) => (
                <div key={member.id} className="relative group">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full border-2 border-white/30 dark:border-white/20 shadow-glass transition-all duration-200 hover:border-blue-500/70 hover:scale-110 hover:shadow-glass-lg"
                    style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-white/20 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 text-gray-900 dark:text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-glass">
                    {member.name}
                  </div>
                </div>
              ))}
              <button className="w-10 h-10 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-medium shadow-glass ml-2 hover:bg-white/40 dark:hover:bg-white/20 transition-all">
                +{teamMembers.length - 4}
              </button>
            </div>

            {/* Enhanced Glassmorphism Filters */}
            <div className="flex items-center space-x-3">
              <select
                value={filterPropertyType}
                onChange={(e) => setFilterPropertyType(e.target.value)}
                className="px-4 py-2.5 bg-white/30 dark:bg-white/10 border border-white/20 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm shadow-glass-sm"
              >
                <option value="all">🏠 Alle Objekttypen</option>
                <option value="apartment">🏢 Wohnung</option>
                <option value="house">🏡 Haus</option>
                <option value="commercial">🏬 Gewerbe</option>
                <option value="land">🌍 Grundstück</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2.5 bg-white/30 dark:bg-white/10 border border-white/20 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm shadow-glass-sm"
              >
                <option value="all">⭐ Alle Prioritäten</option>
                <option value="highest">🔺 Höchste</option>
                <option value="high">🔴 Hoch</option>
                <option value="medium">🟡 Mittel</option>
                <option value="low">🔽 Niedrig</option>
              </select>
            </div>
          </div>

          {/* Enhanced Glassmorphism Bulk Actions */}
          <AnimatePresence>
            {showBulkActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="flex items-center space-x-3 bg-white/20 dark:bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/20 dark:border-white/10 shadow-glass"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500/20 dark:bg-blue-500/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{selectedTasks.length}</span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">ausgewählt</span>
                </div>
                
                <div className="w-px h-6 bg-white/20 dark:bg-white/10"></div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllTasks}
                    className="px-4 py-2 bg-blue-500/20 dark:bg-blue-500/30 hover:bg-blue-500/30 dark:hover:bg-blue-500/40 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 backdrop-blur-sm border border-white/20"
                  >
                    <span>☑️</span>
                    Alle auswählen
                  </button>
                  
                  <button
                    onClick={markSelectedTasksAsDone}
                    className="px-4 py-2 bg-emerald-500/20 dark:bg-emerald-500/30 hover:bg-emerald-500/30 dark:hover:bg-emerald-500/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 backdrop-blur-sm border border-white/20"
                  >
                    <span>✅</span>
                    Als erledigt markieren
                  </button>
                  
                  {/* Enhanced Move Dropdown */}
                  <div className="relative group">
                    <button className="px-4 py-2 bg-purple-500/20 dark:bg-purple-500/30 hover:bg-purple-500/30 dark:hover:bg-purple-500/40 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 backdrop-blur-sm border border-white/20">
                      <span>➡️</span>
                      Verschieben nach
                      <span>⬇️</span>
                    </button>
                    
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white/20 dark:bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 dark:border-white/10 shadow-glass opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        {[
                          { status: 'todo', label: 'Zu erledigen', icon: '📋', color: 'text-gray-600 dark:text-gray-400' },
                          { status: 'inProgress', label: 'In Bearbeitung', icon: '⚡', color: 'text-blue-600 dark:text-blue-400' },
                          { status: 'review', label: 'Überprüfung', icon: '👁️', color: 'text-amber-600 dark:text-amber-400' },
                          { status: 'done', label: 'Erledigt', icon: '✅', color: 'text-emerald-600 dark:text-emerald-400' }
                        ].map(item => (
                          <button
                            key={item.status}
                            onClick={() => moveSelectedTasksTo(item.status as RealEstateTask['status'])}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="w-px h-6 bg-white/20 dark:bg-white/10"></div>
                
                <button
                  onClick={clearSelection}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <span className="text-lg">❌</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full flex gap-6 p-6" style={{ position: 'relative' }}>
            {statusColumns.map(column => {
              const columnTasks = filteredTasks(tasks[column.id] || []);
              
              return (
                <div key={column.id} className="flex-1" style={{ position: 'relative' }}>
                  {/* Enhanced Glassmorphism Column Header */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-t-2xl shadow-glass p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${column.gradient} rounded-xl flex items-center justify-center shadow-glass`}>
                          <span className="text-xl">{column.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                            {column.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{columnTasks.length} Aufgaben</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setTaskModal({ isOpen: true, task: createNewTask(), mode: 'create' })}
                        className="p-2 bg-white/30 dark:bg-white/10 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg transition-all duration-200 shadow-glass-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300 text-lg">➕</span>
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Glassmorphism Column Content */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-b-2xl border-x border-b border-white/20 dark:border-white/10 p-4 space-y-4 transition-all duration-200 min-h-[500px] ${
                          snapshot.isDraggingOver 
                            ? 'bg-white/20 dark:bg-white/10 ring-2 ring-blue-400/50 ring-inset scale-[1.02] shadow-glass' 
                            : 'hover:bg-white/15 dark:hover:bg-white/8'
                        }`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                                className={`relative bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-xl p-4 transition-all duration-200 shadow-glass ${
                                  snapshot.isDragging 
                                    ? 'shadow-glass-lg border-blue-400/60 bg-white/50 dark:bg-white/15 scale-105 rotate-1' 
                                    : 'hover:shadow-glass-md hover:border-white/40 dark:hover:border-white/30 hover:bg-white/50 dark:hover:bg-white/15'
                                } ${selectedTasks.includes(task.id) ? 'ring-2 ring-blue-500/60 bg-blue-100/30 dark:bg-blue-900/20 border-blue-400/60' : ''}`}
                                onClick={(e) => {
                                  if (bulkEditMode) {
                                    e.preventDefault();
                                    toggleTaskSelection(task.id);
                                  } else {
                                    setTaskModal({ isOpen: true, task, mode: 'view' });
                                  }
                                }}
                              >
                                {/* Selection Checkbox - Glassmorphism Style */}
                                {bulkEditMode && (
                                  <div className="absolute top-3 left-3 z-10">
                                    <div className="w-6 h-6 bg-white/30 dark:bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 dark:border-white/30 flex items-center justify-center shadow-glass-sm">
                                      <input
                                        type="checkbox"
                                        checked={selectedTasks.includes(task.id)}
                                        onChange={() => toggleTaskSelection(task.id)}
                                        className="w-4 h-4 rounded border-0 bg-transparent text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className={`w-full ${bulkEditMode ? 'ml-8' : ''}`}>
                                  {/* Enhanced Task Header */}
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-white/30 dark:bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/20 dark:border-white/10">
                                      {task.id}
                                    </span>
                                  </div>

                                  {/* Enhanced Task Title */}
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-relaxed">
                                    {task.title}
                                  </h4>

                                  {/* Enhanced Property Info */}
                                  {(task.location || task.price) && (
                                    <div className="mb-3 p-2 bg-gray-700/30 rounded-lg">
                                      {task.location && (
                                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 mb-1">
                                          <span className="text-blue-500">📍</span>
                                          <span>{task.location}</span>
                                        </div>
                                      )}
                                      {task.price && (
                                        <div className="flex items-center space-x-2 text-xs">
                                          <span className="text-green-500">💰</span>
                                          <span className="font-semibold text-green-600 dark:text-green-400">{formatPrice(task.price)}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Enhanced Labels */}
                                  {task.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                      {task.labels.slice(0, 2).map(label => (
                                        <span
                                          key={label.id}
                                          className="px-2 py-1 text-xs font-medium rounded-lg text-white shadow-sm"
                                          style={{ backgroundColor: label.color }}
                                        >
                                          {label.name}
                                        </span>
                                      ))}
                                      {task.labels.length > 2 && (
                                        <span className="px-2 py-1 text-xs rounded-lg bg-white/30 dark:bg-white/20 text-gray-700 dark:text-gray-300 backdrop-blur-sm border border-white/20 dark:border-white/10">
                                          +{task.labels.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Enhanced Progress Bar - Glassmorphism Style */}
                                  {task.progress > 0 && (
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Fortschritt</span>
                                        <span className="text-gray-800 dark:text-gray-300 font-medium">{task.progress}%</span>
                                      </div>
                                      <div className="w-full h-2 bg-white/30 dark:bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/20 dark:border-white/10">
                                        <div 
                                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 shadow-glass-sm"
                                          style={{ width: `${task.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Enhanced Task Footer - Glassmorphism Style */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <img
                                        src={task.assignee.avatar}
                                        alt={task.assignee.name}
                                        className="w-7 h-7 rounded-full border-2 border-white/30 dark:border-white/20 shadow-glass-sm"
                                      />
                                      <span className="text-xs text-gray-700 dark:text-gray-400 font-medium">{task.assignee.name}</span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-500">
                                      {task.comments.length > 0 && (
                                        <div className="flex items-center space-x-1 bg-white/30 dark:bg-white/20 px-2 py-1 rounded backdrop-blur-sm border border-white/20 dark:border-white/10">
                                          <span>💬</span>
                                          <span className="text-gray-700 dark:text-gray-300">{task.comments.length}</span>
                                        </div>
                                      )}
                                      {task.attachments.length > 0 && (
                                        <div className="flex items-center space-x-1 bg-white/30 dark:bg-white/20 px-2 py-1 rounded backdrop-blur-sm border border-white/20 dark:border-white/10">
                                          <span>📎</span>
                                          <span className="text-gray-700 dark:text-gray-300">{task.attachments.length}</span>
                                        </div>
                                      )}
                                      {task.subtasks.length > 0 && (
                                        <div className="flex items-center space-x-1 bg-white/30 dark:bg-white/20 px-2 py-1 rounded backdrop-blur-sm border border-white/20 dark:border-white/10">
                                          <span>✅</span>
                                          <span className="text-gray-700 dark:text-gray-300">{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                                        </div>
                                      )}
                                      <div className="bg-blue-100/60 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold px-2 py-1 rounded backdrop-blur-sm border border-blue-200/40 dark:border-blue-400/30">
                                        {task.estimatedHours}h
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Enhanced Glassmorphism Empty State */}
                        {columnTasks.length === 0 && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-gray-600 dark:text-gray-500"
                          >
                            <div className="text-6xl mb-4 opacity-50">{column.icon}</div>
                            <p className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-300">Keine Aufgaben</p>
                            <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">Ziehe Aufgaben hierher oder erstelle eine neue</p>
                            <button 
                              onClick={() => setTaskModal({ isOpen: true, task: createNewTask(), mode: 'create' })}
                              className="px-4 py-2 bg-blue-100/60 dark:bg-blue-600/20 hover:bg-blue-200/60 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm transition-all backdrop-blur-sm border border-blue-200/40 dark:border-blue-400/30 shadow-glass-sm"
                            >
                              Erste Aufgabe erstellen
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Enhanced Task Modal */}
      <TaskModal
        isOpen={taskModal.isOpen}
        task={taskModal.task}
        mode={taskModal.mode}
        onClose={() => setTaskModal({ isOpen: false, task: null, mode: 'view' })}
        onSave={saveTask}
        teamMembers={teamMembers}
        availableLabels={availableLabels}
      />

      <AIAssistant onSuggestTask={(suggestion: AITaskSuggestion) => {}} />
    </div>
  );
});

export default TasksBoard;
