import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Calendar,
  Bell,
  CheckCircle,
  XCircle,
  Info,
  Star,
  Users,
  Building2,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MessageCircle,
  Eye,
  Filter,
  Settings,
  Plus,
  MoreVertical,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface Alert {
  id: string;
  type: 'deadline' | 'contract_expiry' | 'priority_lead' | 'financial' | 'maintenance' | 'legal';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  dueDate: string;
  createdAt: string;
  status: 'active' | 'dismissed' | 'completed' | 'snoozed';
  relatedEntity?: string;
  relatedEntityType?: 'property' | 'contact' | 'contract' | 'task';
  actionRequired?: boolean;
  estimatedTime?: string;
  assignedTo?: string;
}

interface AlertRule {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  criteria: { [key: string]: any };
  notificationMethods: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertStats {
  total: number;
  byPriority: { [key: string]: number };
  byType: { [key: string]: number };
  byStatus: { [key: string]: number };
  overdueCount: number;
  todayCount: number;
  weekCount: number;
}

const AlertsModule: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'high' | 'today'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showRules, setShowRules] = useState(false);

  // Mock alerts data
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'deadline',
      priority: 'critical',
      title: 'Mietvertrag läuft ab',
      message: 'Der Mietvertrag für Hamburg Altona Penthouse läuft in 7 Tagen ab. Verlängerung oder Neuvermietung erforderlich.',
      dueDate: '2024-02-08',
      createdAt: '2024-01-25',
      status: 'active',
      relatedEntity: 'Hamburg Altona Penthouse',
      relatedEntityType: 'property',
      actionRequired: true,
      estimatedTime: '2 Stunden',
      assignedTo: 'M. Schmidt'
    },
    {
      id: '2',
      type: 'priority_lead',
      priority: 'high',
      title: 'Hochweriger Lead wartet',
      message: 'Institutioneller Investor mit Budget 5M€ seit 3 Tagen ohne Antwort. Sofortiger Kontakt empfohlen.',
      dueDate: '2024-02-02',
      createdAt: '2024-01-30',
      status: 'active',
      relatedEntity: 'Pension Capital GmbH',
      relatedEntityType: 'contact',
      actionRequired: true,
      estimatedTime: '30 Minuten',
      assignedTo: 'A. Müller'
    },
    {
      id: '3',
      type: 'financial',
      priority: 'high',
      title: 'Darlehensrate überfällig',
      message: 'Monatliche Darlehensrate für Frankfurt Bürokomplex ist 5 Tage überfällig. Bank kontaktiert.',
      dueDate: '2024-01-28',
      createdAt: '2024-01-28',
      status: 'active',
      relatedEntity: 'Frankfurt Bürokomplex',
      relatedEntityType: 'property',
      actionRequired: true,
      estimatedTime: '1 Stunde',
      assignedTo: 'T. Fischer'
    },
    {
      id: '4',
      type: 'contract_expiry',
      priority: 'medium',
      title: 'Verwaltungsvertrag endet bald',
      message: 'Hausverwaltungsvertrag für Köln Ehrenfeld läuft in 30 Tagen ab. Erneuerung prüfen.',
      dueDate: '2024-03-01',
      createdAt: '2024-01-15',
      status: 'active',
      relatedEntity: 'Köln Ehrenfeld Mehrfamilienhaus',
      relatedEntityType: 'property',
      actionRequired: false,
      estimatedTime: '45 Minuten',
      assignedTo: 'L. Wagner'
    },
    {
      id: '5',
      type: 'maintenance',
      priority: 'medium',
      title: 'Wartungsinspektion fällig',
      message: 'Jährliche Heizungswartung für Berlin Mitte Loft ist überfällig. Termin vereinbaren.',
      dueDate: '2024-02-01',
      createdAt: '2024-01-20',
      status: 'active',
      relatedEntity: 'Berlin Mitte Loft',
      relatedEntityType: 'property',
      actionRequired: true,
      estimatedTime: '20 Minuten',
      assignedTo: 'S. Weber'
    },
    {
      id: '6',
      type: 'legal',
      priority: 'high',
      title: 'Rechtsstreit Frist läuft ab',
      message: 'Einspruchsfrist für Mieterhöhungsklage läuft in 3 Tagen ab. Anwalt informieren.',
      dueDate: '2024-02-04',
      createdAt: '2024-01-22',
      status: 'active',
      relatedEntity: 'München Schwabing Villa',
      relatedEntityType: 'property',
      actionRequired: true,
      estimatedTime: '3 Stunden',
      assignedTo: 'M. Schmidt'
    },
    {
      id: '7',
      type: 'priority_lead',
      priority: 'medium',
      title: 'Follow-up erforderlich',
      message: 'Interessent für Gewerbeimmobilie wartet seit 5 Tagen auf Exposé. Nachfassen.',
      dueDate: '2024-02-03',
      createdAt: '2024-01-29',
      status: 'active',
      relatedEntity: 'TechStart Solutions',
      relatedEntityType: 'contact',
      actionRequired: true,
      estimatedTime: '15 Minuten',
      assignedTo: 'A. Müller'
    },
    {
      id: '8',
      type: 'deadline',
      priority: 'low',
      title: 'Versicherung läuft aus',
      message: 'Gebäudeversicherung für Studentenwohnungen läuft in 45 Tagen aus. Verlängerung prüfen.',
      dueDate: '2024-03-15',
      createdAt: '2024-01-10',
      status: 'active',
      relatedEntity: 'Studentenwohnungen Block A',
      relatedEntityType: 'property',
      actionRequired: false,
      estimatedTime: '30 Minuten',
      assignedTo: 'L. Wagner'
    }
  ];

  const alertRules: AlertRule[] = [
    {
      id: '1',
      name: 'Mietvertrag Ablauf Warnung',
      type: 'contract_expiry',
      enabled: true,
      criteria: { daysBeforeExpiry: 30, contractType: 'rental' },
      notificationMethods: ['email', 'dashboard', 'sms'],
      priority: 'high'
    },
    {
      id: '2',
      name: 'Hochwertige Leads',
      type: 'priority_lead',
      enabled: true,
      criteria: { budgetMin: 1000000, responseTime: 24 },
      notificationMethods: ['email', 'dashboard'],
      priority: 'critical'
    },
    {
      id: '3',
      name: 'Überfällige Zahlungen',
      type: 'financial',
      enabled: true,
      criteria: { daysOverdue: 5, minAmount: 1000 },
      notificationMethods: ['email', 'dashboard', 'sms'],
      priority: 'high'
    },
    {
      id: '4',
      name: 'Wartungserinnerungen',
      type: 'maintenance',
      enabled: true,
      criteria: { maintenanceType: 'annual', daysBeforeDue: 14 },
      notificationMethods: ['email', 'dashboard'],
      priority: 'medium'
    }
  ];

  // Calculate alert statistics
  const alertStats: AlertStats = {
    total: alerts.length,
    byPriority: alerts.reduce((acc, alert) => {
      acc[alert.priority] = (acc[alert.priority] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }),
    byType: alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }),
    byStatus: alerts.reduce((acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number }),
    overdueCount: alerts.filter(alert => new Date(alert.dueDate) < new Date() && alert.status === 'active').length,
    todayCount: alerts.filter(alert => {
      const today = new Date().toISOString().split('T')[0];
      return alert.dueDate === today && alert.status === 'active';
    }).length,
    weekCount: alerts.filter(alert => {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const alertDate = new Date(alert.dueDate);
      return alertDate <= weekFromNow && alert.status === 'active';
    }).length
  };

  const COLORS = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    purple: '#8B5CF6',
    teal: '#0D9488'
  };

  const PIE_COLORS = [COLORS.danger, COLORS.warning, COLORS.accent, COLORS.success];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <Info className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <Calendar className="w-5 h-5" />;
      case 'contract_expiry': return <FileText className="w-5 h-5" />;
      case 'priority_lead': return <Star className="w-5 h-5" />;
      case 'financial': return <DollarSign className="w-5 h-5" />;
      case 'maintenance': return <Building2 className="w-5 h-5" />;
      case 'legal': return <AlertTriangle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deadline': return 'Fristen';
      case 'contract_expiry': return 'Vertragsabläufe';
      case 'priority_lead': return 'Priority Leads';
      case 'financial': return 'Finanzen';
      case 'maintenance': return 'Wartung';
      case 'legal': return 'Rechtlich';
      default: return 'Sonstige';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Morgen';
    if (diffDays === -1) return 'Gestern';
    if (diffDays > 0) return `In ${diffDays} Tagen`;
    return `Vor ${Math.abs(diffDays)} Tagen`;
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (selectedFilter === 'active' && alert.status !== 'active') return false;
    if (selectedFilter === 'high' && !['high', 'critical'].includes(alert.priority)) return false;
    if (selectedFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (alert.dueDate !== today) return false;
    }
    if (selectedType !== 'all' && alert.type !== selectedType) return false;
    return true;
  });

  // Prepare chart data
  const priorityChartData = Object.entries(alertStats.byPriority).map(([priority, count]) => ({
    priority: priority === 'critical' ? 'Kritisch' : 
              priority === 'high' ? 'Hoch' : 
              priority === 'medium' ? 'Mittel' : 'Niedrig',
    count
  }));

  const typeChartData = Object.entries(alertStats.byType).map(([type, count]) => ({
    type: getTypeLabel(type),
    count
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <span>Automatische Alerts</span>
            {alertStats.overdueCount > 0 && (
              <div className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                {alertStats.overdueCount} überfällig
              </div>
            )}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Fristen, Vertragsabläufe und Prioritätsleads im Überblick
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Filter Buttons */}
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            {(['all', 'active', 'high', 'today'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedFilter === filter
                    ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {filter === 'all' ? 'Alle' : 
                 filter === 'active' ? 'Aktiv' : 
                 filter === 'high' ? 'Hoch' : 'Heute'}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
          >
            <option value="all">Alle Typen</option>
            <option value="deadline">Fristen</option>
            <option value="contract_expiry">Vertragsabläufe</option>
            <option value="priority_lead">Priority Leads</option>
            <option value="financial">Finanzen</option>
            <option value="maintenance">Wartung</option>
            <option value="legal">Rechtlich</option>
          </select>

          {/* Rules Button */}
          <button
            onClick={() => setShowRules(!showRules)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Regeln</span>
          </button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt Alerts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertStats.total}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {alertStats.byStatus.active || 0} aktiv
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Überfällig</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{alertStats.overdueCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sofort handeln
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Heute fällig</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{alertStats.todayCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Bis Ende des Tages
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Diese Woche</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{alertStats.weekCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Nächste 7 Tage
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Management Rules (Conditional) */}
      {showRules && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alert-Regeln</h3>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Neue Regel</span>
              </button>
              <button
                onClick={() => setShowRules(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {alertRules.map((rule, index) => (
              <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(rule.priority)}`}>
                        {rule.priority === 'critical' ? 'Kritisch' : 
                         rule.priority === 'high' ? 'Hoch' : 
                         rule.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {rule.notificationMethods.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Alert List */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aktuelle Alerts ({filteredAlerts.length})
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedFilter === 'all' ? 'Alle Alerts' : 
               selectedFilter === 'active' ? 'Nur aktive' : 
               selectedFilter === 'high' ? 'Hohe Priorität' : 'Heute fällig'}
            </div>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  isOverdue(alert.dueDate) 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      alert.type === 'priority_lead' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      alert.type === 'financial' ? 'bg-green-100 dark:bg-green-900/30' :
                      alert.type === 'legal' ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {alert.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center space-x-1 ${getPriorityColor(alert.priority)}`}>
                          {getPriorityIcon(alert.priority)}
                          <span>{alert.priority === 'critical' ? 'Kritisch' : 
                                alert.priority === 'high' ? 'Hoch' : 
                                alert.priority === 'medium' ? 'Mittel' : 'Niedrig'}</span>
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span className={isOverdue(alert.dueDate) ? 'text-red-600 dark:text-red-400' : ''}>
                            {formatDate(alert.dueDate)}
                          </span>
                        </div>
                        
                        {alert.relatedEntity && (
                          <div className="flex items-center space-x-1">
                            {alert.relatedEntityType === 'property' ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                            <span>{alert.relatedEntity}</span>
                          </div>
                        )}
                        
                        {alert.estimatedTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{alert.estimatedTime}</span>
                          </div>
                        )}
                        
                        {alert.assignedTo && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{alert.assignedTo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {alert.actionRequired && (
                      <div className="flex space-x-1">
                        <button className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                          <Phone className="w-3 h-3" />
                        </button>
                        <button className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                          <Mail className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredAlerts.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Keine Alerts gefunden
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Alle Alerts für die gewählten Filter sind bereits bearbeitet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Alert Analytics */}
        <div className="space-y-6">
          {/* Priority Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Prioritätsverteilung</h4>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="count"
                    nameKey="priority"
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2 mt-4">
              {priorityChartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    ></div>
                    <span className="text-gray-700 dark:text-gray-300">{item.priority}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alert-Typen</h4>
            
            <div className="space-y-3">
              {typeChartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.type}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.count}</span>
                    <div className="w-16 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(item.count / alertStats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schnellaktionen</h4>
            
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-left flex items-center justify-between">
                <span className="font-medium">Alle überfälligen bearbeiten</span>
                <span className="text-sm">{alertStats.overdueCount}</span>
              </button>
              
              <button className="w-full px-4 py-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors text-left flex items-center justify-between">
                <span className="font-medium">Heutige Alerts prüfen</span>
                <span className="text-sm">{alertStats.todayCount}</span>
              </button>
              
              <button className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left">
                <span className="font-medium">Neue Alert-Regel erstellen</span>
              </button>
              
              <button className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors text-left">
                <span className="font-medium">Alert-Einstellungen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsModule;
