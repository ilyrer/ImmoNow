/**
 * Legacy API Structure - Deprecated
 * These files are kept for backward compatibility but should not be used in new code.
 * Use the new services in src/services/ instead.
 */

// Mock API implementations for backward compatibility
export const mockApiService = {
  get: async (url: string) => {
    console.warn(`Legacy API call to ${url} - please update to new services`);
    return { data: null };
  },
  post: async (url: string, data: any) => {
    console.warn(`Legacy API call to ${url} - please update to new services`);
    return { data: null };
  },
  put: async (url: string, data: any) => {
    console.warn(`Legacy API call to ${url} - please update to new services`);
    return { data: null };
  },
  delete: async (url: string) => {
    console.warn(`Legacy API call to ${url} - please update to new services`);
    return { data: null };
  },
};

// Re-export chat API functions
export {
  listConversations,
  getConversation,
  listMessages,
  createConversation,
  sendMessage,
  createMeetingFromChat,
  markConversationRead,
  listCoworkers
} from './chat/api';

// Re-export chat types
export type {
  Conversation,
  ChatMessage,
  ChatUser,
  MessageType,
  ListConversationsResponse,
  ListMessagesResponse,
  SendMessageRequest,
  CreateConversationRequest,
  CreateMeetingFromChatRequest
} from './chat/types';

// Re-export AI Assistant API functions
export {
  suggestTaskPriority,
  generatePropertyDescription,
  analyzeMarketTrends,
  generateMarketingContent,
  checkAIServiceAvailability
} from './aiAssistant/api';

// Re-export AI Assistant types
export type {
  AITaskSuggestion,
  TaskAnalysisParams,
  AIPropertyDescription,
  PropertyDescriptionParams,
  MarketAnalysis,
  MarketAnalysisParams,
  MarketingContent,
  MarketingContentParams
} from './aiAssistant/types';

// Re-export Calendar View API functions
export {
  getCalendarEntries
} from './calendarView/api';

// Re-export Calendar View types
export type {
  CalendarEntry,
  CalendarFilterParams,
  CalendarEntriesResponse,
  TimeRange as CalendarTimeRange,
  EntryType as CalendarEntryType,
  EntryPriority as CalendarEntryPriority,
  EntryStatus as CalendarEntryStatus
} from './calendarView/types';

// Re-export Meeting Notes types and functions
export type {
  MeetingNote,
  MeetingNotesFilterParams,
  TimeRange as MeetingTimeRange,
  CreateMeetingNoteRequest,
  UpdateMeetingNoteRequest,
  MeetingNotesResponse
} from './meetingNotes/types';

export const getMeetingNotes = async (params?: any) => {
  console.warn("getMeetingNotes not implemented - please use specific hooks");
  return { items: [], total: 0 };
};

export const createMeetingNote = async (data: any) => {
  console.warn("createMeetingNote not implemented - please use specific hooks");
  return { 
    id: 'mock',
    title: data.title || '',
    date: data.date || new Date().toISOString(),
    participants: data.participants || [],
    content: data.content || '',
    decisions: data.decisions || [],
    tasks: data.tasks || [],
    category: data.category || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const exportMeetingNote = async (id: string, format?: string) => {
  console.warn("exportMeetingNote not implemented - please use specific hooks");
  return new Blob(['mock content'], { type: 'application/pdf' });
};

// Re-export common time range types with aliases
export type ProjectTimeRange = 'week' | 'month' | 'quarter' | 'year';
export type PerformanceTimeRange = 'week' | 'month' | 'quarter' | 'year';
export type ActivityTimeRange = 'week' | 'month' | 'quarter' | 'year';
export type DeadlineTimeRange = 'all' | 'today' | 'week' | 'month';

// Re-export Task-related types and functions (for TeamStatusComponents)
export type Task = any; // Placeholder - should use proper task type from services
export type TaskStatus = string;
export type TaskPriority = string;
export type TasksKPIData = any;
export type TasksFilterParams = any;

export const getTasks = async (params?: any) => {
  console.warn("getTasks not implemented - use useTasksQuery hook instead");
  return { 
    items: [] as any[], 
    total: 0,
    page: 1,
    size: 10,
    pages: 0
  };
};

export const updateTaskStatus = async (id: string, status: string) => {
  console.warn("updateTaskStatus not implemented - use task mutation hooks instead");
  return { 
    id, 
    status,
    updated_at: new Date().toISOString()
  };
};

export const getTasksKPI = async (params?: any) => {
  console.warn("getTasksKPI not implemented - use analytics hooks instead");
  return {};
};

export const getAvailableTags = async () => {
  console.warn("getAvailableTags not implemented - use metadata hooks instead");
  return [];
};

export const createTask = async (data: any) => {
  console.warn("createTask not implemented - use task mutation hooks instead");
  return { 
    id: 'mock',
    ...data,
    status: data.status || 'todo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

export const updateTask = async (id: string, data: any) => {
  console.warn("updateTask not implemented - use task mutation hooks instead");
  return { 
    id, 
    ...data,
    updated_at: new Date().toISOString()
  };
};

export const deleteTask = async (id: string) => {
  console.warn("deleteTask not implemented - use task mutation hooks instead");
  return { success: true };
};

// Re-export Activity types and functions
export type Activity = any;
export type ActivityType = string;
export type ActivityImpact = string;
export type ActivityFilterParams = any;
export type CreateActivityRequest = any;

export const getActivities = async (params?: any) => {
  console.warn("getActivities not implemented - use activity hooks instead");
  return { items: [], total: 0 };
};

export const createActivity = async (data: any) => {
  console.warn("createActivity not implemented - use activity hooks instead");
  return { id: 'mock' };
};

export const getProjects = async () => {
  console.warn("getProjects not implemented - use project hooks instead");
  return [];
};

export default mockApiService;


