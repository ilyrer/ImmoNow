import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useContact,
    useUpdateContact,
    useDeleteContact,
    useLeadScore,
    useAiInsights,
    useNextAction
} from '../../api/hooks';
import apiService from '../../services/api.service';
import toast from 'hot-toast';
import { getRecommendations, getContactOverview } from '../../api/crm/api';
import { listMyCompanyUsers } from '../../api/users/api';

// Import new dashboard components
import {
    CustomerHero,
    AiInsightsPanel,
    NextBestActionCard,
    ActivityStream,
    TasksUpcomingSection,
    AiEmailComposerModal,
    MobileStickyActionBar
} from './dashboard';

/**
 * ContactDetail - Enterprise Customer Dashboard
 * 
 * Single-page view with:
 * - Hero section with lead score and quick actions
 * - AI insights panel (summary, score breakdown, segment)
 * - Next best action recommendations
 * - Activity stream with filters
 * - Tasks and appointments overview
 * - Mobile sticky action bar
 */
const ContactDetailDashboard = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    // React Query hooks
    const { data: contactData, isLoading: contactLoading, error: contactError, refetch: refetchContact } = useContact(id);
    const { data: leadScoreData, isLoading: scoreLoading, refetch: refetchScore } = useLeadScore(id);
    const { data: aiInsightsData, isLoading: insightsLoading, refetch: refetchInsights } = useAiInsights(id);
    const { data: nextActionData, isLoading: actionLoading, refetch: refetchAction } = useNextAction(id);

    const updateContactMutation = useUpdateContact();
    const deleteContactMutation = useDeleteContact();

    // Local state
    const [contact, setContact] = useState(null);
    const [activities, setActivities] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [nextAppointment, setNextAppointment] = useState(null);
    const [docs, setDocs] = useState([]);
    const [userDirectory, setUserDirectory] = useState({});
    const [overview, setOverview] = useState(null);

    // Modal states
    const [showEmailComposer, setShowEmailComposer] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);

    // Task creation state
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDue, setTaskDue] = useState('');
    const [taskPriority, setTaskPriority] = useState('medium');
    const [taskDesc, setTaskDesc] = useState('');

    // Update contact state when data changes
    useEffect(() => {
        if (contactData) {
            setContact(contactData);
        }
    }, [contactData]);

    // Load additional data
    useEffect(() => {
        if (id) {
            loadAdditionalData();
        }
    }, [id]);

    const loadAdditionalData = async () => {
        try {
            // Load 360° overview (CIM data, activities, etc.)
            try {
                const overviewData = await getContactOverview(String(id));
                setOverview(overviewData || null);

                // Extract activities from overview
                if (overviewData?.activities) {
                    setActivities(overviewData.activities);
                }

                // Extract tasks
                if (overviewData?.tasks) {
                    setTasks(overviewData.tasks);
                }

                // Extract next appointment
                if (overviewData?.next_appointment) {
                    setNextAppointment(overviewData.next_appointment);
                }
            } catch (e) {
                console.warn('Overview could not be loaded:', e);
            }

            // Load documents
            try {
                const docList = await apiService.listContactDocuments(id);
                setDocs(Array.isArray(docList) ? docList : []);
            } catch (e) {
                console.warn('Documents could not be loaded:', e);
            }

            // Load user directory for avatars
            try {
                const users = await listMyCompanyUsers();
                if (Array.isArray(users)) {
                    const dir = {};
                    const avatars = {};
                    users.forEach(u => {
                        dir[u.id] = u.name || u.email;
                        if (u.avatar) avatars[u.id] = u.avatar;
                    });
                    setUserDirectory(dir);
                }
            } catch (e) {
                console.warn('User directory could not be loaded:', e);
            }
        } catch (error) {
            console.error('Error loading additional data:', error);
        }
    };

    // Handlers for quick actions
    const handleCall = () => {
        if (contact?.phone) {
            window.location.href = `tel:${contact.phone}`;
            // Log as activity
            logActivity('call', 'Anruf getätigt', `Anruf an ${contact.name}`);
        } else {
            toast.error('Keine Telefonnummer hinterlegt');
        }
    };

    const handleEmail = () => {
        setShowEmailComposer(true);
    };

    const handleAppointment = () => {
        setShowAppointmentModal(true);
    };

    const handleNote = () => {
        const note = prompt('Notiz eingeben:');
        if (note) {
            logActivity('note', 'Notiz hinzugefügt', note);
            toast.success('Notiz gespeichert');
            refetchContact();
        }
    };

    const handleAddActivity = () => {
        // Open activity creation modal (reuse existing logic)
        handleNote();
    };

    const handleCreateTask = () => {
        setShowCreateTaskModal(true);
    };

    const handleSendEmail = (emailData) => {
        // Log email as activity
        logActivity('email', emailData.subject, `E-Mail: ${emailData.preview || emailData.subject}`);
        setShowEmailComposer(false);
        toast.success('E-Mail wurde im Client geöffnet');
        refetchContact();
    };

    const handleMarkActionDone = () => {
        toast.success('Aktion als erledigt markiert');
        refetchAction();
    };

    const handleRefreshAction = () => {
        refetchAction();
        toast.success('Neue Empfehlung wird geladen...');
    };

    const handleGenerateEmail = () => {
        setShowEmailComposer(true);
    };

    // Helper: Log activity
    const logActivity = async (type, title, description) => {
        try {
            await apiService.createContactActivity(id, {
                type,
                title,
                description,
                date: new Date().toISOString()
            });
            // Reload activities
            loadAdditionalData();
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    };

    // Create task handler
    const createContactTask = async () => {
        if (!taskTitle.trim()) {
            toast.error('Bitte einen Titel eingeben');
            return;
        }

        try {
            await apiService.createTask({
                title: taskTitle,
                description: taskDesc,
                due_date: taskDue,
                priority: taskPriority,
                contact_id: id,
                status: 'open'
            });

            toast.success('Aufgabe erstellt');
            setShowCreateTaskModal(false);
            setTaskTitle('');
            setTaskDesc('');
            setTaskDue('');
            setTaskPriority('medium');

            // Reload data
            loadAdditionalData();
        } catch (error) {
            console.error('Task creation error:', error);
            toast.error('Fehler beim Erstellen der Aufgabe');
        }
    };

    // Loading state
    if (contactLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Hero skeleton */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6 animate-pulse">
                        <div className="flex gap-6">
                            <div className="w-24 h-24 bg-white/10 rounded-full"></div>
                            <div className="flex-1 space-y-4">
                                <div className="h-8 bg-white/10 rounded w-1/2"></div>
                                <div className="h-4 bg-white/10 rounded w-1/3"></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center text-gray-400">Lade Kontaktdaten...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (contactError || !contact) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <i className="ri-error-warning-line text-4xl text-red-400"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Kontakt nicht gefunden</h2>
                    <p className="text-gray-400 mb-6">{contactError?.message || 'Dieser Kontakt existiert nicht oder wurde gelöscht.'}</p>
                    <button
                        onClick={() => navigate('/contacts')}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all hover:scale-105"
                    >
                        Zurück zur Übersicht
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 lg:p-6 pb-24 lg:pb-6">
            <div className="max-w-7xl mx-auto">

                {/* Back button */}
                <button
                    onClick={() => navigate('/contacts')}
                    className="mb-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white transition-all"
                >
                    <i className="ri-arrow-left-line"></i>
                    <span>Zurück</span>
                </button>

                {/* Hero Section */}
                <CustomerHero
                    contact={contact}
                    leadScore={leadScoreData}
                    onCall={handleCall}
                    onEmail={handleEmail}
                    onAppointment={handleAppointment}
                    onNote={handleNote}
                    loading={scoreLoading}
                />

                {/* AI Insights Panel */}
                <AiInsightsPanel
                    aiInsights={aiInsightsData}
                    leadScore={leadScoreData}
                    loading={insightsLoading}
                />

                {/* Two-column layout: Next Action + Tasks/Appointments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <NextBestActionCard
                        recommendation={nextActionData?.recommendation}
                        onGenerateEmail={handleGenerateEmail}
                        onMarkDone={handleMarkActionDone}
                        onRefresh={handleRefreshAction}
                        loading={actionLoading}
                    />

                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-indigo-400">{activities.length}</div>
                                <div className="text-xs text-gray-400 mt-1">Aktivitäten</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-purple-400">{tasks.length}</div>
                                <div className="text-xs text-gray-400 mt-1">Aufgaben</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{docs.length}</div>
                                <div className="text-xs text-gray-400 mt-1">Dokumente</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tasks & Appointments */}
                <TasksUpcomingSection
                    tasks={tasks}
                    nextAppointment={nextAppointment}
                    onCreateTask={handleCreateTask}
                    onCreateAppointment={handleAppointment}
                />

                {/* Activity Stream */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl mb-6">
                    <ActivityStream
                        activities={activities}
                        userDirectory={userDirectory}
                        onAddActivity={handleAddActivity}
                    />
                </div>

                {/* Documents Section (Collapsible) */}
                <details className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl mb-6">
                    <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <i className="ri-folder-line text-2xl text-amber-400"></i>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Dokumente</h3>
                                <p className="text-xs text-gray-400">{docs.length} Dateien</p>
                            </div>
                        </div>
                        <i className="ri-arrow-down-s-line text-xl text-gray-400"></i>
                    </summary>
                    <div className="px-6 py-4 border-t border-white/10">
                        {docs.length === 0 ? (
                            <div className="text-center py-8">
                                <i className="ri-file-text-line text-4xl text-gray-400 mb-2"></i>
                                <p className="text-gray-400">Noch keine Dokumente vorhanden</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {docs.map(doc => (
                                    <div key={doc.id} className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
                                        <div className="flex items-start gap-3">
                                            <i className="ri-file-text-line text-2xl text-indigo-400"></i>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                                                <p className="text-xs text-gray-400">{doc.size || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </details>

            </div>

            {/* Modals */}
            <AiEmailComposerModal
                contact={contact}
                isOpen={showEmailComposer}
                onClose={() => setShowEmailComposer(false)}
                onSendEmail={handleSendEmail}
            />

            {/* Mobile Sticky Action Bar */}
            <MobileStickyActionBar
                contact={contact}
                onCall={handleCall}
                onEmail={handleEmail}
                onAppointment={handleAppointment}
                onNote={handleNote}
            />

            {/* Task Creation Modal */}
            {showCreateTaskModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Neue Aufgabe</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Titel</label>
                                <input
                                    type="text"
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="Aufgabe beschreiben..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Fälligkeitsdatum</label>
                                <input
                                    type="date"
                                    value={taskDue}
                                    onChange={(e) => setTaskDue(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Priorität</label>
                                <select
                                    value={taskPriority}
                                    onChange={(e) => setTaskPriority(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <option value="low">Niedrig</option>
                                    <option value="medium">Mittel</option>
                                    <option value="high">Hoch</option>
                                    <option value="urgent">Dringend</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                                <textarea
                                    value={taskDesc}
                                    onChange={(e) => setTaskDesc(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="Weitere Details..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateTaskModal(false)}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-medium transition-all"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={createContactTask}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-semibold transition-all hover:scale-105"
                            >
                                Erstellen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactDetailDashboard;
