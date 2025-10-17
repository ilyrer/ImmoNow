/**
 * PublishTab Component
 * 
 * Main tab for multi-portal publishing with validation, scheduling, and tracking.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Calendar, AlertCircle, CheckCircle, Loader, RefreshCw, ExternalLink, Trash2 } from 'lucide-react';
import { usePublishing } from '../../hooks/usePublishing';
import toast from 'react-hot-toast';
import PortalChecklist from './PortalChecklist';
import MappingBadges from './MappingBadges';
import MediaPicker from './MediaPicker';
import PublishStatusTable from './PublishStatusTable';

interface PublishTabProps {
  propertyId: string;
  property: any; // Property data for validation
}

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

  // Available portals (currently only ImmoScout24)
  const availablePortals = [
    { id: 'immoscout24', name: 'ImmoScout24', icon: '🏠', enabled: true },
    { id: 'immowelt', name: 'Immowelt', icon: '🏘️', enabled: false },
    { id: 'wg-gesucht', name: 'WG-Gesucht', icon: '👥', enabled: false },
  ];

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
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30 shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Send className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Multi-Portal Publishing</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Veröffentlichen Sie Ihre Immobilie auf mehreren Portalen gleichzeitig</p>
          </div>
        </div>
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex items-center gap-3 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700/50 rounded-2xl shadow-lg backdrop-blur-xl"
          >
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-green-800 dark:text-green-300 font-semibold text-lg">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Configuration Sidebar */}
        <div className="xl:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PortalChecklist
              portals={availablePortals}
              selectedPortals={selectedPortals}
              onToggle={(portalId) => {
                setSelectedPortals(prev =>
                  prev.includes(portalId) ? prev.filter(p => p !== portalId) : [...prev, portalId]
                );
              }}
            />
          </motion.div>

          {/* Contact Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kontaktprofil</h3>
            </div>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white font-medium"
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} {profile.isDefault && '✨'}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Terms Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300"
          >
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                <strong className="font-semibold">AGB akzeptieren:</strong> Ich akzeptiere die Allgemeinen Geschäftsbedingungen und Nutzungsbedingungen der ausgewählten Portale.
              </span>
            </label>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePublish(false)}
              disabled={isPublishing || selectedPortals.length === 0 || !agreeToTerms}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-300"
            >
              {isPublishing ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Wird veröffentlicht...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Jetzt veröffentlichen</span>
                </>
              )}
            </motion.button>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700/50 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Veröffentlichung planen</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Zeitgesteuerte Freischaltung</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Datum & Uhrzeit wählen
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                {scheduleDate && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl border border-purple-300 dark:border-purple-600"
                  >
                    <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      ⏰ Geplant für: {new Date(scheduleDate).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </motion.div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePublish(true)}
                  disabled={isPublishing || !scheduleDate || selectedPortals.length === 0 || !agreeToTerms}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all duration-300"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Veröffentlichung planen</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-6">
          {validations && validations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MappingBadges validations={validations} />
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MediaPicker
              propertyId={propertyId}
              selectedMedia={selectedMedia}
              onSelect={setSelectedMedia}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PublishStatusTable
              jobs={propertyPublishJobs}
              onRetry={handleRetry}
              onDelete={handleUnpublish}
              getJobStatusColor={getJobStatusColor}
              getJobStatusText={getJobStatusText}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PublishTab;
