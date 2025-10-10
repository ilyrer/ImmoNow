import React, { useState, useCallback } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { Task } from '../types/kanban';
import ProfessionalKanbanBoard from '../components/dashboard/Kanban/ProfessionalKanbanBoard';
import TaskDetailDrawer from '../components/dashboard/Kanban/TaskDetailDrawer';
import { 
  useTasks, 
  useCreateTask, 
  useUpdateTask, 
  useMoveTask, 
  useDeleteTask,
  useEmployees
} from '../hooks/useTasks';
import { TaskListParams } from '../lib/api/types';
import '../styles/professional-kanban.css';

export const KanbanPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API Hooks
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ page: 1, size: 100 });
  const { data: employeesData } = useEmployees();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const moveTaskMutation = useMoveTask();
  const deleteTaskMutation = useDeleteTask();

  // Transform employees to assignees
  const availableAssignees = React.useMemo(() => {
    if (!employeesData || !Array.isArray(employeesData)) return [];
    return employeesData.map((employee: any) => ({
      id: employee.id,
      name: employee.name || `${employee.first_name} ${employee.last_name}`,
      avatar: employee.avatar || `https://ui-avatars.com/api/?name=${employee.name}&background=random`,
      role: employee.position || 'Mitarbeiter'
    }));
  }, [employeesData]);

  // Transform API tasks to component format
  const tasks = React.useMemo((): Record<string, Task[]> => {
    const defaultTasks: Record<string, Task[]> = {
      backlog: [],
      todo: [],
      inProgress: [],
      review: [],
      done: [],
      blocked: []
    };

    if (!tasksData || !Array.isArray(tasksData)) return defaultTasks;

    const organizedTasks = { ...defaultTasks };
    tasksData.forEach((apiTask: any) => {
      const assigneeDetails = availableAssignees.find(a => a.id === apiTask.assignee?.id) || {
        id: apiTask.assignee?.id || '',
        name: apiTask.assignee?.name || 'Unzugewiesen',
        avatar: apiTask.assignee?.avatar || 'https://ui-avatars.com/api/?name=U&background=random',
        role: apiTask.assignee?.role || 'Mitarbeiter'
      };

      const transformedTask: Task = {
        id: apiTask.id,
        title: apiTask.title,
        description: apiTask.description || '',
        priority: (apiTask.priority || 'medium') as any,
        assignee: assigneeDetails,
        dueDate: apiTask.due_date || new Date().toISOString().split('T')[0],
        status: apiTask.status,
        progress: apiTask.progress ?? 0,
        estimatedHours: apiTask.estimated_hours ?? 0,
        actualHours: apiTask.actual_hours ?? 0,
        tags: apiTask.tags || [],
        labels: apiTask.labels || [],
        subtasks: apiTask.subtasks || [],
        comments: apiTask.comments || [],
        attachments: apiTask.attachments || [],
        activityLog: apiTask.activity_log || [],
        property: apiTask.property_type ? {
          type: apiTask.property_type,
          location: apiTask.location,
          price: apiTask.price,
          id: apiTask.property_id,
          clientId: apiTask.client_id
        } : undefined,
        financingStatus: apiTask.financing_status,
        linkedDocuments: apiTask.linked_documents,
        createdAt: apiTask.created_at || new Date().toISOString(),
        updatedAt: apiTask.updated_at || new Date().toISOString(),
        createdBy: assigneeDetails
      };

      const status = transformedTask.status;
      if (organizedTasks[status]) {
        organizedTasks[status].push(transformedTask);
      }
    });

    return organizedTasks;
  }, [tasksData, availableAssignees]);

  // Handle task click
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as Task['status'];
    // Convert frontend status to backend enum format
    const statusMap: Record<string, string> = {
      'inProgress': 'in_progress',
      'onHold': 'on_hold',
      'cancelled': 'cancelled',
      'backlog': 'backlog',
      'todo': 'todo',
      'review': 'review',
      'done': 'done',
      'blocked': 'blocked'
    };
    const backendStatus = statusMap[newStatus] || newStatus;

    // Update via API
    updateTaskMutation.mutate({
      id: draggableId,
      payload: { status: backendStatus } as any
    });

    moveTaskMutation.mutate({
      id: draggableId,
      payload: {
        task_id: draggableId,
        target_status: backendStatus as any,
        position: destination.index
      }
    });
  }, [updateTaskMutation, moveTaskMutation]);

  // Handle create task
  const handleCreateTask = useCallback((columnId: string) => {
    const newTask: Task = {
      id: `TEMP-${Date.now()}`,
      title: 'Neue Aufgabe',
      description: '',
      priority: 'medium',
      assignee: availableAssignees[0] || {
        id: '',
        name: 'Unzugewiesen',
        avatar: 'https://ui-avatars.com/api/?name=U&background=random',
        role: ''
      },
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: columnId as Task['status'],
      progress: 0,
      tags: [],
      estimatedHours: 4,
      actualHours: 0,
      labels: [],
      attachments: [],
      comments: [],
      subtasks: [],
      activityLog: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: availableAssignees[0] || {
        id: '',
        name: 'System',
        avatar: 'https://ui-avatars.com/api/?name=S&background=random',
        role: ''
      }
    };
    
    setSelectedTask(newTask);
    setIsModalOpen(true);
  }, [availableAssignees]);

  // Handle save task
  const handleSaveTask = useCallback((task: Task) => {
    if (task.id.startsWith('TEMP-')) {
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
        status: task.status === 'inProgress' ? 'in_progress' : task.status,
        estimated_hours: task.estimatedHours,
        actual_hours: task.actualHours,
        property_type: task.property?.type,
        location: task.property?.location,
        price: task.property?.price,
        tags: task.tags
      };
      createTaskMutation.mutate(apiTask as any);
    } else {
      // Update existing task
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
        status: task.status === 'inProgress' ? 'in_progress' : task.status,
        estimated_hours: task.estimatedHours,
        actual_hours: task.actualHours,
        property_type: task.property?.type,
        location: task.property?.location,
        price: task.property?.price,
        tags: task.tags
      };
      updateTaskMutation.mutate({ id: task.id, payload: apiTask as any });
    }
    setIsModalOpen(false);
    setSelectedTask(null);
  }, [createTaskMutation, updateTaskMutation]);

  // Handle delete task
  const handleDeleteTask = useCallback((taskId: string) => {
    deleteTaskMutation.mutate(taskId);
    setIsModalOpen(false);
    setSelectedTask(null);
  }, [deleteTaskMutation]);

  if (tasksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 
        dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 
            rounded-2xl flex items-center justify-center shadow-glass mb-4 animate-pulse mx-auto">
            <span className="text-3xl">📋</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Lade Aufgaben...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 
      dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <ProfessionalKanbanBoard
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onDragEnd={handleDragEnd}
        onCreateTask={handleCreateTask}
        onBulkUpdate={(taskIds, updates) => {
          taskIds.forEach(taskId => {
            updateTaskMutation.mutate({ id: taskId, payload: updates as any });
          });
        }}
      />

      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        availableAssignees={availableAssignees}
        mode={selectedTask?.id.startsWith('TEMP-') ? 'edit' : 'view'}
      />
    </div>
  );
};

export default KanbanPage;
