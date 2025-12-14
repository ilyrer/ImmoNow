import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DropResult } from '@hello-pangea/dnd';
import { Task, KanbanColumn } from '../types/kanban';
import ProfessionalKanbanBoard from '../components/dashboard/Kanban/ProfessionalKanbanBoard';
import TaskDetailDrawer from '../components/dashboard/Kanban/TaskDetailDrawer';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useMoveTask,
  useDeleteTask,
  useEmployees,
  useTaskStatistics
} from '../hooks/useTasks';
import { TaskListParams } from '../lib/api/types';
import boardsService from '../services/boards';
import aiService from '../services/ai';
import '../styles/professional-kanban.css';

export const KanbanPage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Boards (Workspace -> Board -> Status)
  const { data: boardsData } = useQuery({
    queryKey: ['boards'],
    queryFn: () => boardsService.listBoards(),
    staleTime: 60_000,
  });
  const selectedBoard = boardsData?.[0];
  const dynamicColumns: KanbanColumn[] | undefined = selectedBoard?.statuses?.map((status) => ({
    id: status.key,
    title: status.title,
    color: status.color,
    icon: '◉',
    description: status.title,
    limit: status.wip_limit || undefined,
    order: status.order,
  }));

  const fallbackColumns: KanbanColumn[] = [
    { id: 'backlog', title: 'Backlog', color: '#6B7280', icon: '○', description: 'Geplant', order: 0 },
    { id: 'todo', title: 'Zu erledigen', color: '#8E8E93', icon: '◐', description: 'Bereit', order: 1 },
    { id: 'in_progress', title: 'In Arbeit', color: '#0A84FF', icon: '◉', description: 'Aktiv', order: 2 },
    { id: 'review', title: 'Überprüfung', color: '#FF9F0A', icon: '◎', description: 'Freigabe', order: 3 },
    { id: 'done', title: 'Abgeschlossen', color: '#32D74B', icon: '●', description: 'Erledigt', order: 4 },
  ];

  const columns = dynamicColumns?.length ? dynamicColumns : fallbackColumns;

  // API Hooks with shorter cache time for immediate updates
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useTasks({ page: 1, size: 100, board_id: selectedBoard?.id });
  const { data: employeesData } = useEmployees();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const moveTaskMutation = useMoveTask();
  const deleteTaskMutation = useDeleteTask();
  const { data: taskStats } = useTaskStatistics();

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
    const defaultTasks: Record<string, Task[]> = columns.reduce((acc, col) => {
      acc[col.id] = [];
      return acc;
    }, {} as Record<string, Task[]>);
    defaultTasks['blocked'] = defaultTasks['blocked'] || [];
    defaultTasks['on_hold'] = defaultTasks['on_hold'] || [];
    defaultTasks['cancelled'] = defaultTasks['cancelled'] || [];

    if (!tasksData || !Array.isArray(tasksData)) {
      console.log('[KanbanPage] No tasks data or not an array. Type:', typeof tasksData, 'Value:', tasksData);
      return defaultTasks;
    }

    console.log(`[KanbanPage] Processing ${tasksData.length} tasks into ${columns.length} columns`);

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
      } else {
        console.warn(`[KanbanPage] Task "${transformedTask.title}" has unmapped status "${status}". Available columns:`, Object.keys(organizedTasks));
      }
    });

    const summary = Object.entries(organizedTasks)
      .map(([col, tasks]) => `${col}: ${tasks.length}`)
      .join(', ');
    console.log(`[KanbanPage] Tasks organized: ${summary}`);

    return organizedTasks;
  }, [tasksData, availableAssignees, columns]);

  // Handle task click
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  // Handle drag end with immediate refetch
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // No destination or same position
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as Task['status'];

    console.log(`[DragEnd] Moving task ${draggableId} from ${source.droppableId} to ${newStatus}`);

    // Update with immediate refetch
    await updateTaskMutation.mutateAsync(
      {
        id: draggableId,
        payload: { status: newStatus } as any
      }
    ).then(() => {
      // Force immediate refetch to show updated position
      refetchTasks();
      console.log('[DragEnd] Task moved successfully, refetching...');
    }).catch((error) => {
      console.error('[DragEnd] Failed to move task:', error);
      alert('Fehler beim Verschieben der Aufgabe. Bitte erneut versuchen.');
    });
  }, [updateTaskMutation, refetchTasks]);

  // Handle create task
  const handleCreateTask = useCallback((columnId: string) => {
    const newTask: Task = {
      id: `TEMP-${Date.now()}`,
      title: 'Neue Aufgabe',
      description: '',
      priority: 'medium',
      assignee: availableAssignees[0] || {
        id: '',
        name: 'Ich',
        avatar: '',
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

  const handleAiCreateTask = useCallback(async (columnId: string) => {
    const text = window.prompt('KI-Task erstellen: Kontext/Notizen eingeben');
    if (!text) return;
    try {
      const proposal = await aiService.generateTaskFromText(text);
      const status = columns.find((c) => c.id === proposal.status) ? proposal.status : columnId;
      await createTaskMutation.mutateAsync({
        title: proposal.title,
        description: proposal.description,
        priority: proposal.priority as any,
        status,
        assignee_id: availableAssignees[0]?.id || undefined,
        due_date: proposal.due_date,
        estimated_hours: 4,
        tags: proposal.suggested_tags,
        story_points: proposal.suggested_story_points,
        board_id: selectedBoard?.id,
      } as any);
    } catch (error) {
      console.error('KI-Task-Erstellung fehlgeschlagen', error);
      alert('KI-Task-Erstellung fehlgeschlagen.');
    }
  }, [availableAssignees, columns, createTaskMutation, selectedBoard]);

  const handleSummarizeBoard = useCallback(async () => {
    if (!selectedBoard) return;
    const summary = await aiService.summarizeBoard(selectedBoard.id);
    alert(`Board Summary:\n${summary.summary}\nHighlights: ${summary.highlights.join(', ')}`);
  }, [selectedBoard]);

  // Handle save task
  const handleSaveTask = useCallback((task: Task) => {
    if (task.id.startsWith('TEMP-')) {
      // Create new task
      const apiTask = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignee_id: task.assignee.id || undefined,
        due_date: task.dueDate,
        status: task.status,
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
        assignee_id: task.assignee.id || undefined,
        due_date: task.dueDate,
        status: task.status,
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 
            rounded-2xl flex items-center justify-center shadow-glass mb-4 animate-pulse mx-auto text-white font-bold">
            PT
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Lade Aufgaben...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 
      dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 overflow-hidden">
      <div className="px-6 pt-4 flex gap-3 flex-shrink-0">
        {(() => {
          // Unterstützt snake_case (Backend) und camelCase (typings)
          const active = taskStats ? ((taskStats as any).active_tasks ?? (taskStats as any).activeTasks ?? 0) : 0;
          const overdue = taskStats ? ((taskStats as any).overdue_tasks ?? (taskStats as any).overdueTasks ?? 0) : 0;
          const totalActual = taskStats ? ((taskStats as any).total_actual_hours ?? (taskStats as any).totalActualHours ?? 0) : 0;
          const completion = taskStats ? ((taskStats as any).completion_rate ?? (taskStats as any).completionRate ?? 0) : 0;
          return (
            <>
              <div className="px-4 py-3 bg-white/60 dark:bg-white/10 rounded-xl border border-white/30 text-sm font-medium text-gray-700 dark:text-gray-300">
                Aktiv: <span className="font-bold text-blue-600 dark:text-blue-400">{active}</span> • Überfällig: <span className="font-bold text-red-600 dark:text-red-400">{overdue}</span>
              </div>
              <div className="px-4 py-3 bg-white/60 dark:bg-white/10 rounded-xl border border-white/30 text-sm font-medium text-gray-700 dark:text-gray-300">
                Lead Time ø: <span className="font-bold">{Math.round(totalActual || 0)}h</span>
              </div>
              <div className="px-4 py-3 bg-white/60 dark:bg-white/10 rounded-xl border border-white/30 text-sm font-medium text-gray-700 dark:text-gray-300">
                Fertigstellung: <span className="font-bold text-green-600 dark:text-green-400">{Number(completion).toFixed(1)}%</span>
              </div>
            </>
          );
        })()}
      </div>
      <ProfessionalKanbanBoard
        tasks={tasks}
        columns={columns}
        onTaskClick={handleTaskClick}
        onDragEnd={handleDragEnd}
        onCreateTask={handleCreateTask}
        onAiCreateTask={handleAiCreateTask}
        onSummarizeBoard={handleSummarizeBoard}
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
