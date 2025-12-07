/**
 * ============================================================================
 * KANBAN TYPES & INTERFACES
 * Comprehensive type definitions for the professional task management system
 * ============================================================================
 */

export type TaskPriority = 'critical' | 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type TaskStatus = 
  | 'backlog' 
  | 'todo' 
  | 'inProgress' 
  | 'review' 
  | 'done' 
  | 'blocked'
  | 'onHold'
  | 'cancelled';
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land';
export type FinancingStatus = 'pending' | 'approved' | 'rejected' | 'not_required';

// User/Assignee Types
export interface TaskAssignee {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  email?: string;
}

// Subtask with extended functionality
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignee?: TaskAssignee;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  order: number;
}

// Comment with threading support
export interface TaskComment {
  id: string;
  author: TaskAssignee;
  text: string;
  timestamp: string;
  parentId?: string; // For threading
  mentions?: string[]; // User IDs mentioned
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  attachments?: CommentAttachment[];
  edited?: boolean;
  editedAt?: string;
}

export interface CommentAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

// Activity/Audit Log
export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: TaskAssignee;
  action: 'created' | 'updated' | 'moved' | 'deleted' | 'commented' | 'assigned' | 'status_changed' | 'priority_changed';
  field?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

// Document/Attachment
export interface TaskDocument {
  id: string;
  name: string;
  type: string; // mime type
  url: string;
  size: number;
  uploadedBy: TaskAssignee;
  uploadedAt: string;
  category?: 'expose' | 'contract' | 'invoice' | 'photo' | 'other';
  thumbnail?: string;
  tags?: string[];
}

// Label/Tag
export interface TaskLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
}

// Property/Real Estate Info
export interface PropertyInfo {
  id?: string;
  type?: PropertyType;
  location?: string;
  address?: string;
  price?: number;
  area?: number;
  rooms?: number;
  clientId?: string;
  clientName?: string;
  objectNumber?: string;
}

// Main Task Interface
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: TaskAssignee;
  dueDate: string;
  startDate?: string;
  
  // Progress & Time Tracking
  progress: number; // 0-100
  estimatedHours: number;
  actualHours?: number;
  
  // Organization
  tags: string[];
  labels: TaskLabel[];
  
  // Nested Structure
  subtasks: Subtask[];
  parentTaskId?: string;
  
  // Communication
  comments: TaskComment[];
  watchers?: TaskAssignee[];
  
  // Files
  attachments: TaskDocument[];
  linkedDocuments?: string[];
  
  // Real Estate Specific
  property?: PropertyInfo;
  financingStatus?: FinancingStatus;
  propertyType?: PropertyType;
  location?: string;
  price?: number;
  
  // Additional Properties for API compatibility
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  property_type?: PropertyType;
  property_id?: string;
  client_id?: string;
  issue_type?: string;
  complexity?: string;
  impact_score?: number;
  effort_score?: number;
  blocked_by?: string;
  blocking?: string[];
  custom_fields?: Record<string, any>;
  reporter?: string;
  created_at?: string;
  updated_at?: string;
  
  // Audit Trail
  activityLog: ActivityLogEntry[];
  createdAt: string;
  updatedAt: string;
  createdBy: TaskAssignee;
  
  // Additional Metadata
  archived?: boolean;
  blocked?: {
    reason: string;
    blockedBy?: string;
    blockedAt: string;
  };
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
  };
  dependencies?: string[]; // Task IDs
  
  // Custom Fields (extensible)
  customFields?: Record<string, any>;
}

// Column Configuration
export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  icon: string;
  description: string;
  limit?: number; // WIP limit
  order: number;
  collapsed?: boolean;
}

// Filter Configuration
export interface TaskFilters {
  search?: string;
  priorities?: TaskPriority[];
  statuses?: TaskStatus[];
  assignees?: string[];
  labels?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  properties?: string[];
  clients?: string[];
  overdueOnly?: boolean;
  blockedOnly?: boolean;
  hasAttachments?: boolean;
  hasComments?: boolean;
}

// Saved View
export interface SavedView {
  id: string;
  name: string;
  description?: string;
  filters: TaskFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  columns?: string[];
  isDefault?: boolean;
  isPublic?: boolean;
  createdBy: string;
  createdAt: string;
}

// Board Statistics
export interface BoardStatistics {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  completionRate: number; // percentage
  averageCompletionTime: number; // hours
  tasksByPriority: Record<TaskPriority, number>;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByAssignee: Record<string, number>;
  upcomingDeadlines: Task[];
  recentActivity: ActivityLogEntry[];
}

// Team Performance
export interface TeamMemberPerformance {
  assignee: TaskAssignee;
  activeTasks: number;
  completedTasks: number;
  overdueTaskPercentage: number;
  averageCompletionTime: number;
  workload: number; // estimated hours
  velocity: number; // tasks per week
}

// Bulk Actions
export interface BulkAction {
  type: 'assign' | 'status' | 'priority' | 'delete' | 'archive' | 'add_label' | 'remove_label';
  taskIds: string[];
  value?: any;
}

// Notification
export interface TaskNotification {
  id: string;
  type: 'mention' | 'assigned' | 'due_soon' | 'overdue' | 'comment' | 'status_change';
  taskId: string;
  taskTitle: string;
  message: string;
  timestamp: string;
  read: boolean;
  link: string;
}

// Keyboard Shortcut
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
}

// View Mode
export type ViewMode = 'kanban' | 'list' | 'calendar' | 'timeline' | 'matrix';

// Sort Options
export interface SortOption {
  field: keyof Task;
  order: 'asc' | 'desc';
  label: string;
}

// Export/Import
export interface BoardExport {
  version: string;
  exportedAt: string;
  exportedBy: string;
  tasks: Task[];
  columns: KanbanColumn[];
  labels: TaskLabel[];
  metadata?: Record<string, any>;
}
