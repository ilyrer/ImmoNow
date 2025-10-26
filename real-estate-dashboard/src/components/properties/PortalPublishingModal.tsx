/**
 * Portal Publishing Modal
 * Modal for publishing properties to external portals (ImmoScout24, Immowelt)
 */

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { portalService } from '../../services/portals.service';
import { usePublishJobs, usePublishProperty, useUnpublishProperty, useRetryPublishJob } from '../../hooks/usePortals';

interface PortalPublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

interface Portal {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  connected: boolean;
}

const PortalPublishingModal: React.FC<PortalPublishingModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle
}) => {
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Hooks
  const { data: publishJobs, isLoading: jobsLoading } = usePublishJobs();
  const publishMutation = usePublishProperty();
  const unpublishMutation = useUnpublishProperty();
  const retryMutation = useRetryPublishJob();

  // Available portals
  const portals: Portal[] = [
    {
      id: 'immoscout24',
      name: 'immoscout24',
      displayName: 'ImmoScout24',
      icon: '🏠',
      color: '#0066cc',
      connected: true // TODO: Check actual connection status
    },
    {
      id: 'immowelt',
      name: 'immowelt',
      displayName: 'Immowelt',
      icon: '🏡',
      color: '#ff6600',
      connected: true // TODO: Check actual connection status
    }
  ];

  // Get publish jobs for this property
  const propertyPublishJobs = publishJobs?.filter(job => job.property_id === propertyId) || [];

  useEffect(() => {
    if (isOpen) {
      setSelectedPortal(null);
      setIsPublishing(false);
    }
  }, [isOpen]);

  const handlePublish = async (portalId: string) => {
    setIsPublishing(true);
    try {
      await publishMutation.mutateAsync({
        portal: portalId as 'immoscout24' | 'immowelt',
        property_id: propertyId
      });
    } catch (error) {
      console.error('Publish error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async (jobId: string) => {
    try {
      await unpublishMutation.mutateAsync({ publish_job_id: jobId });
    } catch (error) {
      console.error('Unpublish error:', error);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await retryMutation.mutateAsync(jobId);
    } catch (error) {
      console.error('Retry error:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'unpublished':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Veröffentlicht';
      case 'failed':
        return 'Fehlgeschlagen';
      case 'pending':
        return 'Wartend';
      case 'unpublished':
        return 'Entfernt';
      default:
        return 'Unbekannt';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Immobilie veröffentlichen
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {propertyTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Available Portals */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Verfügbare Portale
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portals.map((portal) => {
                const existingJob = propertyPublishJobs.find(job => job.portal === portal.id);
                const isPublished = existingJob?.status === 'published';
                const isFailed = existingJob?.status === 'failed';
                
                return (
                  <div
                    key={portal.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedPortal === portal.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{portal.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {portal.displayName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {portal.connected ? 'Verbunden' : 'Nicht verbunden'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {existingJob && getStatusIcon(existingJob.status)}
                        {existingJob && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getStatusText(existingJob.status)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {!existingJob || existingJob.status === 'unpublished' ? (
                        <button
                          onClick={() => handlePublish(portal.id)}
                          disabled={!portal.connected || isPublishing}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            portal.connected && !isPublishing
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isPublishing ? 'Veröffentliche...' : 'Veröffentlichen'}
                        </button>
                      ) : existingJob.status === 'published' ? (
                        <button
                          onClick={() => handleUnpublish(existingJob.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Entfernen
                        </button>
                      ) : existingJob.status === 'failed' ? (
                        <button
                          onClick={() => handleRetry(existingJob.id)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center space-x-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Wiederholen</span>
                        </button>
                      ) : null}

                      {existingJob?.portal_url && (
                        <a
                          href={existingJob.portal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Ansehen</span>
                        </a>
                      )}
                    </div>

                    {existingJob?.error_message && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-sm text-red-700 dark:text-red-400">
                          {existingJob.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Publish History */}
          {propertyPublishJobs.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Veröffentlichungshistorie
              </h3>
              <div className="space-y-3">
                {propertyPublishJobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {portalService.getPortalIcon(job.portal)}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {portalService.getPortalDisplayName(job.portal)}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Erstellt: {new Date(job.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getStatusText(job.status)}
                        </span>
                      </div>
                    </div>
                    
                    {job.published_at && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Veröffentlicht: {new Date(job.published_at).toLocaleDateString('de-DE')}
                      </p>
                    )}
                    
                    {job.unpublished_at && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Entfernt: {new Date(job.unpublished_at).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalPublishingModal;
