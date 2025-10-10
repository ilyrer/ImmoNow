import React, { useState, useEffect } from 'react';
// @ts-ignore - Notwendig für Kompatibilität mit framer-motion@4.1.17
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ActivityType, 
  ActivityImpact, 
  ActivityTimeRange,
  ActivityFilterParams,
  CreateActivityRequest,
  getActivities,
  createActivity,
  getProjects
} from '../../../api';
import { useCurrentUser } from '../../../hooks/useApi';

interface TeamActivitiesProps {
  timeRange: ActivityTimeRange;
}

// Projektliste kommt aus API (getProjects)

const TeamActivities: React.FC<TeamActivitiesProps> = ({ timeRange }) => {
  const [filter, setFilter] = useState<'all' | ActivityType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // State für erweiterte Filter
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [impactFilter, setImpactFilter] = useState<'all' | ActivityImpact>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // State für verfügbare Projekte
  const [availableProjects, setAvailableProjects] = useState<{ id: string; name: string }[]>([]);

  // State für neuen Eintrag
  const [newActivity, setNewActivity] = useState<Partial<CreateActivityRequest>>({
    type: 'update',
    impact: 'neutral',
    userId: '',
    tags: []
  });
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    if (currentUser) {
      setNewActivity(prev => ({ ...prev, userId: String((currentUser as any).id) }));
    }
  }, [currentUser]);
  
  // State für Activities verwalten
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tag-Input Management 
  const [tagInput, setTagInput] = useState('');

  // Abrufen der Aktivitäten
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        // Filterparameter für API-Anfrage erstellen
        const params: ActivityFilterParams = { 
          timeRange,
          ...(filter !== 'all' && { type: filter }),
          ...(searchTerm && { searchTerm }),
          ...(projectFilter && { projectId: projectFilter }),
          ...(impactFilter !== 'all' && { impact: impactFilter }),
          ...(dateFilter && { date: dateFilter }),
        };
        
        const response = await getActivities(params);
        setActivities(response.items);
      } catch (err) {
        console.error('Fehler beim Laden der Aktivitäten:', err);
        setError('Fehler beim Laden der Aktivitäten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [timeRange, filter, searchTerm, projectFilter, impactFilter, dateFilter]);

  // Abrufen der verfügbaren Projekte
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await getProjects();
        setAvailableProjects(projects);
      } catch (err) {
        console.error('Fehler beim Laden der Projekte:', err);
      }
    };

    fetchProjects();
  }, []);

  // Funktion zum Hinzufügen eines Tags
  const addTag = () => {
    if (tagInput.trim() && newActivity.tags) {
      if (!newActivity.tags.includes(tagInput.trim())) {
        setNewActivity({
          ...newActivity,
          tags: [...newActivity.tags, tagInput.trim()]
        });
      }
      setTagInput('');
    }
  };

  // Funktion zum Entfernen eines Tags
  const removeTag = (tag: string) => {
    if (newActivity.tags) {
      setNewActivity({
        ...newActivity,
        tags: newActivity.tags.filter(t => t !== tag)
      });
    }
  };

  // Funktion zum Erstellen einer neuen Aktivität
  const createNewActivity = async () => {
    if (newActivity.title && newActivity.description && newActivity.date && newActivity.userId && newActivity.type) {
      setLoading(true);
      try {
        const createdActivity = await createActivity(newActivity as CreateActivityRequest);
        setActivities([createdActivity, ...activities]);
        setShowNewEntryModal(false);
        
        // Formular zurücksetzen
        setNewActivity({
          type: 'update',
          impact: 'neutral',
          userId: String((currentUser as any)?.id || ''),
          tags: []
        });
      } catch (err) {
        console.error('Fehler beim Erstellen einer neuen Aktivität:', err);
        setError('Fehler beim Erstellen der Aktivität. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilter('all');
    setSearchTerm('');
    setProjectFilter('');
    setImpactFilter('all');
    setDateFilter('');
    setShowFilterModal(false);
  };

  // Animationseinstellungen
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  // Icon basierend auf dem Aktivitätstyp
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'milestone':
        return 'ri-flag-line';
      case 'achievement':
        return 'ri-award-line';
      case 'update':
        return 'ri-refresh-line';
      case 'feedback':
        return 'ri-chat-smile-3-line';
      default:
        return 'ri-information-line';
    }
  };

  // Hintergrundfarbe basierend auf dem Aktivitätstyp
  const getActivityColor = (type: ActivityType, impact?: ActivityImpact) => {
    if (impact === 'positive') return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    if (impact === 'negative') return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    
    switch (type) {
      case 'milestone':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
      case 'achievement':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'update':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'feedback':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden h-full"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-lg mr-3">
                <i className="ri-team-line text-xl text-white"></i>
              </div>
              <h2 className="text-xl font-bold text-white">Team-Aktivitäten</h2>
            </div>
            <p className="text-sm text-indigo-100 mt-1.5 ml-1">Updates, Meilensteine und Erfolge des Teams</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="inline-flex items-center px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-sm rounded-lg transition-colors"
              onClick={() => setShowFilterModal(true)}
            >
              <i className="ri-filter-3-line mr-1.5"></i> Filter
            </button>
            <button 
              className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 text-sm font-medium rounded-lg transition-colors shadow-sm"
              onClick={() => setShowNewEntryModal(true)}
            >
              <i className="ri-add-line mr-1.5"></i> Neuer Eintrag
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Suchfeld und Filter */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <i className="ri-search-line text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Aktivitäten durchsuchen..."
            className="pl-10 pr-4 py-3 w-full border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter-Buttons */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1.5 scrollbar-thin">
          <button 
            className={`px-3.5 py-1.5 ${filter === 'all' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'} text-xs font-medium rounded-full whitespace-nowrap shadow-sm hover:shadow-md transition-shadow`}
            onClick={() => setFilter('all')}
          >
            Alle Aktivitäten
          </button>
          <button 
            className={`px-3.5 py-1.5 ${filter === 'milestone' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'} text-xs font-medium rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/80 whitespace-nowrap hover:shadow-sm transition-all`}
            onClick={() => setFilter('milestone')}
          >
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></div>
              Meilensteine
            </div>
          </button>
          <button 
            className={`px-3.5 py-1.5 ${filter === 'achievement' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'} text-xs font-medium rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/80 whitespace-nowrap hover:shadow-sm transition-all`}
            onClick={() => setFilter('achievement')}
          >
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></div>
              Erfolge
            </div>
          </button>
          <button 
            className={`px-3.5 py-1.5 ${filter === 'update' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'} text-xs font-medium rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/80 whitespace-nowrap hover:shadow-sm transition-all`}
            onClick={() => setFilter('update')}
          >
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
              Updates
            </div>
          </button>
          <button 
            className={`px-3.5 py-1.5 ${filter === 'feedback' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'} text-xs font-medium rounded-full hover:bg-gray-50 dark:hover:bg-gray-700/80 whitespace-nowrap hover:shadow-sm transition-all`}
            onClick={() => setFilter('feedback')}
          >
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></div>
              Feedback
            </div>
          </button>
        </div>

        {/* Anzeige der aktiven Filter */}
        {(projectFilter || impactFilter !== 'all' || dateFilter) && (
          <div className="flex flex-wrap gap-2 mb-4 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Aktive Filter:</span>
            
            {projectFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700">
                Projekt: {projectFilter}
                <button 
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => setProjectFilter('')}
                >
                  <i className="ri-close-line"></i>
                </button>
              </span>
            )}
            
            {impactFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700">
                Impact: {impactFilter}
                <button 
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => setImpactFilter('all')}
                >
                  <i className="ri-close-line"></i>
                </button>
              </span>
            )}
            
            {dateFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700">
                Datum: {dateFilter}
                <button 
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => setDateFilter('')}
                >
                  <i className="ri-close-line"></i>
                </button>
              </span>
            )}
            
            <button 
              className="ml-auto text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              onClick={resetFilters}
            >
              Alle zurücksetzen
            </button>
          </div>
        )}

        {/* Aktivitäten-Timeline */}
        <div className="overflow-y-auto h-[450px] pr-2">
          <div className="relative pl-8 border-l-2 border-gray-200 dark:border-gray-700 space-y-6 pb-6">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                variants={itemVariants}
                className="relative"
              >
                {/* Zeitpunkt-Marker */}
                <div className="absolute -left-[1.72rem] w-5 h-5 rounded-full bg-white dark:bg-gray-800 border-4 border-indigo-500 dark:border-indigo-400 mt-1.5"></div>
                
                {/* Aktivitätskarte */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    {/* Icon basierend auf Aktivitätstyp */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.type, activity.impact)}`}>
                      <i className={`${getActivityIcon(activity.type)} text-lg`}></i>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex-grow">{activity.title}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <i className="ri-calendar-line mr-1"></i>
                          {activity.date}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{activity.description}</p>
                      
                      {/* Zusatzinformationen */}
                      <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        {/* Benutzer */}
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                            {activity.user.avatar}
                          </div>
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{activity.user.name}</span>
                        </div>
                        
                        {/* Tags */}
                        {activity.tags && (
                          <div className="flex flex-wrap gap-1.5 mt-1 sm:mt-0">
                            {activity.tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md whitespace-nowrap"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Wenn keine Aktivitäten gefunden wurden */}
          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                <i className="ri-search-line text-2xl text-gray-400 dark:text-gray-500"></i>
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Keine Aktivitäten gefunden</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Es wurden keine Team-Aktivitäten gefunden, die den aktuellen Suchkriterien entsprechen.
              </p>
              <button 
                className="mt-4 px-4 py-2 border border-gray-200 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                onClick={() => {
                  setFilter('all');
                  setSearchTerm('');
                }}
              >
                Alle Filter zurücksetzen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal zum Hinzufügen einer neuen Aktivität */}
      {/* @ts-ignore */}
      <AnimatePresence>
        {showNewEntryModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Neue Team-Aktivität hinzufügen</h3>
                  <button 
                    className="text-white/80 hover:text-white"
                    onClick={() => setShowNewEntryModal(false)}
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Typ-Auswahl */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aktivitätstyp</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        className={`p-3 rounded-lg border ${newActivity.type === 'milestone' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'} flex items-center gap-2`}
                        onClick={() => setNewActivity({...newActivity, type: 'milestone'})}
                      >
                        <div className={`w-8 h-8 rounded-lg ${newActivity.type === 'milestone' ? 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'} flex items-center justify-center`}>
                          <i className="ri-flag-line text-lg"></i>
                        </div>
                        <span>Meilenstein</span>
                      </button>
                      <button 
                        className={`p-3 rounded-lg border ${newActivity.type === 'achievement' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'} flex items-center gap-2`}
                        onClick={() => setNewActivity({...newActivity, type: 'achievement'})}
                      >
                        <div className={`w-8 h-8 rounded-lg ${newActivity.type === 'achievement' ? 'bg-amber-100 dark:bg-amber-800/50 text-amber-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'} flex items-center justify-center`}>
                          <i className="ri-award-line text-lg"></i>
                        </div>
                        <span>Erfolg</span>
                      </button>
                      <button 
                        className={`p-3 rounded-lg border ${newActivity.type === 'update' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'} flex items-center gap-2`}
                        onClick={() => setNewActivity({...newActivity, type: 'update'})}
                      >
                        <div className={`w-8 h-8 rounded-lg ${newActivity.type === 'update' ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'} flex items-center justify-center`}>
                          <i className="ri-refresh-line text-lg"></i>
                        </div>
                        <span>Update</span>
                      </button>
                      <button 
                        className={`p-3 rounded-lg border ${newActivity.type === 'feedback' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'} flex items-center gap-2`}
                        onClick={() => setNewActivity({...newActivity, type: 'feedback'})}
                      >
                        <div className={`w-8 h-8 rounded-lg ${newActivity.type === 'feedback' ? 'bg-purple-100 dark:bg-purple-800/50 text-purple-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'} flex items-center justify-center`}>
                          <i className="ri-chat-smile-3-line text-lg"></i>
                        </div>
                        <span>Feedback</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Titel und Beschreibung */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titel <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newActivity.title || ''}
                      onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Titel der Aktivität eingeben"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Beschreibung <span className="text-red-500">*</span></label>
                    <textarea
                      value={newActivity.description || ''}
                      onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      placeholder="Beschreibung der Aktivität eingeben"
                      rows={4}
                      required
                    />
                  </div>
                  
                  {/* Datum und Projekt */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Datum <span className="text-red-500">*</span></label>
                      <input 
                        type="date"
                        value={newActivity.date || ''}
                        onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Projekt</label>
                      <select
                        value={newActivity.projectId || ''}
                        onChange={(e) => setNewActivity({...newActivity, projectId: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Kein Projekt</option>
                        {availableProjects.map(project => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Impact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Impact</label>
                    <div className="flex gap-3">
                      <button 
                        className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center ${newActivity.impact === 'positive' ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setNewActivity({...newActivity, impact: 'positive'})}
                      >
                        <i className="ri-emotion-happy-line mr-1.5"></i> Positiv
                      </button>
                      <button 
                        className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center ${newActivity.impact === 'neutral' ? 'border-gray-500 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setNewActivity({...newActivity, impact: 'neutral'})}
                      >
                        <i className="ri-emotion-normal-line mr-1.5"></i> Neutral
                      </button>
                      <button 
                        className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center ${newActivity.impact === 'negative' ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setNewActivity({...newActivity, impact: 'negative'})}
                      >
                        <i className="ri-emotion-unhappy-line mr-1.5"></i> Negativ
                      </button>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Tag eingeben und Enter drücken"
                      />
                      <button 
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg"
                      >
                        <i className="ri-add-line"></i>
                      </button>
                    </div>
                    
                    {newActivity.tags && newActivity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {newActivity.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md flex items-center gap-1.5"
                          >
                            {tag}
                            <button 
                              className="text-gray-400 hover:text-red-500"
                              onClick={() => removeTag(tag)}
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowNewEntryModal(false)}
                    >
                      Abbrechen
                    </button>
                    <button 
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                      onClick={createNewActivity}
                      disabled={!newActivity.title || !newActivity.description || !newActivity.date}
                    >
                      Aktivität erstellen
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal für erweiterte Filter */}
      {/* @ts-ignore */}
      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Aktivitäten filtern</h3>
                  <button 
                    className="text-white/80 hover:text-white"
                    onClick={() => setShowFilterModal(false)}
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {/* Projekt-Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nach Projekt filtern</label>
                    <select
                      value={projectFilter}
                      onChange={(e) => setProjectFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Alle Projekte</option>
                      {availableProjects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Impact-Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nach Impact filtern</label>
                    <div className="flex gap-2">
                      <button 
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm ${impactFilter === 'all' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setImpactFilter('all')}
                      >
                        Alle
                      </button>
                      <button 
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm ${impactFilter === 'positive' ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setImpactFilter('positive')}
                      >
                        Positiv
                      </button>
                      <button 
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm ${impactFilter === 'neutral' ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setImpactFilter('neutral')}
                      >
                        Neutral
                      </button>
                      <button 
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm ${impactFilter === 'negative' ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                        onClick={() => setImpactFilter('negative')}
                      >
                        Negativ
                      </button>
                    </div>
                  </div>
                  
                  {/* Datum-Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nach Datum filtern</label>
                    <input 
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={resetFilters}
                    >
                      Filter zurücksetzen
                    </button>
                    <button 
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                      onClick={() => setShowFilterModal(false)}
                    >
                      Filter anwenden
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeamActivities;
