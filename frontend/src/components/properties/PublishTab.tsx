/**
 * PublishTab Component
 * 
 * Main tab for multi-portal publishing with validation, scheduling, and tracking.
 * Portals are only available if connected in SocialHub.
 */

import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Calendar, AlertCircle, CheckCircle, Loader, RefreshCw, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { usePublishing } from '../../hooks/usePublishing';
import { useSocialAccounts } from '../../api/hooks';
import toast from 'react-hot-toast';
import PortalChecklist from './PortalChecklist';
import MappingBadges from './MappingBadges';
import MediaPicker from './MediaPicker';
import PublishStatusTable from './PublishStatusTable';
import { Link } from 'react-router-dom';

interface PublishTabProps {
  propertyId: string;
  property: any; // Property data for validation
}

// Map portal IDs to SocialHub platform names
const PORTAL_TO_PLATFORM: Record<string, string> = {
  'immoscout24': 'immoscout24',
  'immowelt': 'immowelt',
  'wg-gesucht': 'wg-gesucht',
};

const PublishTab: React.FC<PublishTabProps> = ({ propertyId, property }) => {
  // Use publishing hook for real API integration
  const {
    publishJobs,
    propertyPublishJobs,
    isLoadingJobs,
    isPublishing,
    isUnpublishing,
    isRetrying,
    publishProperty,
    unpublishProperty,
    retryPublishJob,
    syncMetrics,
    getPropertyPublishStatus,
    getJobStatusColor,
    getJobStatusText,
  } = usePublishing({ propertyId, autoRefresh: true });

  // Get connected social accounts from SocialHub
  const { data: socialAccounts, isLoading: isLoadingSocialAccounts } = useSocialAccounts();

  // Available portals - enabled only if connected in SocialHub
  const availablePortals = useMemo(() => {
    const connectedPlatforms = new Set(
      socialAccounts?.filter(acc => acc.is_active).map(acc => acc.platform.toLowerCase()) || []
    );

    return [
      {
        id: 'immoscout24',
        name: 'ImmoScout24',
        enabled: connectedPlatforms.has('immoscout24') || connectedPlatforms.has('immo_scout24')
      },
      {
        id: 'immowelt',
        name: 'Immowelt',
        enabled: connectedPlatforms.has('immowelt')
      },
      {
        id: 'wg-gesucht',
        name: 'WG-Gesucht',
        enabled: connectedPlatforms.has('wg-gesucht') || connectedPlatforms.has('wg_gesucht')
      },
    ];
  }, [socialAccounts]);

  // Check if any portals are connected
  const hasConnectedPortals = availablePortals.some(p => p.enabled);

  // Mock profiles (in real implementation, this would come from API)
  const profiles = [
    { id: 'default_profile', name: 'Standard Profil', isDefault: true },
    { id: 'premium_profile', name: 'Premium Profil', isDefault: false },
  ];

  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('default_profile');
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validations, setValidations] = useState<any[]>([]);

  // Get current property publish status
  const publishStatus = getPropertyPublishStatus(propertyId);

  // Mock validations (in real implementation, this would come from API)
  React.useEffect(() => {
    if (selectedPortals.length > 0) {
      // Mock validation results
      const mockValidations = selectedPortals.map(portal => ({
        portal,
        status: 'valid',
        issues: [],
        warnings: []
      }));
      setValidations(mockValidations);
    } else {
      setValidations([]);
    }
  }, [selectedPortals]);

  const handlePublish = async (scheduled: boolean = false) => {
    if (selectedPortals.length === 0) {
      toast.error('Bitte wählen Sie mindestens ein Portal aus.');
      return;
    }

    if (!agreeToTerms) {
      toast.error('Bitte akzeptieren Sie die AGB und Nutzungsbedingungen.');
      return;
    }

    try {
      // Publish to each selected portal
      for (const portal of selectedPortals) {
        await publishProperty(portal, propertyId);
      }

      setSuccessMessage(scheduled ? 'Veröffentlichung erfolgreich geplant!' : 'Veröffentlichung gestartet!');
      setSelectedPortals([]);
      setAgreeToTerms(false);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error publishing:', error);
    }
  };

  const handleUnpublish = async (jobId: string) => {
    try {
      await unpublishProperty(jobId);
    } catch (error) {
      console.error('Error unpublishing:', error);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await retryPublishJob(jobId);
    } catch (error) {
      console.error('Error retrying:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Send className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Portal Veröffentlichung</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Veröffentlichen Sie Ihre Immobilie auf Immobilienportalen</p>
          </div>
        </div>
      </div>

      {/* No Connected Portals Warning */}
      {!isLoadingSocialAccounts && !hasConnectedPortals && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">Keine Portale verbunden</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Um Immobilien auf Portalen zu veröffentlichen, müssen Sie diese zuerst im Social Hub verbinden.
              </p>
              <Link
                to="/social-hub"
                className="inline-flex items-center gap-1 text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline mt-2"
              >
                Zum Social Hub
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-300 font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Configuration Sidebar */}
        <div className="xl:col-span-4 space-y-4">
          <div>
            <PortalChecklist
              portals={availablePortals}
              selectedPortals={selectedPortals}
              onToggle={(portalId) => {
                setSelectedPortals(prev =>
                  prev.includes(portalId) ? prev.filter(p => p !== portalId) : [...prev, portalId]
                );
              }}
            />
          </div>

          {/* Contact Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Kontaktprofil</h3>
            </div>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} {profile.isDefault && '(Standard)'}
                </option>
              ))}
            </select>
          </div>

          {/* Terms Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Ich akzeptiere die AGB und Nutzungsbedingungen der ausgewählten Portale.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => handlePublish(false)}
              disabled={isPublishing || selectedPortals.length === 0 || !agreeToTerms}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isPublishing ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Wird veröffentlicht...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Jetzt veröffentlichen</span>
                </>
              )}
            </button>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Veröffentlichung planen</h4>
              </div>

              <div className="space-y-3">
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {scheduleDate && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Geplant für: {new Date(scheduleDate).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handlePublish(true)}
                  disabled={isPublishing || !scheduleDate || selectedPortals.length === 0 || !agreeToTerms}
                  className="w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Planen</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-6">
          {validations && validations.length > 0 && (
            <div>
              <MappingBadges validations={validations} />
            </div>
          )}

          <div>
            <MediaPicker
              propertyId={propertyId}
              selectedMedia={selectedMedia}
              onSelect={setSelectedMedia}
            />
          </div>

          <div>
            <PublishStatusTable
              jobs={propertyPublishJobs}
              onRetry={handleRetry}
              onDelete={handleUnpublish}
              getJobStatusColor={getJobStatusColor}
              getJobStatusText={getJobStatusText}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishTab;
