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
  Building2
} from 'lucide-react';
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
  // API Hooks
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
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
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
  const teamMembers = useMemo(() => {
    if (!employeesData || !Array.isArray(employeesData)) {
      return [];
    }

    return employeesData
      .filter(emp => emp.status === 'active')
      .map(employee => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        position: employee.position,
        department: employee.department,
        avatar: employee.avatar || `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=random`,
        email: employee.email,
        phone: employee.phone,
        performance: employee.performance_score,
        status: employee.status === 'active' ? 'online' : 'offline',
        activeProperties: 0,
        completedTasks: 0,
        upcomingAppointments: 0,
        monthlyTarget: 0,
        monthlyAchieved: 0,
        skills: employee.skills || [],
        languages: employee.languages || [],
        lastActivity: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
      }));
  }, [employeesData]);

  const teamStats = useMemo(() => {
    if (!employeesData || !Array.isArray(employeesData) || employeesData.length === 0) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        avgPerformance: 0,
        totalProperties: 0,
        totalTasks: 0,
        totalAppointments: 0,
        totalContacts: 0,
        monthlyTarget: 0,
        monthlyAchieved: 0
      };
    }

    return {
      totalMembers: employeesData.length,
      activeMembers: employeesData.filter((e: any) => e.status === 'active').length,
      avgPerformance: employeesData.reduce((sum: number, e: any) => sum + (e.performance_score || 0), 0) / (employeesData.length || 1),
      totalProperties: Array.isArray(propertiesData) ? propertiesData.length : 0,
      totalTasks: (tasksData?.tasks?.length ?? (typeof tasksData?.total === 'number' ? tasksData.total : 0)),
      totalAppointments: Array.isArray(appointmentsData) ? appointmentsData.length : 0,
      totalContacts: Array.isArray(contactsData) ? contactsData.length : 0,
      monthlyTarget: 0,
      monthlyAchieved: 0
    };
  }, [employeesData, propertiesData, tasksData, appointmentsData, contactsData]);

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
                  <motion.div 
                    className="relative"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    <motion.div 
                      className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full"
                      animate={{ 
                        scale: [1, 2, 1],
                        opacity: [1, 0, 1]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity 
                      }}
                    />
                  </motion.div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    Live Status
                  </span>
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
                  onClick={() => setIsLoading(!isLoading)}
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={statsVariants}
            initial="hidden"
            animate="show"
          >
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

            <motion.div 
              className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-glass p-6 hover:shadow-glass-lg hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 group"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform duration-300">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent">{Math.round(teamStats.avgPerformance)}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Performance</div>
                </div>
              </div>
              <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                <Star className="w-4 h-4 mr-2" />
                <span>Team Durchschnitt</span>
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
