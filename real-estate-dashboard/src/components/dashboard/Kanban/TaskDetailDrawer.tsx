import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskComment, Subtask, ActivityLogEntry, TaskDocument } from '../../../types/kanban';
import tasksService from '../../../services/tasks';
import { ALL_STATUSES } from './ProfessionalKanbanBoard';

/**
 * ============================================================================
 * ADVANCED TASK DETAIL DRAWER
 * Professional drawer with tabs: Details | Comments | Activity | Documents
 * Features: Threading, Mentions, Activity Log, Document Preview
 * ============================================================================
 */

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  availableAssignees?: Array<{
    id: string;
    name: string;
    avatar: string;
    role?: string;
  }>;
  mode?: 'view' | 'edit';
}

type TabType = 'details' | 'comments' | 'activity' | 'documents';

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Kritisch', icon: '▲', color: 'red' },
  { value: 'high', label: 'Hoch', icon: '▲', color: 'orange' },
  { value: 'medium', label: 'Mittel', icon: '▬', color: 'yellow' },
  { value: 'low', label: 'Niedrig', icon: '▼', color: 'green' }
] as const;

// Import all statuses from main board configuration
const STATUS_OPTIONS = ALL_STATUSES.map(status => ({
  value: status.id,
  label: status.title,
  icon: status.icon,
  color: status.color.replace('#', ''),
  description: status.description
}));

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  availableAssignees = [],
  mode: initialMode = 'view'
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<typeof availableAssignees>([]);
  const [showMentions, setShowMentions] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      setEditedTask(task);
      setMode(initialMode);
      // Live laden: Comments, Activity, Attachments
      (async () => {
        try {
          const [comments, activity] = await Promise.all([
            tasksService.getComments(task.id).catch(()=>task.comments),
            tasksService.getActivity(task.id).catch(()=>task.activityLog),
          ]);
          setEditedTask(prev => prev ? { ...prev, comments, activityLog: activity } : prev);
        } catch {}
      })();
    }
  }, [task, initialMode]);

  useEffect(() => {
    // Detect @ mentions in comment
    const lastAtIndex = newComment.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === newComment.length - 1) {
      setShowMentions(true);
      setMentionSuggestions(availableAssignees);
    } else if (lastAtIndex !== -1) {
      const searchTerm = newComment.slice(lastAtIndex + 1).toLowerCase();
      if (searchTerm && !searchTerm.includes(' ')) {
        setShowMentions(true);
        setMentionSuggestions(
          availableAssignees.filter(a => 
            a.name.toLowerCase().includes(searchTerm)
          )
        );
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [newComment, availableAssignees]);

  if (!task || !editedTask) return null;

  const handleSave = () => {
    if (editedTask) {
      onSave(editedTask);
      setMode('view');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
      onDelete?.(task.id);
      onClose();
    }
  };

  const addComment = async () => {
    if (newComment.trim() && editedTask) {
      try {
        // Optimistisch
        const tempId = `temp-${Date.now()}`;
        setEditedTask({
          ...editedTask,
          comments: [...editedTask.comments, { id: tempId, author: { id: 'me', name: 'Ich', avatar: '', role: '' }, text: newComment, timestamp: new Date().toISOString(), parentId: replyTo || undefined, mentions: extractMentions(newComment), reactions: [] }],
        });
        const created = await tasksService.addComment(editedTask.id, { text: newComment, parentId: replyTo || undefined });
        // Refresh list
        const comments = await tasksService.getComments(editedTask.id);
        setEditedTask(prev => prev ? { ...prev, comments } : prev);
      } catch {}
      finally {
        setNewComment('');
        setReplyTo(null);
      }
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.matchAll(mentionRegex);
    return Array.from(matches, m => m[1]);
  };

  const insertMention = (assignee: typeof availableAssignees[0]) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    const beforeMention = newComment.slice(0, lastAtIndex);
    setNewComment(`${beforeMention}@${assignee.name} `);
    setShowMentions(false);
    commentInputRef.current?.focus();
  };

  const addSubtask = () => {
    if (newSubtask.trim() && editedTask) {
      const subtask: Subtask = {
        id: Date.now().toString(),
        title: newSubtask,
        completed: false,
        createdAt: new Date().toISOString(),
        order: editedTask.subtasks.length
      };
      setEditedTask({
        ...editedTask,
        subtasks: [...editedTask.subtasks, subtask]
      });
      setNewSubtask('');
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    if (editedTask) {
      setEditedTask({
        ...editedTask,
        subtasks: editedTask.subtasks.map(st =>
          st.id === subtaskId 
            ? { 
                ...st, 
                completed: !st.completed,
                completedAt: !st.completed ? new Date().toISOString() : undefined
              } 
            : st
        )
      });
    }
  };

  const deleteSubtask = (subtaskId: string) => {
    if (editedTask) {
      setEditedTask({
        ...editedTask,
        subtasks: editedTask.subtasks.filter(st => st.id !== subtaskId)
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!editedTask) return;

    try {
      // Upload file to server
      const uploadResponse = await tasksService.uploadAttachment(editedTask.id, {
        name: file.name,
        file_url: URL.createObjectURL(file), // In production: actual uploaded URL from server
        file_size: file.size,
        mime_type: file.type
      });

      // Convert TaskAttachment to TaskDocument format
      const newAttachment: TaskDocument = {
        id: (uploadResponse as any).id || String(Date.now()),
        name: file.name,
        type: file.type,
        url: (uploadResponse as any).file_url || URL.createObjectURL(file),
        size: file.size,
        uploadedBy: { id: 'current-user', name: 'You', avatar: '', role: '' },
        uploadedAt: new Date().toISOString()
      };

      setEditedTask(prev => prev ? { 
        ...prev, 
        attachments: [...prev.attachments, newAttachment] 
      } : prev);
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!editedTask) return;

    try {
      await tasksService.deleteAttachment(attachmentId);
      
      setEditedTask(prev => prev ? { 
        ...prev, 
        attachments: prev.attachments.filter(a => a.id !== attachmentId) 
      } : prev);
    } catch (error) {
      console.error('Delete attachment failed:', error);
      throw error;
    }
  };

  const addReaction = (commentId: string, emoji: string) => {
    if (editedTask) {
      setEditedTask({
        ...editedTask,
        comments: editedTask.comments.map(comment => {
          if (comment.id === commentId) {
            const existingReaction = comment.reactions?.find(r => r.emoji === emoji);
            if (existingReaction) {
              return {
                ...comment,
                reactions: comment.reactions?.map(r =>
                  r.emoji === emoji
                    ? { ...r, users: [...r.users, 'current-user'] }
                    : r
                )
              };
            } else {
              return {
                ...comment,
                reactions: [...(comment.reactions || []), { emoji, users: ['current-user'] }]
              };
            }
          }
          return comment;
        })
      });
    }
  };

  const getThreadedComments = () => {
    if (!editedTask) return [];
    const commentMap = new Map<string, TaskComment & { replies: TaskComment[] }>();
    const topLevel: (TaskComment & { replies: TaskComment[] })[] = [];

    // First pass: create map
    editedTask.comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize threads
    editedTask.comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        const commentWithReplies = commentMap.get(comment.id);
        if (commentWithReplies) {
          topLevel.push(commentWithReplies);
        }
      }
    });

    return topLevel.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[10001] w-full max-w-3xl 
              bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl 
              border-l border-white/20 dark:border-white/10 shadow-glass-xl
              flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-white/30 dark:bg-white/5 backdrop-blur-3xl 
              border-b border-white/20 dark:border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 
                    to-pink-500 rounded-2xl flex items-center justify-center shadow-glass-lg">
                    <span className="text-3xl">📋</span>
                  </div>
                  <div>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 
                      bg-white/50 dark:bg-white/10 px-3 py-1 rounded-lg border 
                      border-white/20 dark:border-white/10">
                      {task.id}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                      Task Details
                    </h2>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {mode === 'view' ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMode('edit')}
                        className="px-5 py-2.5 bg-blue-500/80 hover:bg-blue-600/80 text-white 
                          rounded-xl font-semibold text-sm transition-all shadow-glass-lg 
                          flex items-center gap-2"
                      >
                        <span>✏️</span>
                        Bearbeiten
                      </motion.button>
                      {onDelete && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDelete}
                          className="px-5 py-2.5 bg-red-500/80 hover:bg-red-600/80 text-white 
                            rounded-xl font-semibold text-sm transition-all shadow-glass-lg
                            flex items-center gap-2"
                        >
                          <span>🗑️</span>
                          Löschen
                        </motion.button>
                      )}
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-green-500/80 hover:bg-green-600/80 text-white 
                          rounded-xl font-semibold text-sm transition-all shadow-glass-lg
                          flex items-center gap-2"
                      >
                        <span>💾</span>
                        Speichern
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setEditedTask(task);
                          setMode('view');
                        }}
                        className="px-5 py-2.5 bg-gray-500/80 hover:bg-gray-600/80 text-white 
                          rounded-xl font-semibold text-sm transition-all shadow-glass-lg"
                      >
                        Abbrechen
                      </motion.button>
                    </>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-xl 
                      bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/15 
                      transition-all"
                  >
                    <span className="text-2xl text-gray-700 dark:text-gray-300">×</span>
                  </motion.button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'details', label: 'Details', icon: '▤', badge: null },
                  { id: 'comments', label: 'Kommentare', icon: '◉', badge: task.comments.length },
                  { id: 'activity', label: 'Aktivität', icon: '≡', badge: task.activityLog.length },
                  { id: 'documents', label: 'Dokumente', icon: '⎆', badge: task.attachments.length }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`relative px-5 py-3 font-semibold text-sm transition-all rounded-xl
                      ${activeTab === tab.id
                        ? 'bg-white/60 dark:bg-white/15 text-gray-900 dark:text-white shadow-glass-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/30 dark:hover:bg-white/10'
                      }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                    {tab.badge !== null && tab.badge > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs 
                        rounded-full font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'details' && (
                  <DetailsTab
                    task={task}
                    editedTask={editedTask}
                    setEditedTask={setEditedTask}
                    mode={mode}
                    availableAssignees={availableAssignees}
                    newSubtask={newSubtask}
                    setNewSubtask={setNewSubtask}
                    addSubtask={addSubtask}
                    toggleSubtask={toggleSubtask}
                    deleteSubtask={deleteSubtask}
                  />
                )}
                
                {activeTab === 'comments' && (
                  <CommentsTab
                    threadedComments={getThreadedComments()}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    commentInputRef={commentInputRef}
                    addComment={addComment}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    addReaction={addReaction}
                    showMentions={showMentions}
                    mentionSuggestions={mentionSuggestions}
                    insertMention={insertMention}
                  />
                )}
                
                {activeTab === 'activity' && (
                  <ActivityTab activityLog={task.activityLog} />
                )}
                
                {activeTab === 'documents' && (
                  <DocumentsTab 
                    attachments={task.attachments} 
                    taskId={task.id}
                    onUpload={handleFileUpload}
                    onDelete={handleDeleteAttachment}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// DETAILS TAB
// ============================================================================

interface DetailsTabProps {
  task: Task;
  editedTask: Task;
  setEditedTask: (task: Task) => void;
  mode: 'view' | 'edit';
  availableAssignees: any[];
  newSubtask: string;
  setNewSubtask: (value: string) => void;
  addSubtask: () => void;
  toggleSubtask: (id: string) => void;
  deleteSubtask: (id: string) => void;
}

const DetailsTab: React.FC<DetailsTabProps> = ({
  task,
  editedTask,
  setEditedTask,
  mode,
  availableAssignees,
  newSubtask,
  setNewSubtask,
  addSubtask,
  toggleSubtask,
  deleteSubtask
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    {/* Title */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Titel
      </label>
      {mode === 'edit' ? (
        <input
          type="text"
          value={editedTask.title}
          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
          className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
            border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
            dark:text-white focus:ring-2 focus:ring-blue-500/50 font-semibold"
        />
      ) : (
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{task.title}</h3>
      )}
    </div>

    {/* Description */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Beschreibung
      </label>
      {mode === 'edit' ? (
        <textarea
          value={editedTask.description}
          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
            border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
            dark:text-white focus:ring-2 focus:ring-blue-500/50 resize-none"
        />
      ) : (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {task.description || 'Keine Beschreibung'}
        </p>
      )}
    </div>

    {/* Grid: Priority, Status, Assignee, Due Date */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Priorität
        </label>
        {mode === 'edit' ? (
          <select
            value={editedTask.priority}
            onChange={(e) => setEditedTask({ 
              ...editedTask, 
              priority: e.target.value as Task['priority'] 
            })}
            className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
              border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
              dark:text-white focus:ring-2 focus:ring-blue-500/50"
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 text-lg">
            <span>{PRIORITY_OPTIONS.find(p => p.value === task.priority)?.icon}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        {mode === 'edit' ? (
          <select
            value={editedTask.status}
            onChange={(e) => setEditedTask({ 
              ...editedTask, 
              status: e.target.value as Task['status'] 
            })}
            className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
              border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
              dark:text-white focus:ring-2 focus:ring-blue-500/50"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 text-lg">
            <span>{STATUS_OPTIONS.find(s => s.value === task.status)?.icon}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {STATUS_OPTIONS.find(s => s.value === task.status)?.label}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Zugewiesen an
        </label>
        {availableAssignees.length > 0 ? (
          <select
            value={editedTask.assignee.id || ''}
            onChange={(e) => {
              const assignee = availableAssignees.find(a => a.id === e.target.value);
              if (assignee) {
                setEditedTask({ ...editedTask, assignee });
              }
            }}
            className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
              border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
              dark:text-white focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">Unzugewiesen</option>
            {availableAssignees.map(assignee => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src={task.assignee.avatar}
              alt={task.assignee.name}
              className="w-12 h-12 rounded-full border-2 border-white/50 shadow-md"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{task.assignee.name}</p>
              {task.assignee.role && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{task.assignee.role}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Fälligkeitsdatum
        </label>
        {mode === 'edit' ? (
          <input
            type="date"
            value={editedTask.dueDate}
            onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
            className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
              border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
              dark:text-white focus:ring-2 focus:ring-blue-500/50"
          />
        ) : (
          <p className="font-semibold text-gray-900 dark:text-white text-lg">
            {new Date(task.dueDate).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Geschätzte Stunden
        </label>
        {mode === 'edit' ? (
          <input
            type="number"
            value={editedTask.estimatedHours}
            onChange={(e) => setEditedTask({ 
              ...editedTask, 
              estimatedHours: parseInt(e.target.value) || 0 
            })}
            className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
              border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
              dark:text-white focus:ring-2 focus:ring-blue-500/50"
          />
        ) : (
          <p className="font-semibold text-gray-900 dark:text-white text-lg">
            {task.estimatedHours}h
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Fortschritt
        </label>
        {mode === 'edit' ? (
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={editedTask.progress}
              onChange={(e) => setEditedTask({ 
                ...editedTask, 
                progress: parseInt(e.target.value) 
              })}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer 
                bg-white/40 dark:bg-white/10"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #8B5CF6 ${editedTask.progress}%, rgba(255,255,255,0.2) ${editedTask.progress}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {editedTask.progress}%
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-full h-4 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden 
              border border-white/20 dark:border-white/10 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${task.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
              />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {task.progress}%
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Property Info */}
    {task.property && (
      <div className="p-5 bg-gradient-to-br from-blue-50/80 to-purple-50/80 
        dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border-2 
        border-blue-200/50 dark:border-blue-700/30 backdrop-blur-sm shadow-lg">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🏡</span>
          Immobilien-Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {task.property.type && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Typ</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {task.property.type === 'apartment' ? '■ Wohnung' : 
                 task.property.type === 'house' ? '▢ Haus' : 
                 task.property.type === 'commercial' ? '▦ Gewerbe' : '◈ Grundstück'}
              </p>
            </div>
          )}
          {task.property.location && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Standort</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                ◉ {task.property.location}
              </p>
            </div>
          )}
          {task.property.price && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Preis</p>
              <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                € {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                }).format(task.property.price)}
              </p>
            </div>
          )}
          {task.property.area && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fläche</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                📐 {task.property.area} m²
              </p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Subtasks */}
    <div>
      <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-xl">✓</span>
        Teilaufgaben ({editedTask.subtasks.filter(st => st.completed).length}/{editedTask.subtasks.length})
      </h4>
      <div className="space-y-2 mb-4">
        {editedTask.subtasks
          .sort((a, b) => a.order - b.order)
          .map((subtask) => (
            <motion.div
              key={subtask.id}
              layout
              className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/10 
                rounded-xl border border-white/20 dark:border-white/10 hover:bg-white/60 
                dark:hover:bg-white/15 transition-all group"
            >
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => toggleSubtask(subtask.id)}
                disabled={mode === 'view'}
                className="w-6 h-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 
                  cursor-pointer"
              />
              <span className={`flex-1 font-medium ${
                subtask.completed 
                  ? 'line-through text-gray-500 dark:text-gray-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {subtask.title}
              </span>
              {mode === 'edit' && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteSubtask(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500/80 
                    hover:bg-red-600/80 text-white rounded-lg text-sm font-medium 
                    transition-all"
                >
                  ✕
                </motion.button>
              )}
            </motion.div>
          ))}
      </div>
      {mode === 'edit' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
            placeholder="Neue Teilaufgabe hinzufügen..."
            className="flex-1 px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
              border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
              dark:text-white focus:ring-2 focus:ring-blue-500/50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addSubtask}
            disabled={!newSubtask.trim()}
            className="px-6 py-3 bg-blue-500/80 hover:bg-blue-600/80 text-white 
              rounded-xl font-semibold text-sm transition-all shadow-glass-md
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Hinzufügen
          </motion.button>
        </div>
      )}
    </div>
  </motion.div>
);

// ============================================================================
// COMMENTS TAB (continued in next part due to length)
// ============================================================================

interface CommentsTabProps {
  threadedComments: any[];
  newComment: string;
  setNewComment: (value: string) => void;
  commentInputRef: React.RefObject<HTMLTextAreaElement>;
  addComment: () => void;
  replyTo: string | null;
  setReplyTo: (value: string | null) => void;
  addReaction: (commentId: string, emoji: string) => void;
  showMentions: boolean;
  mentionSuggestions: any[];
  insertMention: (assignee: any) => void;
}

const CommentsTab: React.FC<CommentsTabProps> = ({
  threadedComments,
  newComment,
  setNewComment,
  commentInputRef,
  addComment,
  replyTo,
  setReplyTo,
  addReaction,
  showMentions,
  mentionSuggestions,
  insertMention
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    {/* Add Comment */}
    <div className="relative">
      <div className="flex gap-3">
        <img
          src="https://ui-avatars.com/api/?name=User&background=0A84FF&color=fff"
          alt="User"
          className="w-12 h-12 rounded-full border-2 border-white/50 shadow-md flex-shrink-0"
        />
        <div className="flex-1">
          {replyTo && (
            <div className="mb-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30 
              flex items-center justify-between">
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Antworten auf Kommentar...
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 
                  dark:hover:text-blue-300"
              >
                ✕
              </button>
            </div>
          )}
          <textarea
            ref={commentInputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Kommentar hinzufügen... (@mention für Erwähnungen)"
            rows={3}
            className="w-full px-4 py-3 bg-white/40 dark:bg-white/10 backdrop-blur-2xl 
              border border-white/20 dark:border-white/10 rounded-xl text-gray-900 
              dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
              focus:ring-2 focus:ring-blue-500/50 resize-none mb-2"
          />
          
          {/* Mention Suggestions */}
          {showMentions && mentionSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-64 bg-white/90 dark:bg-gray-800/90 
              backdrop-blur-xl rounded-xl border border-white/20 dark:border-white/10 
              shadow-glass-lg overflow-hidden">
              {mentionSuggestions.map((assignee) => (
                <button
                  key={assignee.id}
                  onClick={() => insertMention(assignee)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-500/10 
                    transition-all text-left"
                >
                  <img
                    src={assignee.avatar}
                    alt={assignee.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {assignee.name}
                    </p>
                    {assignee.role && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {assignee.role}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addComment}
              disabled={!newComment.trim()}
              className="px-5 py-2 bg-blue-500/80 hover:bg-blue-600/80 text-white 
                rounded-xl font-semibold text-sm transition-all shadow-glass-md
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ◉ Kommentieren
            </motion.button>
            <button className="px-3 py-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 
              dark:hover:bg-white/15 rounded-xl text-sm transition-all">
              ☺
            </button>
            <button className="px-3 py-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 
              dark:hover:bg-white/15 rounded-xl text-sm transition-all">
              ⎆
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Comments List */}
    <div className="space-y-4">
      {threadedComments.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="text-6xl mb-4 opacity-30">◉</p>
          <p className="text-lg font-medium">Noch keine Kommentare</p>
          <p className="text-sm">Sei der Erste, der kommentiert!</p>
        </div>
      ) : (
        threadedComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            setReplyTo={setReplyTo}
            addReaction={addReaction}
          />
        ))
      )}
    </div>
  </motion.div>
);

// Comment Thread Component
const CommentThread: React.FC<{
  comment: any;
  setReplyTo: (id: string) => void;
  addReaction: (commentId: string, emoji: string) => void;
}> = ({ comment, setReplyTo, addReaction }) => (
  <div className="space-y-3">
    <div className="flex gap-3">
      <img
        src={comment.author.avatar}
        alt={comment.author.name}
        className="w-10 h-10 rounded-full border-2 border-white/50 shadow-md flex-shrink-0"
      />
      <div className="flex-1">
        <div className="p-4 bg-white/40 dark:bg-white/10 rounded-xl border 
          border-white/20 dark:border-white/10 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="font-bold text-gray-900 dark:text-white">
                {comment.author.name}
              </span>
              {comment.author.role && (
                <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                  {comment.author.role}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(comment.timestamp).toLocaleDateString('de-DE', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            {comment.text}
          </p>
          
          {/* Reactions */}
          {comment.reactions && comment.reactions.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              {comment.reactions.map((reaction: any) => (
                <button
                  key={reaction.emoji}
                  onClick={() => addReaction(comment.id, reaction.emoji)}
                  className="flex items-center gap-1 px-2 py-1 bg-white/40 dark:bg-white/10 
                    rounded-lg hover:bg-white/60 dark:hover:bg-white/15 transition-all"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {reaction.users.length}
                  </span>
                </button>
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => setReplyTo(comment.id)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 
                dark:hover:text-blue-300 font-medium"
            >
              Antworten
            </button>
            <button
              onClick={() => addReaction(comment.id, '👍')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-700 
                dark:hover:text-gray-300"
            >
              👍
            </button>
            <button
              onClick={() => addReaction(comment.id, '❤️')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-700 
                dark:hover:text-gray-300"
            >
              ❤️
            </button>
          </div>
        </div>
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-8 mt-3 space-y-3">
            {comment.replies.map((reply: any) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                setReplyTo={setReplyTo}
                addReaction={addReaction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Activity Tab
const ActivityTab: React.FC<{ activityLog: ActivityLogEntry[] }> = ({ activityLog }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    {activityLog.length === 0 ? (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <p className="text-6xl mb-4">📊</p>
        <p className="text-lg font-medium">Keine Aktivität</p>
      </div>
    ) : (
      activityLog.map((entry) => (
        <div
          key={entry.id}
          className="flex gap-4 p-4 bg-white/40 dark:bg-white/10 rounded-xl border 
            border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/15 
            transition-all"
        >
          <img
            src={entry.user.avatar}
            alt={entry.user.name}
            className="w-10 h-10 rounded-full border-2 border-white/50 shadow-md flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-gray-900 dark:text-white">
              <span className="font-bold">{entry.user.name}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">{entry.description}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(entry.timestamp).toLocaleDateString('de-DE', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      ))
    )}
  </motion.div>
);

// Documents Tab
const DocumentsTab: React.FC<{ 
  attachments: TaskDocument[]; 
  taskId: string;
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
}> = ({ attachments, taskId, onUpload, onDelete }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await onUpload(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Fehler beim Hochladen der Datei');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Upload Button */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Anhänge ({attachments.length})
        </h4>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-500/80 hover:bg-blue-600/80 text-white 
            rounded-xl font-semibold text-sm transition-all shadow-glass-md
            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {uploading ? '↻ Lädt...' : '↑ Hochladen'}
        </motion.button>
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="text-6xl mb-4 opacity-30">⎆</p>
          <p className="text-lg font-medium">Keine Dokumente</p>
          <p className="text-sm mt-2">Klicken Sie auf "Hochladen", um Dateien hinzuzufügen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((attachment) => (
            <motion.div
              key={attachment.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white/40 dark:bg-white/10 rounded-xl border 
                border-white/20 dark:border-white/10 hover:bg-white/60 
                dark:hover:bg-white/15 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center 
                  justify-center text-2xl">
                  📄
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={attachment.url}
                    download
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                    title="Herunterladen"
                  >
                    ↓
                  </a>
                  <button
                    onClick={() => {
                      if (window.confirm('Anhang wirklich löschen?')) {
                        onDelete(attachment.id);
                      }
                    }}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Löschen"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {attachment.uploadedBy?.name || 'Unbekannt'}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TaskDetailDrawer;
