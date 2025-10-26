import React, { useState, forwardRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQueryClient } from '@tanstack/react-query';
import { AIAssistant } from './AIAssistant';
import { AITaskSuggestion } from '../../../services/ai.service';
import TaskModal from './TaskModal';
import type { RealEstateTask } from './TaskModal';
import { 
  useTasks, 
  useCreateTask, 
  useUpdateTask
} from '../../../api/hooks';
import { useEmployees, useLabels, useSprints } from '../../../hooks/useTasks';
import { Task } from '../../../types/kanban';

const TasksBoard = forwardRef<any>((props, ref) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RealEstateTask | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  // API Hooks
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const queryClient = useQueryClient();
  
  // Mock data for missing hooks
  const defaultColumnsMap = { status_to_column: {} };
  const taskBoardData = null;
  // Load employees data
  const { data: employeesData = [] } = useEmployees();
  const { data: labelsData = [] } = useLabels();
  const { data: sprintsData = [] } = useSprints();

  // Map backend status to frontend status
  const fromBackendStatus = useCallback((backendStatus: string): RealEstateTask['status'] => {
    const statusMap: Record<string, RealEstateTask['status']> = {
      'todo': 'backlog', // Backend 'todo' wird zu Frontend 'backlog'
      'in_progress': 'inProgress',
      'review': 'review',
      'done': 'done',
      'blocked': 'blocked',
      'backlog': 'backlog'
    };
    return statusMap[backendStatus] || 'backlog';
  }, []);

  // Map UI status id to backend enum
  const toBackendStatus = useCallback((status: RealEstateTask['status']): string => {
    const statusMap: Record<string, string> = {
      'backlog': 'backlog', // Frontend 'backlog' bleibt Backend 'backlog'
      'todo': 'backlog', // Alte 'todo' wird zu 'backlog'
      'inProgress': 'in_progress',
      'thisWeek': 'in_progress', // thisWeek maps to in_progress
      'review': 'review',
      'done': 'done',
      'blocked': 'blocked',
      'onHold': 'blocked',
      'cancelled': 'blocked'
    };
    return statusMap[status] || 'backlog';
  }, []);

  // Status to column ID mapping
  const statusToColumnId: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    const serverMap = (defaultColumnsMap as any)?.status_to_column as Record<string, number> | undefined;
    
    if (serverMap && Object.keys(serverMap).length > 0) {
      Object.assign(map, serverMap);
    } else if (taskBoardData && typeof taskBoardData === 'object') {
      Object.entries(taskBoardData as any).forEach(([key, list]: [string, any]) => {
        if (Array.isArray(list) && list.length > 0) {
          map[key] = parseInt(key) || 0;
        }
      });
    }
    
    return map;
  }, [taskBoardData, defaultColumnsMap]);

  // Transform employees data
  const employees = useMemo(() => {
    const list = Array.isArray(employeesData) ? employeesData : (employeesData as any)?.items;
    if (!list || !Array.isArray(list)) return [];
    return list.map((employee: any) => ({
      id: employee.id,
      name: employee.name,
      avatar: employee.avatar || '/default-avatar.png',
      role: employee.role || 'Developer'
    }));
  }, [employeesData]);

  // Transform API tasks to component format
  const transformApiTaskToComponent = useCallback((apiTask: any): RealEstateTask => {
    return {
      id: apiTask.id,
      title: apiTask.title,
      description: apiTask.description || '',
      priority: apiTask.priority || 'medium',
      assignee: {
        name: apiTask.assignee?.name || 'Unassigned',
        avatar: apiTask.assignee?.avatar || '/default-avatar.png',
        id: apiTask.assignee?.id || '',
        role: apiTask.assignee?.role || 'Developer'
      },
      dueDate: apiTask.due_date || new Date().toISOString(),
      status: fromBackendStatus(apiTask.status) || 'todo',
      progress: apiTask.progress || 0,
      tags: apiTask.tags || [],
      estimatedHours: apiTask.estimated_hours || 0,
      actualHours: apiTask.actual_hours || 0,
      propertyType: apiTask.property_type,
      location: apiTask.location,
      price: apiTask.price,
      labels: apiTask.labels || [],
      attachments: apiTask.attachments || [],
      comments: apiTask.comments || [],
      subtasks: apiTask.subtasks || [],
      createdAt: apiTask.created_at || new Date().toISOString(),
      updatedAt: apiTask.updated_at || new Date().toISOString(),
      reporter: apiTask.reporter || '',
      watchers: apiTask.watchers || [],
      issueType: apiTask.issue_type || 'listing',
      clientId: apiTask.client_id,
      propertyId: apiTask.property_id,
      complexity: apiTask.complexity || 'medium',
      impactScore: apiTask.impact_score || 0,
      effortScore: apiTask.effort_score || 0,
      dependencies: apiTask.dependencies || [],
      blocking: apiTask.blocking || [],
      customFields: apiTask.customFields || {},
      // Sprint mapping (optional)
      ...(apiTask.sprint ? { sprint: { id: apiTask.sprint.id, name: apiTask.sprint.name, status: apiTask.sprint.status } } : {}),
      // Backend-specific fields
      position: apiTask.position || 0,
      createdBy: {
        id: apiTask.created_by?.id || '',
        name: apiTask.created_by?.name || 'System',
        avatar: apiTask.created_by?.avatar || '/default-avatar.png',
        role: apiTask.created_by?.role || 'System'
      },
      archived: apiTask.archived || false,
      blockedReason: apiTask.blocked_reason,
      blockedByTask: apiTask.blocked_by_task,
      epicLink: apiTask.epic_link,
      financingStatus: apiTask.financing_status,
      startDate: apiTask.start_date
    };
  }, [fromBackendStatus]);

  // Transform tasks data
  const tasks = useMemo(() => {
    if (tasksLoading || !tasksData) {
      return [];
    }

    // Handle different data structures
    let tasksArray: any[] = [];

    if (Array.isArray(tasksData)) {
      tasksArray = tasksData;
    } else if ((tasksData as any)?.items) {
      tasksArray = (tasksData as any).items;
    } else if (taskBoardData) {
      Object.entries(taskBoardData).forEach(([status, taskList]) => {
        if (Array.isArray(taskList)) {
          tasksArray.push(...taskList);
        }
      });
    }

    return tasksArray.map(transformApiTaskToComponent);
  }, [taskBoardData, tasksData, transformApiTaskToComponent]);

  // Handle drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Ignore temporary tasks (not yet persisted, non-UUID)
    if (String(draggableId).startsWith('TEMP-')) {
      console.log('Ignoring drag for temporary task:', draggableId);
      return;
    }

    const newStatus = destination.droppableId as RealEstateTask['status'];
    const newPosition = destination.index;
    
    // Map UI status to backend status enum and resolve column
    const backendStatus = toBackendStatus(newStatus);
    const targetColumnId = statusToColumnId[backendStatus];
    
    // Calculate position based on cursor position
    const targetColumnTasks = tasksData?.items?.filter(task => toBackendStatus(task.status as any) === backendStatus) || [];
    const actualPosition = Math.min(newPosition, targetColumnTasks.length);
    
    // Persist status and position via update endpoint
    console.log('Updating task:', draggableId, 'to status:', backendStatus, 'position:', actualPosition);
    console.log('Mutation payload:', { id: draggableId, data: { status: backendStatus, position: actualPosition } });
    
    // Try to update the task
    try {
      updateTaskMutation.mutate({ 
        id: draggableId, 
        data: { 
          status: backendStatus,
          position: actualPosition
        } as any 
      }, {
        onSuccess: () => {
          console.log('Task updated successfully:', draggableId, backendStatus, actualPosition);
          // Invalidate and refetch tasks data
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: (error) => {
          console.error('Failed to update task:', error);
        }
      });
    } catch (error) {
      console.error('Error in mutation:', error);
    }
  }, [updateTaskMutation, statusToColumnId, toBackendStatus, tasksData, queryClient]);

  const createNewTask = (): RealEstateTask => {
    const now = new Date();
    const newId = `TEMP-${Date.now()}`; // Temporäre ID für Frontend-only
    
    return {
      id: newId,
      title: 'New Task',
      description: '',
      priority: 'medium',
      assignee: {
        name: 'Unassigned',
        avatar: '/default-avatar.png',
        id: '',
        role: 'Developer'
      },
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'backlog',
      progress: 0,
      tags: [],
      estimatedHours: 0,
      actualHours: 0,
      labels: [],
      attachments: [],
      comments: [],
      subtasks: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      reporter: '',
      watchers: [],
      issueType: 'listing',
      complexity: 'medium',
      impactScore: 0,
      effortScore: 0,
      dependencies: [],
      blocking: [],
      customFields: {},
      // Backend-specific fields
      position: 0,
      createdBy: {
        id: '',
        name: 'System',
        avatar: '/default-avatar.png',
        role: 'System'
      },
      archived: false,
      blockedReason: undefined,
      blockedByTask: undefined,
      epicLink: undefined,
      financingStatus: undefined,
      startDate: undefined
    };
  };

  const markSelectedTasksAsDone = () => {
    selectedTasks.forEach(taskId => {
      // Ignore temporary tasks
      if (String(taskId).startsWith('TEMP-')) {
        console.log('Ignoring bulk action for temporary task:', taskId);
        return;
      }
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const apiTask = {
          status: 'done',
          progress: 100
        };
        
        updateTaskMutation.mutate({ id: taskId, data: apiTask as any });
      }
    });
    
    setSelectedTasks([]);
    setShowBulkActions(false);
  };

  const deleteTask = (taskId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete task:', taskId);
  };

  const moveTaskToColumn = (taskId: string, newStatus: RealEstateTask['status']) => {
    // Ignore temporary tasks
    if (String(taskId).startsWith('TEMP-')) {
      console.log('Ignoring move for temporary task:', taskId);
      return;
    }
    
    const backendStatus = toBackendStatus(newStatus);
    updateTaskMutation.mutate({ id: taskId, data: { status: backendStatus } as any });
  };

  // Task Modal handlers
  const handleTaskClick = (task: RealEstateTask) => {
    setSelectedTask(task);
    setModalMode('view');
    setShowTaskModal(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setModalMode('create');
    setShowTaskModal(true);
  };

  const handleTaskSave = (task: RealEstateTask) => {
    // Map UI task to backend payload
    const payload: any = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: toBackendStatus(task.status),
      due_date: task.dueDate,
      start_date: task.startDate || undefined,
      assignee_id: (task.assignee?.id && task.assignee.id.trim() !== '') ? task.assignee.id : undefined,
      label_ids: (task.labels || []).map(l => l.id),
      tags: task.tags || [],
      estimated_hours: task.estimatedHours || 0,
      actual_hours: task.actualHours || 0,
      position: task.position || 0,
      property_id: task.propertyId || undefined,
      dependencies: task.dependencies || [],
      blocking: task.blocking || [],
      custom_fields: task.customFields || {},
      story_points: task.storyPoints ?? undefined,
      sprint_id: task.sprint?.id || undefined,
      watcher_ids: Array.isArray(task.watchers) ? (task.watchers as any[]).map(w => typeof w === 'string' ? w : w.id) : [],
      // Backend-specific fields
      archived: task.archived || false,
      blocked_reason: task.blockedReason || undefined,
      blocked_by_task_id: task.blockedByTask || undefined,
      epic_link: task.epicLink || undefined,
      financing_status: task.financingStatus || undefined,
      issue_type: task.issueType || 'task'
    };

    if (modalMode === 'create') {
      createTaskMutation.mutate(payload);
    } else if (modalMode === 'edit') {
      updateTaskMutation.mutate({ id: task.id, data: payload });
    }
    setShowTaskModal(false);
  };

  const handleTaskClose = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  // Loading state
  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="px-6 py-5 bg-white/20 dark:bg-white/5 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg flex items-center justify-center">
              <span className="text-white text-lg">📋</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Professional Task Board</h1>
              <p className="text-xs text-gray-600/80 dark:text-gray-400">Enterprise Task Management System</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">Aktiv</span>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">Live</span>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max pb-4">
            {/* To Do Column */}
            <Droppable droppableId="backlog">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-xl p-3 border transition-colors duration-200 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/40 dark:border-gray-700/50 w-[280px] flex-shrink-0 ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400/40' : ''}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Backlog</h3>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{tasks.filter(t => t.status === 'backlog').length}</span>
                    </div>
                    <button
                      onClick={handleCreateTask}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors shadow-sm"
                    >
                      + Neu
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {tasks.filter(task => task.status === 'backlog').map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2.5 rounded-lg cursor-move transition-all ${snapshot.isDragging ? 'shadow-xl bg-white dark:bg-gray-700' : 'bg-white/70 dark:bg-gray-700/70'} border border-gray-200/60 dark:border-gray-700/60 hover:shadow-md`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{task.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{task.description}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {tasks.filter(task => task.status === 'backlog').length === 0 && (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <div className="w-8 h-8 mx-auto mb-2 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm">➕</div>
                        <p className="text-xs">Keine Aufgaben</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>

            {/* In Progress Column */}
            <Droppable droppableId="inProgress">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-xl p-3 border transition-colors duration-200 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/40 dark:border-gray-700/50 w-[280px] flex-shrink-0 ${snapshot.isDraggingOver ? 'ring-2 ring-yellow-400/40' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">In Arbeit</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{tasks.filter(t => t.status === 'inProgress').length}</span>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {tasks.filter(task => task.status === 'inProgress').map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2.5 rounded-lg cursor-move transition-all ${snapshot.isDragging ? 'shadow-xl bg-white dark:bg-gray-700' : 'bg-white/70 dark:bg-gray-700/70'} border border-gray-200/60 dark:border-gray-700/60 hover:shadow-md`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{task.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{task.description}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Review Column */}
            <Droppable droppableId="review">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-xl p-3 border transition-colors duration-200 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/40 dark:border-gray-700/50 w-[280px] flex-shrink-0 ${snapshot.isDraggingOver ? 'ring-2 ring-purple-400/40' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Überprüfung</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{tasks.filter(t => t.status === 'review').length}</span>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {tasks.filter(task => task.status === 'review').map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2.5 rounded-lg cursor-move transition-all ${snapshot.isDragging ? 'shadow-xl bg-white dark:bg-gray-700' : 'bg-white/70 dark:bg-gray-700/70'} border border-gray-200/60 dark:border-gray-700/60 hover:shadow-md`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{task.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{task.description}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Done Column */}
            <Droppable droppableId="done">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-xl p-3 border transition-colors duration-200 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/40 dark:border-gray-700/50 w-[280px] flex-shrink-0 ${snapshot.isDraggingOver ? 'ring-2 ring-green-400/40' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Erledigt</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{tasks.filter(t => t.status === 'done').length}</span>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {tasks.filter(task => task.status === 'done').map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-3 border-green-500 cursor-move ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                          >
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white line-through opacity-75">
                              {task.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-through opacity-75 line-clamp-2 mt-1">
                              {task.description}
                            </p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Blocked Column */}
            <Droppable droppableId="blocked">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-xl p-3 border transition-colors duration-200 shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/40 dark:border-gray-700/50 w-[280px] flex-shrink-0 ${snapshot.isDraggingOver ? 'ring-2 ring-red-400/40' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Blockiert</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{tasks.filter(t => t.status === 'blocked').length}</span>
                  </div>
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {tasks.filter(task => task.status === 'blocked').map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-3 border-red-500 cursor-move ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            onClick={() => handleTaskClick(task)}
                          >
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{task.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{task.description}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </div>
      
      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        task={selectedTask}
        mode={modalMode}
        onClose={handleTaskClose}
        onSave={handleTaskSave}
        teamMembers={employees}
        availableLabels={labelsData}
        availableSprints={sprintsData}
        currentUserId="current-user-id"
      />
    </div>
  );
});

TasksBoard.displayName = 'TasksBoard';

export default TasksBoard;