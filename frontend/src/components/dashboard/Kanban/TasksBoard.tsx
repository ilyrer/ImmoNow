import React, { useState, forwardRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { AIAssistant } from './AIAssistant';
import { AITaskSuggestion } from '../../../services/ai.service';
import TaskModal from './TaskModal';
import { 
  useTasks, 
  useCreateTask, 
  useUpdateTask
} from '../../../api/hooks';
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
}

interface TaskAssignee {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

const TasksBoard = forwardRef<any>((props, ref) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // API Hooks
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  
  // Mock data for missing hooks
  const defaultColumnsMap = { status_to_column: {} };
  const taskBoardData = null;
  const employeesData = [];

  // Map UI status id to backend enum
  const toBackendStatus = useCallback((status: RealEstateTask['status']): string => (
    status === 'inProgress' ? 'in_progress' : status
  ), []);

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
    if (!employeesData || !Array.isArray(employeesData)) {
      return [];
    }
    return employeesData.map((employee: any) => ({
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
      status: apiTask.status || 'todo',
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
      effortScore: apiTask.effort_score || 0
    };
  }, []);

  // Transform tasks data
  const tasks = useMemo(() => {
    if (tasksLoading || !tasksData) {
      return [];
    }

    // Handle different data structures
    let tasksArray: any[] = [];
    
    if (Array.isArray(tasksData)) {
      tasksArray = tasksData;
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

    const newStatus = destination.droppableId as RealEstateTask['status'];
    // Map UI status to backend status enum and resolve column
    const backendStatus = toBackendStatus(newStatus);
    const targetColumnId = statusToColumnId[backendStatus];
    // Persist status via update endpoint (ensures backend reflects column change)
    updateTaskMutation.mutate({ id: draggableId, data: { status: backendStatus } as any });
  }, [updateTaskMutation, statusToColumnId, toBackendStatus]);

  const createNewTask = (): RealEstateTask => {
    const now = new Date();
    const newId = `RE-${Date.now()}`;
    
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
      status: 'todo',
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
      effortScore: 0
    };
  };

  const handleTaskSave = (task: RealEstateTask) => {
    if (!task.id || task.id.startsWith('RE-')) {
      // Create new task
      const apiTask = {
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
        progress: task.progress,
        tags: task.tags,
        estimated_hours: task.estimatedHours,
        actual_hours: task.actualHours,
        property_type: task.propertyType,
        location: task.location,
        price: task.price,
        labels: task.labels,
        issue_type: task.issueType,
        client_id: task.clientId,
        property_id: task.propertyId,
        complexity: task.complexity,
        impact_score: task.impactScore,
        effort_score: task.effortScore
      };
      
      createTaskMutation.mutate(apiTask as any);
    } else {
      // Update existing task
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
        progress: task.progress,
        tags: task.tags,
        estimated_hours: task.estimatedHours,
        actual_hours: task.actualHours,
        property_type: task.propertyType,
        location: task.location,
        price: task.price,
        labels: task.labels,
        issue_type: task.issueType,
        client_id: task.clientId,
        property_id: task.propertyId,
        complexity: task.complexity,
        impact_score: task.impactScore,
        effort_score: task.effortScore
      };
      
      updateTaskMutation.mutate({ id: task.id, data: apiTask as any });
    }
  };

  const markSelectedTasksAsDone = () => {
    selectedTasks.forEach(taskId => {
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
    const backendStatus = toBackendStatus(newStatus);
    updateTaskMutation.mutate({ id: taskId, data: { status: backendStatus } as any });
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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Tasks Board
        </h1>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Task columns would go here */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">To Do</h3>
              <div className="space-y-2">
                {tasks.filter(task => task.status === 'todo').map(task => (
                  <div key={task.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                    <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
});

TasksBoard.displayName = 'TasksBoard';

export default TasksBoard;