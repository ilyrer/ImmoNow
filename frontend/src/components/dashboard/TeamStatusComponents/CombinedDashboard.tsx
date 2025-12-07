import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Award, 
  Clock,
  Star,
  Activity,
  BarChart3,
  Building2,
  Home,
  User,
  CheckCircle,
  AlertCircle,
  Timer,
  Zap,
  ArrowRight,
  UserCheck,
  Briefcase,
  Calendar,
  MessageSquare,
  FileText,
  DollarSign,
  Filter,
  Search,
  RefreshCw,
  Grid3X3,
  List,
  Eye
} from 'lucide-react';
import { 
  useEmployees, 
  useProperties, 
  useTasks, 
  useDashboardAnalytics 
} from '../../../hooks/useApi';

interface CombinedDashboardProps {
  timeRange: string;
  teamFilter: string;
}

const CombinedDashboard: React.FC<CombinedDashboardProps> = ({ timeRange, teamFilter }) => {
  // API Hooks
  const { data: employeesData, isLoading: employeesLoading } = useEmployees();
  const { data: propertiesData, isLoading: propertiesLoading } = useProperties();
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: analyticsData } = useDashboardAnalytics();

  // State
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'focus'>('grid');
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Kombinierte Team-Projekt Daten
  const teamProjectData = useMemo(() => {
    if (!employeesData || !propertiesData || !tasksData) return [];

    const employees = Array.isArray(employeesData) ? employeesData : [];
    const properties = Array.isArray(propertiesData) ? propertiesData : [];
    const tasks = Array.isArray(tasksData) ? tasksData : [];

    return employees.map(employee => {
      // Projekte des Team-Mitglieds (simplified random assignment for demo)
      const memberProjects = properties.filter(prop => 
        prop.id.includes(employee.id.toString().slice(-1)) || 
        Math.random() > 0.7
      );
      
      // Tasks des Team-Mitglieds
      const memberTasks = tasks.filter(task => 
        task.assignee?.id === employee.id || 
        task.assignee_id === employee.id
      );

      // Aktivitäts-Score berechnen
      const completedTasks = memberTasks.filter(task => task.status === 'completed' || task.completed);
      const activeProjects = memberProjects.filter(prop => prop.status === 'aktiv');
      const soldProjects = memberProjects.filter(prop => prop.status === 'verkauft');
      
      const activityScore = Math.min(100, 
        (completedTasks.length * 15) + 
        (activeProjects.length * 10) + 
        (soldProjects.length * 25)
      );

      // Gesamtwert der verwalteten Projekte
      const totalProjectValue = memberProjects.reduce((sum, prop) => sum + (prop.price || 0), 0);

      // Performance-Indikatoren
      const performance = {
        efficiency: Math.min(100, activityScore + Math.floor(Math.random() * 20)),
        quality: Math.min(100, 70 + Math.floor(Math.random() * 30)),
        collaboration: Math.min(100, 60 + Math.floor(Math.random() * 40))
      };

      return {
        ...employee,
        projects: memberProjects,
        tasks: memberTasks,
        stats: {
          totalProjects: memberProjects.length,
          activeProjects: activeProjects.length,
          completedProjects: soldProjects.length,
          totalTasks: memberTasks.length,
          completedTasks: completedTasks.length,
          totalValue: totalProjectValue,
          activityScore,
          performance
        }
      };
    });
  }, [employeesData, propertiesData, tasksData]);

  // Overall Team Statistics
  const teamStats = useMemo(() => {
    if (!teamProjectData.length) return null;

    const totalProjects = teamProjectData.reduce((sum, member) => sum + member.stats.totalProjects, 0);
    const totalTasks = teamProjectData.reduce((sum, member) => sum + member.stats.totalTasks, 0);
    const totalValue = teamProjectData.reduce((sum, member) => sum + member.stats.totalValue, 0);
    const avgActivityScore = teamProjectData.reduce((sum, member) => sum + member.stats.activityScore, 0) / teamProjectData.length;
    
    return {
      totalMembers: teamProjectData.length,
      totalProjects,
      totalTasks,
      totalValue,
      avgActivityScore: Math.round(avgActivityScore),
      activeMembers: teamProjectData.filter(m => m.stats.activityScore > 30).length,
      topPerformers: teamProjectData.filter(m => m.stats.performance.efficiency > 80).length
    };
  }, [teamProjectData]);

  // Filtered Data
  const filteredTeamData = useMemo(() => {
    return teamProjectData.filter(member => {
      const matchesSearch = searchQuery === '' || 
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTeamFilter = teamFilter === 'all' || 
        member.department === teamFilter ||
        (member as any).role === teamFilter;
      
      return matchesSearch && matchesTeamFilter;
    });
  }, [teamProjectData, searchQuery, teamFilter]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Loading state
  if (employeesLoading || propertiesLoading || tasksLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Skeleton */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/30 dark:bg-white/10 rounded-xl w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-32 bg-white/20 dark:bg-white/5 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header mit Team-Übersicht */}
      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-glass">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Team & Projekte
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Integrierte Übersicht über Teammitglieder und ihre Projekte
              </p>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Team durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* View Toggle */}
            <div className="flex bg-white/30 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-2xl p-1">
              {[
                { key: 'grid', icon: Grid3X3, label: 'Karten' },
                { key: 'list', icon: List, label: 'Liste' },
                { key: 'focus', icon: Eye, label: 'Focus' }
              ].map((view) => (
                <button
                  key={view.key}
                  onClick={() => setSelectedView(view.key as any)}
                  className={`px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
                    selectedView === view.key
                      ? 'bg-white/50 dark:bg-white/20 text-gray-900 dark:text-white shadow-glass-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <view.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Stats Overview */}
        {teamStats && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamStats.totalMembers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Team-Mitglieder
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Building2 className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamStats.totalProjects}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Projekte
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/20 to-amber-600/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamStats.totalTasks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Aufgaben
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-violet-600/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(teamStats.totalValue)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Gesamtwert
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-teal-500/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Activity className="w-6 h-6 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamStats.avgActivityScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ø Aktivität
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-rose-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <Award className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teamStats.topPerformers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Top Performer
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Member Cards - Different Views */}
      <AnimatePresence mode="wait">
        {selectedView === 'grid' && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredTeamData.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-6 hover:shadow-glass-lg transition-all cursor-pointer group"
                onClick={() => setSelectedTeamMember(selectedTeamMember === member.id ? null : member.id.toString())}
              >
                {/* Member Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    {/* Activity Indicator */}
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                      member.stats.activityScore > 70 ? 'bg-green-500' : 
                      member.stats.activityScore > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(member as any).role || member.department || 'Team Member'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {member.stats.performance.efficiency}% Effizienz
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project & Task Overview */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {member.stats.totalProjects}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Projekte
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {member.stats.completedTasks}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Erledigte Tasks
                    </div>
                  </div>
                </div>

                {/* Value & Performance */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Projektwert
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(member.stats.totalValue)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Aktivitäts-Score
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {member.stats.activityScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/30 dark:bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${member.stats.activityScore}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedTeamMember === member.id.toString() && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-white/20 dark:border-white/10"
                    >
                      {/* Recent Projects */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Aktuelle Projekte ({member.projects.length})
                        </h4>
                        <div className="space-y-2">
                          {member.projects.slice(0, 3).map((project) => (
                            <div key={project.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400 truncate">
                                {project.title || project.location || `Projekt ${project.id}`}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                project.status === 'verkauft' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                project.status === 'aktiv' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                              }`}>
                                {project.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Performance Metriken
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {member.stats.performance.efficiency}%
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Effizienz
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {member.stats.performance.quality}%
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Qualität
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {member.stats.performance.collaboration}%
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Zusammenarbeit
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {selectedView === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Team Liste
              </h3>
              
              <div className="space-y-4">
                {filteredTeamData.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-white/30 dark:bg-white/10 rounded-2xl hover:bg-white/40 dark:hover:bg-white/15 transition-all cursor-pointer group"
                    onClick={() => setSelectedTeamMember(selectedTeamMember === member.id ? null : member.id.toString())}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glass group-hover:scale-105 transition-transform">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {member.first_name} {member.last_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(member as any).role || member.department || 'Team Member'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {member.stats.totalProjects}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Projekte
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {member.stats.completedTasks}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Tasks
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {member.stats.activityScore}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Aktivität
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(member.stats.totalValue)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Gesamtwert
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {selectedView === 'focus' && (
          <motion.div
            key="focus"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-8"
          >
            {/* Top Performers */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-8">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Top Performer
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Die besten Team-Mitglieder
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {filteredTeamData
                  .sort((a, b) => b.stats.activityScore - a.stats.activityScore)
                  .slice(0, 5)
                  .map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/30 dark:bg-white/10 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {member.first_name} {member.last_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(member.stats.totalValue)} Projektwert
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {member.stats.activityScore}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Score
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Project Distribution */}
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-glass p-8">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Projekt-Verteilung
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Arbeitsbelastung im Team
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {filteredTeamData
                  .sort((a, b) => b.stats.totalProjects - a.stats.totalProjects)
                  .slice(0, 5)
                  .map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {member.first_name} {member.last_name}
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {member.stats.totalProjects}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-white/30 dark:bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (member.stats.totalProjects / Math.max(...filteredTeamData.map(m => m.stats.totalProjects))) * 100)}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CombinedDashboard;
