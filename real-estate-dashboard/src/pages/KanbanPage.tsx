import React, { useCallback, useMemo, useState } from 'react';
import ModernKanbanBoard from '../components/dashboard/Kanban/ModernKanbanBoard';
import TaskDetailDrawer from '../components/dashboard/Kanban/TaskDetailDrawer';
import { useTasks, useCreateTask, useUpdateTask, useMoveTask, useEmployees, useSprints, useCreateSprint } from '../hooks/useTasks';
import type { Task } from '../types/kanban';

export const KanbanPage: React.FC = () => {
  const { data: tasksData } = useTasks({ page: 1, size: 100 });
  const { data: employeesData } = useEmployees();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const moveTaskMutation = useMoveTask();
  const { data: sprintsData = [] } = useSprints();
  const createSprintMutation = useCreateSprint();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [showSprintWizard, setShowSprintWizard] = useState(false);
  const [wizardName, setWizardName] = useState<string>('Sprint ' + new Date().toLocaleDateString('de-DE'));
  const [wizardGoal, setWizardGoal] = useState<string>('');
  const [wizardStart, setWizardStart] = useState<string>(new Date().toISOString().slice(0,10));
  const [wizardEnd, setWizardEnd] = useState<string>(new Date(Date.now()+14*24*60*60*1000).toISOString().slice(0,10));
  const [wizardSelectedTaskIds, setWizardSelectedTaskIds] = useState<string[]>([]);

  const statusColumns = [
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-400', icon: 'inbox', description: 'Geplant', limit: null },
    { id: 'inProgress', title: 'In Arbeit', color: 'bg-yellow-500', icon: 'flash', description: 'Aktiv', limit: 5 },
    { id: 'review', title: 'Überprüfung', color: 'bg-purple-500', icon: 'eye', description: 'Freigabe', limit: 5 },
    { id: 'done', title: 'Erledigt', color: 'bg-green-500', icon: 'check', description: 'Abgeschlossen', limit: null },
    { id: 'blocked', title: 'Blockiert', color: 'bg-red-500', icon: 'alert', description: 'Warten', limit: null },
  ];

  const employees = useMemo(() => {
    console.log('employeesData:', employeesData);
    const list = Array.isArray(employeesData) ? employeesData : (employeesData as any)?.items;
    console.log('list:', list);
    if (!list || !Array.isArray(list)) return [];
    const mapped = list.map((e: any) => ({ 
      id: e.id, 
      name: e.name || `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(), 
      avatar: e.avatar || '/default-avatar.png', 
      role: e.role || 'Mitarbeiter' 
    }));
    console.log('Mapped employees:', mapped);
    return mapped;
  }, [employeesData]);

  const mapBackendStatusToFrontend = (backendStatus: string): string => {
    const statusMap: Record<string, string> = {
      'backlog': 'backlog',
      'in_progress': 'inProgress', 
      'review': 'review',
      'done': 'done',
      'blocked': 'blocked',
      // Fallback für alte 'todo' Status
      'todo': 'backlog',
      'inProgress': 'inProgress',
      'cancelled': 'blocked',
      'onHold': 'blocked'
    };
    return statusMap[backendStatus] || 'backlog';
  };

  const mapPriority = (p: string | undefined) => {
    if (!p) return 'mittel';
    switch (p) {
      case 'urgent': return 'critical';
      case 'high': return 'hoch';
      case 'medium': return 'mittel';
      case 'low': return 'niedrig';
      default: return 'mittel';
    }
  };

  const mapPriorityToBackend = (p: string | undefined) => {
    if (!p) return 'medium';
    switch (p) {
      case 'critical': return 'urgent';
      case 'hoch': return 'high';
      case 'mittel': return 'medium';
      case 'niedrig': return 'low';
      default: return p;
    }
  };

  const normalizeDueDate = (value?: string) => {
    if (!value) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    // if only date provided (yyyy-mm-dd), add time part
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value + 'T00:00:00Z';
    }
    return value;
  };

  const tasks = useMemo(() => {
    const empty: Record<string, any[]> = { backlog: [], inProgress: [], review: [], done: [], blocked: [] };
    const arr = Array.isArray(tasksData) ? tasksData : (tasksData as any)?.items;
    if (!arr) return empty;
    arr
      .filter((t: any) => !selectedSprintId || t.sprint?.id === selectedSprintId)
      .forEach((t: any) => {
      const assignee = t.assignee || {};
      const modern = {
        id: t.id,
        title: t.title,
        description: t.description || '',
        priority: mapPriority(t.priority) as any,
        assignee: {
          id: assignee.id || '',
          name: assignee.name || 'Unzugewiesen',
          avatar: assignee.avatar || '/default-avatar.png',
        },
        dueDate: t.due_date || new Date().toISOString(),
        status: mapBackendStatusToFrontend(t.status) as any,
        progress: t.progress || 0,
        tags: t.tags || [],
        estimatedHours: t.estimated_hours || 0,
        actualHours: t.actual_hours || 0,
        complexity: 'medium',
        impactScore: t.impact_score || 0,
        effortScore: t.effort_score || 0,
        dependencies: t.dependencies || [],
        watchers: (t.watchers || []).map((w: any) => typeof w === 'string' ? w : w.id),
        labels: (t.labels || []).map((l: any) => ({ id: l.id, name: l.name, color: l.color })),
        customFields: t.custom_fields || {},
        attachments: t.attachments || [],
        comments: t.comments || [],
        subtasks: t.subtasks || [],
        createdAt: t.created_at || new Date().toISOString(),
        updatedAt: t.updated_at || new Date().toISOString(),
        lastActivity: { user: '', action: '', timestamp: t.updated_at || new Date().toISOString() },
      };
      const key = modern.status || 'backlog';
      if (!empty[key]) empty[key] = [];
      empty[key].push(modern);
    });
    return empty;
  }, [tasksData, selectedSprintId]);

  const toBackendStatus = (s: string) => {
    const statusMap: Record<string, string> = {
      'backlog': 'backlog', // Backlog bleibt Backlog
      'inProgress': 'in_progress',
      'review': 'review',
      'done': 'done',
      'blocked': 'blocked',
      'onHold': 'blocked',
      'cancelled': 'blocked'
    };
    return statusMap[s] || 'backlog';
  };

  const onDragEnd = useCallback((result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    // Ignore temporary tasks (not yet persisted, non-UUID)
    if (String(draggableId).startsWith('TEMP-')) return;
    
    const newStatus = destination.droppableId;
    const newPosition = destination.index;
    
    // Calculate position based on cursor position
    const targetColumnTasks = tasks[newStatus] || [];
    const actualPosition = Math.min(newPosition, targetColumnTasks.length);
    
    updateTaskMutation.mutate({ 
      id: draggableId, 
      data: {
        status: toBackendStatus(newStatus),
        position: actualPosition
      } as any
    });
    
    moveTaskMutation.mutate({ 
      id: draggableId, 
      payload: { 
        task_id: draggableId, 
        target_status: toBackendStatus(newStatus), 
        position: actualPosition 
      } as any 
    });
  }, [updateTaskMutation, moveTaskMutation, tasks, toBackendStatus]);

  const onTaskClick = useCallback((task: any) => {
    // Map to legacy Task type for drawer
    const legacy: Task = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignee: task.assignee,
      dueDate: task.dueDate,
      status: task.status,
      progress: task.progress,
      tags: task.tags,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours || 0,
      labels: task.labels,
      attachments: task.attachments,
      comments: task.comments,
      subtasks: task.subtasks,
      activityLog: [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      createdBy: task.assignee,
    };
    setSelectedTask(legacy);
    setIsModalOpen(true);
  }, []);

  const onCreateTask = useCallback((columnId: string) => {
    const newTask: Task = {
      id: `TEMP-${Date.now()}`, // Temporäre ID für Frontend-only
      title: 'Neue Aufgabe',
      description: '',
      priority: 'medium' as any,
      assignee: employees[0] || { id: '', name: 'Unzugewiesen', avatar: '/default-avatar.png', role: '' },
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: columnId as any, // Frontend Status (backlog, todo, etc.)
      progress: 0,
      tags: [],
      estimatedHours: 0,
      actualHours: 0,
      labels: [],
      attachments: [],
      comments: [],
      subtasks: [],
      activityLog: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: employees[0] || { id: '', name: 'System', avatar: '/default-avatar.png', role: '' },
    };
    setSelectedTask(newTask);
    setIsModalOpen(true);
  }, [employees]);

  const onSave = useCallback((task: Task) => {
    const payload: any = {
      title: task.title,
      description: task.description,
      priority: mapPriorityToBackend(task.priority as any),
      due_date: normalizeDueDate(task.dueDate as any),
      status: toBackendStatus(task.status),
      estimated_hours: Math.max(1, Number(task.estimatedHours) || 1),
      actual_hours: task.actualHours,
      assignee_id: (task.assignee?.id && task.assignee.id.trim() !== '') ? task.assignee.id : undefined,
      label_ids: task.labels?.map((l: any) => l.id) || [],
      sprint_id: selectedSprintId || undefined,
    };
    if (task.id.startsWith('TEMP-')) {
      createTaskMutation.mutate(payload);
    } else {
      updateTaskMutation.mutate({ id: task.id, data: payload });
    }
    setIsModalOpen(false);
    setSelectedTask(null);
  }, [createTaskMutation, updateTaskMutation]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <ModernKanbanBoard
        tasks={tasks as any}
        statusColumns={statusColumns as any}
        isDarkMode={false}
        onDragEnd={onDragEnd}
        onTaskClick={onTaskClick}
        onCreateTask={onCreateTask}
        selectedTasks={selectedTasks}
        onTaskSelect={(id, sel) => setSelectedTasks(prev => sel ? [...prev, id] : prev.filter(x => x !== id))}
        bulkEditMode={bulkEditMode}
        sprints={(Array.isArray(sprintsData) ? sprintsData : (sprintsData as any) || []).map((s: any) => ({ id: s.id, name: s.name, status: s.status }))}
        selectedSprintId={selectedSprintId}
        onChangeSprint={setSelectedSprintId}
        onCreateSprint={async () => {
          setShowSprintWizard(true);
        }}
        sprintInfo={selectedSprintId ? (Array.isArray(sprintsData) ? sprintsData : (sprintsData as any) || []).find((s: any)=>s.id===selectedSprintId) : null}
        sprintStats={{
          total: ['todo','inProgress','review','done','blocked','backlog'].reduce((sum,k)=> sum + ((tasks as any)[k]?.length||0),0),
          done: (tasks as any).done?.length || 0,
          remaining: ['todo','inProgress','review','blocked'].reduce((sum,k)=> sum + ((tasks as any)[k]?.length||0),0)
        }}
        onSprintStart={selectedSprintId ? async ()=>{
          // Update sprint status to active if backend supports
          try {
            await (await import('../services/tasks')).tasksService.updateSprint(selectedSprintId!, { status: 'active' } as any);
          } catch {}
        }: undefined}
        onSprintComplete={selectedSprintId ? async ()=>{
          try {
            await (await import('../services/tasks')).tasksService.updateSprint(selectedSprintId!, { status: 'completed' } as any);
          } catch {}
        }: undefined}
      />

      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
        onSave={onSave}
        onDelete={(id) => { /* optional: add delete */ }}
        availableAssignees={employees}
        mode={selectedTask?.id.startsWith('TEMP-') ? 'edit' : 'view'}
      />

      {/* Sprint Wizard Modal */}
      {showSprintWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSprintWizard(false)}></div>
          <div className="relative w-full max-w-3xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sprint planen</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Wähle Zeitraum und Aufgaben aus dem Backlog</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input value={wizardName} onChange={e=>setWizardName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ziel (optional)</label>
                  <input value={wizardGoal} onChange={e=>setWizardGoal(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Startdatum</label>
                  <input type="date" value={wizardStart} onChange={e=>setWizardStart(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enddatum</label>
                  <input type="date" value={wizardEnd} onChange={e=>setWizardEnd(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Backlog-Aufgaben auswählen</label>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                  {(tasks.backlog || []).map((t:any)=> (
                    <label key={t.id} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                      <input type="checkbox" checked={wizardSelectedTaskIds.includes(t.id)} onChange={(e)=> setWizardSelectedTaskIds(prev => e.target.checked ? [...prev, t.id] : prev.filter(id=>id!==t.id))} className="rounded"/>
                      <span className="font-medium truncate">{t.title}</span>
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{t.estimatedHours}h</span>
                    </label>
                  ))}
                  {(!tasks.backlog || tasks.backlog.length===0) && (
                    <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Kein Backlog vorhanden</div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button onClick={()=>setShowSprintWizard(false)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Abbrechen</button>
              <button onClick={async ()=>{
                try {
                  const sprint = await createSprintMutation.mutateAsync({ name: wizardName, goal: wizardGoal, start_date: wizardStart, end_date: wizardEnd });
                  const sid = (sprint as any)?.id || (sprint as any);
                  for (const id of wizardSelectedTaskIds) {
                    await updateTaskMutation.mutateAsync({ id, data: { sprint_id: sid } as any });
                  }
                  setSelectedSprintId(sid || null);
                  setShowSprintWizard(false);
                  setWizardSelectedTaskIds([]);
                } catch (e) {
                  // no-op; could add toast
                }
              }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Sprint erstellen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanPage;
