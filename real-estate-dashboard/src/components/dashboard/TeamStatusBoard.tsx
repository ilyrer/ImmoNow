import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Target, 
  Award, 
  Clock,
  Phone,
  Mail,
  MapPin,
  Star,
  ChevronRight,
  Filter,
  Search,
  MoreVertical,
  Sparkles,
  Activity,
  RefreshCw,
  ArrowRight,
  UserCheck,
  BarChart3,
  AlertCircle,
  Grid3X3,
  Bell,
  DollarSign,
  Home,
  Building2,
  Plus
} from 'lucide-react';

// Import new hooks and components
import { 
  useTeamDashboard, 
  useActivityFeed, 
  useTeamMetrics,
  usePerformanceTrends,
  useDashboardSummary,
  useFinancialOverview,
  useQuickActions
} from '../../hooks/useTeamPerformance';
import { 
  LiveIndicator, 
  PresenceAvatars, 
  ActivityFeedItem, 
  PerformanceChart 
} from '../shared';

// Legacy imports (will be removed)
import { 
  useEmployees, 
  useProperties, 
  useTasks, 
  useAppointments,
  useContacts,
  useDashboardAnalytics 
} from '../../hooks/useApi';
import ProjectStatusOverview from './TeamStatusComponents/ProjectStatusOverview';
import TasksBoard from './Kanban/TasksBoard';
import CalendarView from './TeamStatusComponents/CalendarView';
import CombinedDashboard from './TeamStatusComponents/CombinedDashboard';

// Typen für die Refs
interface TasksBoardRefHandle {
  getTasks: () => Record<string, any[]>;
}

// Einfache Animationseinstellungen
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

// Spezielle Header-Animationen
const headerVariants = {
  hidden: { 
    opacity: 0, 
    y: -30
  },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.8
    }
  }
};

const statsVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 120,
      damping: 15,
      delay: 0.3
    }
  }
};

const TeamStatusBoard: React.FC = () => {
  const navigate = useNavigate();
  
  // New Live Data Hooks
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const teamDashboard = useTeamDashboard(timeRange);
  const activityFeed = useActivityFeed(20, 0); // Last 20 activities
  const teamMetrics = useTeamMetrics();
  const performanceTrends = usePerformanceTrends();
  
  // New Dashboard Hooks
  const dashboardSummary = useDashboardSummary(timeRange);
  const financialOverview = useFinancialOverview(timeRange);
  const quickActions = useQuickActions();

  // Legacy hooks (will be removed)
  const { data: employeesData, isLoading: employeesLoading } = useEmployees();
  const { data: propertiesData, isLoading: propertiesLoading } = useProperties();
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments();
  const { data: contactsData, isLoading: contactsLoading } = useContacts();
  const { data: analyticsData } = useDashboardAnalytics();

  // State
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'team' | 'projects' | 'combined'>('team');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'kanban' | 'combined'>('dashboard');
  const [tasks, setTasks] = useState<Record<string, any[]>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const tasksRef = useRef<TasksBoardRefHandle>(null);
  
  // Live-Zeit Update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, [timeRange, viewMode, selectedDepartment]);
  
  const updateCalendarData = () => {
    if (tasksRef.current && tasksRef.current.getTasks) {
      setTasks(tasksRef.current.getTasks());
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Transform and process data
  // Live Data Processing
  const teamMembers = useMemo(() => {
    if (!teamDashboard.performance?.members) {
      return [];
    }
    
    return teamDashboard.performance.members.map(member => ({
      id: member.member.id,
      name: member.member.name,
      position: member.member.role,
      department: member.member.department || 'Allgemein',
      avatar: member.member.avatar || `https://ui-avatars.com/api/?name=${member.member.name}&background=random`,
      email: member.member.email,
      phone: '', // Not available in new API
      performance: member.performance_score,
      status: member.member.is_active ? 'online' : 'offline',
      activeProperties: member.properties_active,
      completedTasks: member.tasks_completed,
      upcomingAppointments: member.appointments_upcoming,
      monthlyTarget: 0, // TODO: Add to API
      monthlyAchieved: member.monthly_target_achievement,
      skills: [], // TODO: Add to API
      languages: [], // TODO: Add to API
      lastActivity: member.last_activity || new Date().toISOString()
    }));
  }, [teamDashboard.performance]);

  const teamStats = useMemo(() => {
    // Use dashboard summary data if available, fallback to individual hooks
    const performance = dashboardSummary.data?.performance || teamDashboard.performance;
    const metrics = dashboardSummary.data?.metrics || teamMetrics.data;
    const financial = dashboardSummary.data?.financial || financialOverview.data;
    
    if (!performance && !metrics) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        avgPerformance: 0,
        totalProperties: 0,
        totalTasks: 0,
        totalAppointments: 0,
        totalContacts: 0,
        totalValue: 0,
        revenue: 0,
        growthPercentage: 0,
        successRate: 0,
        teamEfficiency: 0,
        avgProcessingTime: 0
      };
    }

    return {
      totalMembers: performance?.total_members || metrics?.total_members || 0,
      activeMembers: performance?.active_members || metrics?.active_members || 0,
      avgPerformance: performance?.team_performance_score || metrics?.team_performance_score || 0,
      totalProperties: performance?.total_properties_managed || metrics?.total_properties_managed || 0,
      totalTasks: performance?.total_tasks_completed || metrics?.tasks_completed_this_month || 0,
      totalAppointments: performance?.total_appointments_scheduled || metrics?.total_appointments_scheduled || 0,
      totalContacts: performance?.total_contacts_managed || metrics?.total_contacts_managed || 0,
      totalValue: financial?.total_value || 0,
      revenue: financial?.revenue || 0,
      growthPercentage: financial?.growth_percentage || 0,
      successRate: metrics?.avg_completion_rate || 0,
      teamEfficiency: metrics?.team_performance_score || 0,
      avgProcessingTime: metrics?.avg_task_completion_time_hours || 0
    };
  }, [dashboardSummary.data, teamDashboard.performance, teamMetrics.data, financialOverview.data]);

  // Debug logging
  console.log('👥 TeamStatusBoard - Debug Info:', {
    employeesData,
    propertiesData,
    tasksData,
    appointmentsData,
    contactsData,
    analyticsData,
    teamMembers,
    teamStats,
    isLoading: employeesLoading || propertiesLoading || tasksLoading
  });

  // Show loading state
  if (employeesLoading || propertiesLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/30 border-t-emerald-600 mx-auto mb-6"></div>
          <div className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent mb-2">
            Lade Team Dashboard...
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Sammle die neuesten Daten</div>
        </div>
      </div>
    );
  }

  // Filter team members
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Glasmorphism Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="min-h-screen relative">
        <div className="px-8 py-6">
          {/* Glasmorphism Header */}
          <motion.div 
            className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 mb-8"
            variants={headerVariants}
            initial="hidden"
            animate="show"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-glass">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-blue-800 dark:from-white dark:via-emerald-200 dark:to-blue-200 bg-clip-text text-transparent">
                      Team Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Vertriebsteam Performance & Analytics</p>
                  </div>
                </div>
                
                {/* Live Status Indicator */}
                <div className="flex items-center space-x-3">
                  <LiveIndicator isLive={!teamDashboard.isLoading} pulse={true} size="sm" />
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm font-mono">
                    {formatTime(currentTime)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* View Mode Toggle */}
                <div className="flex bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-1.5 shadow-glass-sm">
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      activeView === 'dashboard'
                        ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      if (activeView !== 'kanban') updateCalendarData();
                      setActiveView('kanban');
                    }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      activeView === 'kanban'
                        ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span>Kanban</span>
                  </button>
                  <button
                    onClick={() => setActiveView('combined')}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      activeView === 'combined'
                        ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Kombiniert</span>
                  </button>
                  <button
                    onClick={() => {
                      if (activeView !== 'calendar') updateCalendarData();
                      setActiveView('calendar');
                    }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      activeView === 'calendar'
                        ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Kalender</span>
                  </button>
                </div>

                {/* Dashboard Mode Selector */}
                {activeView === 'dashboard' && (
                  <motion.div 
                    className="flex bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-1.5 shadow-glass-sm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {[
                      { key: 'team', label: 'Team', icon: Users },
                      { key: 'projects', label: 'Projekte', icon: Building2 },
                      { key: 'combined', label: 'Kombiniert', icon: Activity }
                    ].map((mode) => (
                      <button 
                        key={mode.key}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 space-x-2 ${
                          viewMode === mode.key 
                            ? 'bg-white/70 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass-sm border border-white/30 dark:border-white/20'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                        }`}
                        onClick={() => setViewMode(mode.key as any)}
                      >
                        <mode.icon className="w-4 h-4" />
                        <span>{mode.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Time Range Filter */}
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="px-4 py-3 bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm font-medium text-gray-900 dark:text-white shadow-glass-sm hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="week">Diese Woche</option>
                  <option value="month">Letzter Monat</option>
                  <option value="quarter">Letztes Quartal</option>
                </select>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    setIsLoading(true);
                    // Refresh all data
                    dashboardSummary.refetch();
                    financialOverview.refetch();
                    quickActions.refetch();
                    teamDashboard.refetchAll();
                    setTimeout(() => setIsLoading(false), 1000);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500/80 to-blue-600/80 hover:from-emerald-600/90 hover:to-blue-700/90 text-white rounded-xl font-medium shadow-glass hover:shadow-glass-lg transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm border border-white/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Aktualisieren</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Summary Stats */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
            variants={statsVariants}
            initial="hidden"
            animate="show"
          >
            {/* Gesamtwert Karte */}
            <motion.div 
              className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-blue-600/20 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-blue-600/10 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Gesamtwert</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                    {teamStats.totalValue > 0 ? `${(teamStats.totalValue / 1000000).toFixed(1)}M €` : '0 €'}
                  </div>
                </div>
              </div>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>{teamStats.growthPercentage > 0 ? '+' : ''}{teamStats.growthPercentage.toFixed(1)}% vs. Vorquartal</span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">{teamStats.activeMembers}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Aktive Mitarbeiter</div>
                </div>
              </div>
              <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>{teamStats.totalMembers} Gesamt</span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">{teamStats.totalProperties}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Immobilien</div>
                </div>
              </div>
              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>Aktive Listings</span>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-amber-800 dark:from-white dark:to-amber-200 bg-clip-text text-transparent">{teamStats.totalTasks}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Offene Aufgaben</div>
                </div>
              </div>
              <div className="flex items-center text-sm text-amber-600 dark:text-amber-400 font-medium">
                <Clock className="w-4 h-4 mr-2" />
                <span>In Bearbeitung</span>
              </div>
            </motion.div>

            {/* Performance Metriken */}
            <motion.div 
              className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group"
              variants={itemVariants}
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Erfolgsrate</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {Math.round(teamStats.successRate)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span>Team Effizienz</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {Math.round(teamStats.teamEfficiency)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      <span>Bearbeitungszeit</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {Math.round(teamStats.avgProcessingTime)} Tage
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Area */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <>
              {activeView === 'dashboard' ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-8"
                >
                  {/* Team Members Grid */}
                  {(viewMode === 'team' || viewMode === 'combined') && (
                    <motion.div 
                      className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden"
                      variants={itemVariants}
                    >
                      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-blue-400/10 to-emerald-600/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glass">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
                                Team Members
                              </h2>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{teamMembers.length} aktive Mitarbeiter</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {teamMembers.map((member) => (
                            <motion.div
                              key={member.id}
                              className="bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-4 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => navigate(`/team/member/${member.id}`)}
                            >
                              <div className="flex items-center space-x-3 mb-3">
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {member.name}
                                  </h3>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {member.position}
                                  </p>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${
                                  member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-center">
                                <div>
                                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                    {member.activeProperties}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Properties
                                  </div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {member.completedTasks}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Aufgaben
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Live Activity Feed */}
                  {activityFeed.data && (
                    <motion.div 
                      className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden"
                      variants={itemVariants}
                    >
                      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 via-pink-400/10 to-purple-600/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glass">
                              <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">
                                Live Activity Feed
                              </h2>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {activityFeed.data.activities.length} Aktivitäten
                              </p>
                            </div>
                          </div>
                          <LiveIndicator isLive={!activityFeed.isLoading} pulse={true} size="sm" />
                        </div>
                      </div>
                      
                      <div className="p-6 max-h-96 overflow-y-auto">
                        {activityFeed.isLoading ? (
                          <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                          </div>
                        ) : activityFeed.data.activities.length > 0 ? (
                          <div className="space-y-3">
                            {activityFeed.data.activities.map((activity) => (
                              <ActivityFeedItem
                                key={activity.id}
                                activity={activity}
                                className="bg-white/10 dark:bg-white/5"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Keine Aktivitäten verfügbar</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Performance Chart */}
                  {teamDashboard.performance && (
                    <motion.div 
                      className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden"
                      variants={itemVariants}
                    >
                      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 via-indigo-400/10 to-blue-600/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-glass">
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
                              Performance Übersicht
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              Zeitraum: {timeRange}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <PerformanceChart
                          data={[
                            {
                              label: 'Tasks abgeschlossen',
                              value: teamDashboard.performance.total_tasks_completed,
                              color: 'bg-green-500',
                            },
                            {
                              label: 'Properties verwaltet',
                              value: teamDashboard.performance.total_properties_managed,
                              color: 'bg-blue-500',
                            },
                            {
                              label: 'Termine geplant',
                              value: teamDashboard.performance.total_appointments_scheduled,
                              color: 'bg-purple-500',
                            },
                            {
                              label: 'Kontakte verwaltet',
                              value: teamDashboard.performance.total_contacts_managed,
                              color: 'bg-orange-500',
                            },
                          ]}
                          type="bar"
                          showTrend={true}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Schnellaktionen */}
                  {quickActions.data && quickActions.data.length > 0 && (
                    <motion.div 
                      className="bg-gradient-to-br from-green-500/20 via-emerald-400/10 to-green-600/20 dark:from-green-500/10 dark:via-emerald-400/5 dark:to-green-600/10 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden"
                      variants={itemVariants}
                    >
                      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-green-500/20 via-emerald-400/10 to-green-600/20">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-glass">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-green-800 dark:from-white dark:to-green-200 bg-clip-text text-transparent">
                              Schnellaktionen
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {quickActions.data.length} verfügbare Aktionen
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="space-y-3">
                          {quickActions.data.map((action) => (
                            <motion.button
                              key={action.id}
                              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                                action.available
                                  ? 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 cursor-pointer'
                                  : 'bg-gray-100/50 dark:bg-gray-800/50 cursor-not-allowed opacity-50'
                              }`}
                              whileHover={action.available ? { scale: 1.02 } : {}}
                              whileTap={action.available ? { scale: 0.98 } : {}}
                              onClick={() => action.available && navigate(action.url)}
                              disabled={!action.available}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  action.priority === 'high' ? 'bg-red-500/20 text-red-600' :
                                  action.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                                  'bg-blue-500/20 text-blue-600'
                                }`}>
                                  {action.icon === 'plus' && <Plus className="w-4 h-4" />}
                                  {action.icon === 'chart' && <BarChart3 className="w-4 h-4" />}
                                  {action.icon === 'users' && <Users className="w-4 h-4" />}
                                  {action.icon === 'home' && <Home className="w-4 h-4" />}
                                </div>
                                <div className="text-left">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {action.title}
                                  </h3>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {action.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {action.badge && action.badge > 0 && (
                                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                    {action.badge}
                                  </span>
                                )}
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Team Members Grid */}
                  {(viewMode === 'team' || viewMode === 'combined') && (
                    <motion.div 
                      className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass overflow-hidden"
                      variants={itemVariants}
                    >
                      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 via-blue-400/10 to-emerald-600/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-glass">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
                                Team Members
                              </h2>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{filteredMembers.length} aktive Mitarbeiter</p>
                            </div>
                          </div>
                          
                          {/* Search */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Team durchsuchen..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 pr-4 py-2 bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {filteredMembers.map((member, index) => (
                            <motion.div
                              key={member.id}
                              className="bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-4 shadow-glass-sm hover:shadow-glass hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer group"
                              variants={itemVariants}
                              whileHover={{ y: -2, scale: 1.02 }}
                            >
                              <div className="flex items-center space-x-4 mb-4">
                                <div className="relative">
                                  <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg"
                                  />
                                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                    member.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
                                  }`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {member.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {member.position}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Performance</span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {Math.round(member.performance || 0)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, member.performance || 0)}%` }}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      {member.activeProperties}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Immobilien
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      {member.completedTasks}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Aufgaben
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Project Status */}
                  {(viewMode === 'projects' || viewMode === 'combined') && (
                    <motion.div variants={itemVariants}>
                      <ProjectStatusOverview timeRange={timeRange} teamFilter={selectedDepartment} />
                    </motion.div>
                  )}
                </motion.div>
              ) : activeView === 'kanban' ? (
                <TasksBoard ref={tasksRef} />
              ) : activeView === 'combined' ? (
                <CombinedDashboard 
                  timeRange={timeRange}
                  teamFilter={selectedDepartment}
                />
              ) : (
                <CalendarView 
                  timeRange={timeRange}
                  teamFilter={selectedDepartment}
                  onDayDoubleClick={() => {}}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamStatusBoard;
