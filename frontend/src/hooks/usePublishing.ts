/**
 * Publishing Hook
 * 
 * React hook for managing property publishing operations
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  PublishingService, 
  PublishRequest, 
  UnpublishRequest, 
  PublishJobData, 
  MetricsData,
  SyncMetricsResponse 
} from '../services/publishing';

export interface UsePublishingOptions {
  propertyId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const usePublishing = (options: UsePublishingOptions = {}) => {
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Query for publish jobs
  const {
    data: publishJobs = [],
    isLoading: isLoadingJobs,
    error: jobsError,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['publishJobs'],
    queryFn: PublishingService.getPublishJobs,
    refetchInterval: options.autoRefresh ? (options.refreshInterval || 30000) : false,
    staleTime: 10000,
  });

  // Query for specific property's publish jobs
  const {
    data: propertyPublishJobs = [],
    isLoading: isLoadingPropertyJobs,
    error: propertyJobsError
  } = useQuery({
    queryKey: ['publishJobs', options.propertyId],
    queryFn: () => PublishingService.getPublishJobs(),
    enabled: !!options.propertyId,
    select: (jobs) => jobs.filter(job => job.property_id === options.propertyId),
    refetchInterval: options.autoRefresh ? (options.refreshInterval || 30000) : false,
    staleTime: 10000,
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: PublishingService.publishProperty,
    onMutate: () => {
      setIsPublishing(true);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Property published successfully!');
      queryClient.invalidateQueries({ queryKey: ['publishJobs'] });
      if (options.propertyId) {
        queryClient.invalidateQueries({ queryKey: ['publishJobs', options.propertyId] });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to publish property');
    },
    onSettled: () => {
      setIsPublishing(false);
    }
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: PublishingService.unpublishProperty,
    onMutate: () => {
      setIsUnpublishing(true);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Property unpublished successfully!');
      queryClient.invalidateQueries({ queryKey: ['publishJobs'] });
      if (options.propertyId) {
        queryClient.invalidateQueries({ queryKey: ['publishJobs', options.propertyId] });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to unpublish property');
    },
    onSettled: () => {
      setIsUnpublishing(false);
    }
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: PublishingService.retryPublishJob,
    onMutate: () => {
      setIsRetrying(true);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Publish job retried successfully!');
      queryClient.invalidateQueries({ queryKey: ['publishJobs'] });
      if (options.propertyId) {
        queryClient.invalidateQueries({ queryKey: ['publishJobs', options.propertyId] });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to retry publish job');
    },
    onSettled: () => {
      setIsRetrying(false);
    }
  });

  // Sync metrics mutation
  const syncMetricsMutation = useMutation({
    mutationFn: PublishingService.syncAllMetrics,
    onSuccess: (data: SyncMetricsResponse) => {
      toast.success(`Metrics synced: ${data.synced_count} properties updated`);
      queryClient.invalidateQueries({ queryKey: ['propertyMetrics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to sync metrics');
    }
  });

  // Actions
  const publishProperty = useCallback(async (portal: string, propertyId: string) => {
    const request: PublishRequest = {
      portal,
      property_id: propertyId
    };
    return publishMutation.mutateAsync(request);
  }, [publishMutation]);

  const unpublishProperty = useCallback(async (publishJobId: string) => {
    const request: UnpublishRequest = {
      publish_job_id: publishJobId
    };
    return unpublishMutation.mutateAsync(request);
  }, [unpublishMutation]);

  const retryPublishJob = useCallback(async (jobId: string) => {
    return retryMutation.mutateAsync(jobId);
  }, [retryMutation]);

  const syncMetrics = useCallback(async () => {
    return syncMetricsMutation.mutateAsync();
  }, [syncMetricsMutation]);

  // Helper functions
  const getPropertyPublishStatus = useCallback((propertyId: string) => {
    const jobs = publishJobs.filter(job => job.property_id === propertyId);
    const publishedJobs = jobs.filter(job => job.status === 'published');
    const failedJobs = jobs.filter(job => job.status === 'failed');
    const publishingJobs = jobs.filter(job => job.status === 'publishing');
    
    return {
      isPublished: publishedJobs.length > 0,
      isPublishing: publishingJobs.length > 0,
      hasFailed: failedJobs.length > 0,
      publishedPortals: publishedJobs.map(job => job.portal),
      failedPortals: failedJobs.map(job => job.portal),
      jobs: jobs
    };
  }, [publishJobs]);

  const getJobStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'publishing':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'unpublished':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  }, []);

  const getJobStatusText = useCallback((status: string) => {
    switch (status) {
      case 'published':
        return 'Veröffentlicht';
      case 'publishing':
        return 'Wird veröffentlicht...';
      case 'failed':
        return 'Fehlgeschlagen';
      case 'unpublished':
        return 'Nicht veröffentlicht';
      case 'pending':
        return 'Wartend';
      default:
        return status;
    }
  }, []);

  return {
    // Data
    publishJobs,
    propertyPublishJobs,
    
    // Loading states
    isLoadingJobs,
    isLoadingPropertyJobs,
    isPublishing,
    isUnpublishing,
    isRetrying,
    isSyncingMetrics: syncMetricsMutation.isPending,
    
    // Errors
    jobsError,
    propertyJobsError,
    
    // Actions
    publishProperty,
    unpublishProperty,
    retryPublishJob,
    syncMetrics,
    refetchJobs,
    
    // Helper functions
    getPropertyPublishStatus,
    getJobStatusColor,
    getJobStatusText,
    
    // Mutation states
    publishError: publishMutation.error,
    unpublishError: unpublishMutation.error,
    retryError: retryMutation.error,
    syncMetricsError: syncMetricsMutation.error,
  };
};

/**
 * Hook for getting property metrics
 */
export const usePropertyMetrics = (portalPropertyId?: string) => {
  return useQuery({
    queryKey: ['propertyMetrics', portalPropertyId],
    queryFn: () => PublishingService.getPropertyMetrics(portalPropertyId!),
    enabled: !!portalPropertyId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};
