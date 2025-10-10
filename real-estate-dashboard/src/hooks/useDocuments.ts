import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '../services/documents';
import { DocumentListParams, UploadDocumentParams } from '../services/documents';
import { CreateFolderRequest } from '../lib/api/types';

// Query Keys
export const documentKeys = {
  documents: ['documents'] as const,
  list: (params: DocumentListParams) => ['documents', 'list', params] as const,
  folders: ['documents', 'folders'] as const,
  analytics: ['documents', 'analytics'] as const,
};

// Hooks
export const useDocuments = (params: DocumentListParams) => {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentsService.listDocuments(params),
    staleTime: 120_000, // 2 minutes
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: UploadDocumentParams) => documentsService.uploadDocument(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.documents });
      queryClient.invalidateQueries({ queryKey: documentKeys.analytics });
    },
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => documentsService.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.documents });
    },
    // Optimistic update
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.documents });
      
      const previousData = queryClient.getQueriesData({ queryKey: documentKeys.documents });
      
      queryClient.setQueriesData({ queryKey: documentKeys.documents }, (old: any) => {
        if (!old) return old;
        
        if (old.items) {
          return {
            ...old,
            items: old.items.map((doc: any) => 
              doc.id === id ? { ...doc, is_favorite: !doc.is_favorite } : doc
            ),
          };
        }
        
        if (Array.isArray(old)) {
          return old.map((doc: any) => 
            doc.id === id ? { ...doc, is_favorite: !doc.is_favorite } : doc
          );
        }
        
        return old;
      });
      
      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => documentsService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.documents });
      queryClient.invalidateQueries({ queryKey: documentKeys.analytics });
    },
  });
};

export const useDocumentFolders = () => {
  return useQuery({
    queryKey: documentKeys.folders,
    queryFn: () => documentsService.listFolders(),
    staleTime: 300_000, // 5 minutes
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateFolderRequest) => documentsService.createFolder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.folders });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => documentsService.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.folders });
    },
  });
};

export const useDocumentAnalytics = () => {
  return useQuery({
    queryKey: documentKeys.analytics,
    queryFn: () => documentsService.getAnalytics(),
    staleTime: 300_000, // 5 minutes
  });
};

export const useForceUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: UploadDocumentParams) => documentsService.uploadDocument(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.documents });
      queryClient.invalidateQueries({ queryKey: documentKeys.analytics });
    },
  });
};
