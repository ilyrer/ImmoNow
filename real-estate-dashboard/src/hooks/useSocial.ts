/**
 * Social Media Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialService } from '../services/social';
import socialApi, { SocialAccount, SocialPost, SocialTemplate, SocialAnalytics, CreatePostRequest, CreateTemplateRequest, UpdateTemplateRequest, PublishPostRequest, SchedulePostRequest } from '../api/social';
import { toast } from 'react-hot-toast';

// Query Keys
export const socialKeys = {
  all: ['social'] as const,
  accounts: () => [...socialKeys.all, 'accounts'] as const,
  posts: (filters?: any) => [...socialKeys.all, 'posts', filters] as const,
  templates: (templateType?: string) => [...socialKeys.all, 'templates', templateType] as const,
  analytics: (params?: any) => [...socialKeys.all, 'analytics', params] as const,
  queue: () => [...socialKeys.all, 'queue'] as const,
  media: () => [...socialKeys.all, 'media'] as const,
};

// Account Hooks
export const useSocialAccounts = () => {
  return useQuery({
    queryKey: socialKeys.accounts(),
    queryFn: socialService.getAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useConnectAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ platform, token, accountId }: { platform: string; token: string; accountId: string }) =>
      socialService.connectAccount(platform, token, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
      toast.success('Account erfolgreich verbunden');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Verbinden: ${error.message}`);
    },
  });
};

export const useDisconnectAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: socialService.disconnectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
      toast.success('Account erfolgreich getrennt');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Trennen: ${error.message}`);
    },
  });
};

export const useRefreshAccountToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: socialService.refreshAccountToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
      toast.success('Token erfolgreich erneuert');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Token-Refresh: ${error.message}`);
    },
  });
};

// Post Hooks
export const useSocialPosts = (filters?: {
  status?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: socialKeys.posts(filters),
    queryFn: () => socialService.getPosts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePostRequest) => socialService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
      queryClient.invalidateQueries({ queryKey: socialKeys.queue() });
      toast.success('Post erfolgreich erstellt');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: Partial<CreatePostRequest> }) =>
      socialService.updatePost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
      queryClient.invalidateQueries({ queryKey: socialKeys.queue() });
      toast.success('Post erfolgreich aktualisiert');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: socialService.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
      queryClient.invalidateQueries({ queryKey: socialKeys.queue() });
      toast.success('Post erfolgreich gelöscht');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });
};

export const usePublishPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: PublishPostRequest }) =>
      socialService.publishPost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
      queryClient.invalidateQueries({ queryKey: socialKeys.queue() });
      queryClient.invalidateQueries({ queryKey: socialKeys.analytics() });
      toast.success('Post erfolgreich veröffentlicht');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Veröffentlichen: ${error.message}`);
    },
  });
};

export const useSchedulePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: SchedulePostRequest }) =>
      socialService.schedulePost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
      queryClient.invalidateQueries({ queryKey: socialKeys.queue() });
      toast.success('Post erfolgreich geplant');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Planen: ${error.message}`);
    },
  });
};

// Template Hooks
export const useSocialTemplates = (templateType?: string) => {
  return useQuery({
    queryKey: socialKeys.templates(templateType),
    queryFn: () => socialService.getTemplates(templateType),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTemplateRequest) => socialService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.templates() });
      toast.success('Vorlage erfolgreich erstellt');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: UpdateTemplateRequest }) =>
      socialService.updateTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.templates() });
      toast.success('Vorlage erfolgreich aktualisiert');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: socialService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.templates() });
      toast.success('Vorlage erfolgreich gelöscht');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });
};

// Analytics Hooks
export const useSocialAnalytics = (params?: {
  start_date?: string;
  end_date?: string;
  platform?: string;
}) => {
  return useQuery({
    queryKey: socialKeys.analytics(params),
    queryFn: () => socialService.getAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Queue Hooks
export const useSocialQueue = () => {
  return useQuery({
    queryKey: socialKeys.queue(),
    queryFn: socialService.getQueue,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// OAuth Hooks
export const useStartOAuth = () => {
  return useMutation({
    mutationFn: socialService.startOAuth,
    onError: (error: any) => {
      toast.error(`Fehler beim OAuth-Start: ${error.message}`);
    },
  });
};

export const useOAuthCallback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ platform, code, state }: { platform: string; code: string; state?: string }) =>
      socialService.oauthCallback(platform, code, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
      toast.success('OAuth-Verbindung erfolgreich');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim OAuth-Callback: ${error.message}`);
    },
  });
};

export const useRefreshOAuthToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: socialService.refreshOAuthToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
      toast.success('OAuth-Token erfolgreich erneuert');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Token-Refresh: ${error.message}`);
    },
  });
};

// Media Hooks
export const useSocialMedia = () => {
  return useQuery({
    queryKey: socialKeys.media(),
    queryFn: socialService.getMedia,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUploadMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: socialService.uploadMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.media() });
      toast.success('Medien erfolgreich hochgeladen');
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Hochladen: ${error.message}`);
    },
  });
};

// Utility Hooks
export const useSocialStats = () => {
  const { data: accounts } = useSocialAccounts();
  const { data: posts } = useSocialPosts();
  const { data: queue } = useSocialQueue();
  
  // Handle different data structures with explicit typing
  const accountsArray = Array.isArray(accounts) ? accounts : [];
  const postsArray = Array.isArray(posts) ? posts : ((posts as any)?.items || []);
  const queueArray = Array.isArray(queue) ? queue : [];
  
  const connectedAccounts = accountsArray.filter(acc => acc.status === 'active').length;
  const pendingPosts = postsArray.filter(post => post.status === 'draft').length;
  const scheduledPosts = postsArray.filter(post => post.status === 'scheduled').length;
  const totalEngagements = postsArray.reduce((sum, post) => {
    return sum + (post.engagement?.likes || 0) + (post.engagement?.comments || 0) + (post.engagement?.shares || 0);
  }, 0);
  
  return {
    connectedAccounts,
    pendingPosts,
    scheduledPosts,
    totalEngagements,
    isLoading: !accounts || !posts || !queue
  };
};

export const useSocialActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: ['social-activities', limit],
    queryFn: () => socialApi.getActivities(limit),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};