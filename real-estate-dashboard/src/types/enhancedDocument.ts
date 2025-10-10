// Simple interface for enhanced document API compatibility
export interface EnhancedDocument {
  id: number | string;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type?: string;
  visibility: string;
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  is_favorite: boolean;
  version_count?: number;
  tags: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}

export interface EnhancedDocumentTag {
  id: number;
  name: string;
  color: string;
  description?: string;
  usage_count?: number;
  usageCount?: number; // Alias for compatibility
  created_at: string;
}

export interface DocumentAnalytics {
  total_documents?: number;
  visibility_breakdown: {
    private: number;
    team: number;
    shared: number;
    public: number;
  };
  most_viewed: Array<{
    id: number;
    title: string;
    view_count: number;
  }>;
  recent_activity: Array<{
    id: number;
    title: string;
    action: string;
    timestamp: string;
    user: string;
  }>;
  tag_usage?: Array<{
    tag_name: string;
    usage_count: number;
    color: string;
  }>;
  user_activity?: Array<{
    user: string;
    document_count: number;
  }>;
  storage_stats?: {
    total_size_bytes: number;
    total_size_mb: number;
    document_count: number;
    average_size_mb: number;
  };
}
