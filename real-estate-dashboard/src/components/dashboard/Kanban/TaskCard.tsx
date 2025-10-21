import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLabels, useSprints, useEmployees } from '../../../hooks/useTasks';

interface TaskAssignee {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface TaskAttachment {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
}

interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: TaskAssignee;
}

interface RealEstateTask {
  id: string;
  title: string;
  description: string;
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  assignee: TaskAssignee;
  dueDate: string;
  status: 'backlog' | 'todo' | 'inProgress' | 'review' | 'done' | 'blocked' | 'onHold' | 'cancelled';
  progress: number;
  tags: string[];
  estimatedHours: number;
  actualHours: number;
  propertyType?: 'apartment' | 'house' | 'commercial' | 'land';
  location?: string;
  price?: number;
  labels: TaskLabel[];
  attachments: TaskAttachment[];
  comments: any[];
  subtasks: TaskSubtask[];
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
  // New Kanban fields
  storyPoints?: number | null;
  sprintId?: string | null;
  sprint?: {
    id: string;
    name: string;
    status: string;
  };
}

interface TaskCardProps {
  task: RealEstateTask;
  onEdit?: (task: RealEstateTask) => void;
  onMove?: (taskId: string, newStatus: string) => void;
  onDelete?: (taskId: string) => void;
  onClone?: (task: RealEstateTask) => void;
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
  showSprintInfo?: boolean;
  showWatchers?: boolean;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onMove,
  onDelete,
  onClone,
  isSelected = false,
  onSelect,
  showSprintInfo = true,
  showWatchers = true,
  compact = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Fetch data for enhanced display
  const { data: labels = [] } = useLabels();
  const { data: sprints = [] } = useSprints();
  const { data: employees = [] } = useEmployees();

  const priorityColors = {
    highest: 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
    high: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20',
    medium: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
    lowest: 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20'
  };

  const statusColors = {
    backlog: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    todo: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
    inProgress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
    review: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
    done: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
    blocked: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200',
    onHold: 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  };

  const priorityIcons = {
    highest: '🔺',
    high: '🔴',
    medium: '🟡',
    low: '🔽',
    lowest: '⬇️'
  };

  const issueTypeIcons = {
    listing: '🏠',
    viewing: '👁️',
    contract: '📄',
    maintenance: '🔧',
    marketing: '📢'
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'done';
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const watcherCount = Array.isArray(task.watchers) ? task.watchers.length : 0;
  const attachmentCount = task.attachments.length;
  const commentCount = task.comments.length;

  const sprint = task.sprint || sprints.find(s => s.id === task.sprintId);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(task.id, !isSelected);
    } else if (onEdit) {
      onEdit(task);
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    
    switch (action) {
      case 'edit':
        onEdit?.(task);
        break;
      case 'clone':
        onClone?.(task);
        break;
      case 'delete':
        onDelete?.(task.id);
        break;
    }
    setShowActions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
        ${priorityColors[task.priority]}
        ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        ${isOverdue ? 'border-r-4 border-r-red-500' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(task.id, e.target.checked);
            }}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          {/* Task ID and Issue Type */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {task.id.slice(0, 8)}
            </span>
            <span className="text-sm">
              {issueTypeIcons[task.issueType]}
            </span>
            {task.storyPoints && (
              <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                {task.storyPoints} SP
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`font-medium text-gray-900 dark:text-white line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
            {task.title}
          </h3>
        </div>

        {/* Priority and Actions */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-sm" title={`Priorität: ${task.priority}`}>
            {priorityIcons[task.priority]}
          </span>
          
          {(isHovered || showActions) && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleActionClick(e, 'edit')}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                title="Bearbeiten"
              >
                <i className="ri-edit-line text-sm"></i>
              </button>
              <button
                onClick={(e) => handleActionClick(e, 'clone')}
                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                title="Klonen"
              >
                <i className="ri-file-copy-line text-sm"></i>
              </button>
              <button
                onClick={(e) => handleActionClick(e, 'delete')}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Löschen"
              >
                <i className="ri-delete-bin-line text-sm"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="text-xs px-2 py-1 rounded-full text-white font-medium"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {!compact && task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {/* Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Unteraufgaben</span>
            <span>{completedSubtasks}/{totalSubtasks}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Left side - Assignee and Watchers */}
        <div className="flex items-center gap-2">
          {/* Assignee Avatar */}
          <div className="flex items-center gap-1">
            <img
              src={task.assignee.avatar}
              alt={task.assignee.name}
              className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
            />
            {showWatchers && watcherCount > 0 && (
              <div className="flex -space-x-1">
                {Array.isArray(task.watchers) ? (
                  task.watchers.slice(0, 3).map((watcher, index) => (
                    <img
                      key={index}
                      src={typeof watcher === 'string' ? '' : watcher.avatar}
                      alt={typeof watcher === 'string' ? watcher : watcher.name}
                      className="w-4 h-4 rounded-full border border-white dark:border-gray-800"
                    />
                  ))
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{watcherCount}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Counts */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {attachmentCount > 0 && (
              <span className="flex items-center gap-1">
                <i className="ri-attachment-line"></i>
                {attachmentCount}
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-1">
                <i className="ri-chat-3-line"></i>
                {commentCount}
              </span>
            )}
          </div>
        </div>

        {/* Right side - Due Date and Sprint */}
        <div className="flex items-center gap-2">
          {/* Sprint Badge */}
          {showSprintInfo && sprint && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
              {sprint.name}
            </span>
          )}

          {/* Due Date */}
          <span className={`text-xs px-2 py-1 rounded-full ${
            isOverdue 
              ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}>
            {new Date(task.dueDate).toLocaleDateString('de-DE', { 
              day: '2-digit', 
              month: '2-digit' 
            })}
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="absolute top-2 right-2">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[task.status]}`}>
          {task.status === 'backlog' && 'Backlog'}
          {task.status === 'todo' && 'To Do'}
          {task.status === 'inProgress' && 'In Progress'}
          {task.status === 'review' && 'Review'}
          {task.status === 'done' && 'Done'}
          {task.status === 'blocked' && 'Blocked'}
          {task.status === 'onHold' && 'On Hold'}
          {task.status === 'cancelled' && 'Cancelled'}
        </span>
      </div>
    </motion.div>
  );
};

export default TaskCard;
