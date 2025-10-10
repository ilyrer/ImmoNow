import React, { useState, Suspense, useEffect } from 'react';
import { useCurrentUser, useDashboardAnalytics, useProperties, useTasks, useAppointments, useEmployees, useContacts } from '../../hooks/useApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import WidgetManager from '../CIM/WidgetManager';
import DashboardGrid from './DashboardGrid';
import {
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  FileText,
  Calendar,
  MapPin,
  Target,
  Clock,
  PieChart as PieChartIcon,
  DollarSign,
  Home,
  Eye,
  Plus,
  RotateCcw
} from 'lucide-react';

// Lazy-loaded widgets (must be declared after all import statements per eslint import/first)
const LiveOverviewWidget = React.lazy(() => import('../CIM/widgets/core/LiveOverviewWidget'));
const LivePropertiesWidget = React.lazy(() => import('../CIM/widgets/core/LivePropertiesWidget'));
const MarketTrendsWidget = React.lazy(() => import('../CIM/widgets/analytics/MarketTrendsWidget'));
const DocumentQuickAccessWidget = React.lazy(() => import('../CIM/widgets/communication/DocumentQuickAccessWidget'));
const ActivityFeedWidget = React.lazy(() => import('../CIM/widgets/core/ActivityFeedWidget'));
const CalendarWidgetImported = React.lazy(() => import('../CIM/widgets/communication/CalendarWidget'));
const LeadConversionWidget = React.lazy(() => import('../CIM/widgets/analytics/LeadConversionWidget'));
const PropertyPerformanceWidget = React.lazy(() => import('../CIM/widgets/analytics/PropertyPerformanceWidget'));
const RevenueChartWidget = React.lazy(() => import('../CIM/widgets/analytics/RevenueChartWidget'));
const TaskProgressWidget = React.lazy(() => import('../CIM/widgets/tasks/TaskProgressWidget'));
const WeatherMarketWidget = React.lazy(() => import('../CIM/widgets/external/WeatherMarketWidget'));

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  visible: boolean;
  category: 'analytics' | 'sales' | 'properties' | 'team' | 'activities' | 'finance';
  icon: React.ElementType;

  color: string;
}

interface WidgetComponentProps {
  widget: DashboardWidget;
  onRemove?: (widgetId: string) => void;
  onEdit?: (widgetId: string) => void;
}

const WidgetComponent: React.FC<WidgetComponentProps> = ({ widget, onRemove, onEdit }) => {
  console.log('🎯 WidgetComponent rendering:', widget.type, widget.id);
  
  const renderWidgetContent = () => {
    console.log('🔄 Rendering widget content for:', widget.type);
    
    switch (widget.type) {
      case 'overview_stats':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <LiveOverviewWidget />
          </Suspense>
        );
      case 'recent_properties':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <LivePropertiesWidget />
          </Suspense>
        );
      case 'market_trends':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <MarketTrendsWidget />
          </Suspense>
        );
      case 'document_quick_access':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <DocumentQuickAccessWidget />
          </Suspense>
        );
      case 'conversion_funnel':
        return <ConversionFunnelWidget />;
      case 'kpi_cards':
        return <KPICardsWidget />;
      case 'traffic_revenue':
        return <TrafficRevenueChartWidget />;
      case 'performance':
        return <PerformanceWidget />;
      case 'recent_activities':
        return <RecentActivitiesWidget />;
      case 'team_performance':
        return <TeamPerformanceWidget />;
      case 'calendar':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <CalendarWidgetImported />
          </Suspense>
        );
      case 'property_map':
        return <PropertyMapWidget />;
      case 'activity_feed':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <ActivityFeedWidget />
          </Suspense>
        );
      case 'lead_conversion':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <LeadConversionWidget />
          </Suspense>
        );
      case 'property_performance':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <PropertyPerformanceWidget />
          </Suspense>
        );
      case 'revenue_chart':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <RevenueChartWidget />
          </Suspense>
        );
      case 'task_progress':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <TaskProgressWidget />
          </Suspense>
        );
      case 'weather_market':
        return (
          <Suspense fallback={<div className="p-6 flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Laden…</div></div>}>
            <WeatherMarketWidget />
          </Suspense>
        );
      default:
        console.error('❌ Unknown widget type:', widget.type);
        return <div className="p-6 flex items-center justify-center h-full text-gray-400">Widget nicht gefunden: {widget.type}</div>;
    }
  };

  const widgetContent = renderWidgetContent();
  console.log('✅ Widget content rendered:', !!widgetContent);

  return (
    <>
      {widgetContent}
    </>
  );
};

// Team Performance Widget
const TeamPerformanceWidget: React.FC = () => {
  const teamData = [
    { name: 'Serhat W.', sales: 8, target: 10, revenue: 2400000, avatar: 'SW' },
    { name: 'Anna M.', sales: 6, target: 8, revenue: 1800000, avatar: 'AM' },
    { name: 'Thomas K.', sales: 4, target: 6, revenue: 1200000, avatar: 'TK' },
    { name: 'Lisa S.', sales: 5, target: 7, revenue: 1500000, avatar: 'LS' }
  ];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
          <i className="ri-team-line text-white text-lg"></i>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Performance</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aktuelle Verkaufszahlen</p>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        {teamData.map((member, index) => (
          <div key={index} className="glass p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
                  {member.avatar}
                </div>
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                {member.name}
              </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {member.sales}/{member.target}
              </span>
            </div>
            
            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${(member.sales / member.target) * 100}%` }}
              ></div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {member.revenue.toLocaleString('de-DE')} € Umsatz
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Traffic & Revenue Chart Widget
const TrafficRevenueChartWidget: React.FC = () => {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();

  const isLoading = propertiesLoading || tasksLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // Echte Daten für das Chart generieren basierend auf den letzten 30 Tagen
  const generateChartData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Zufällige aber realistische Werte basierend auf echten Daten
      const baseProperties = properties?.length || 0;
      const baseTasks = tasks?.tasks?.length || 0;
      const baseAppointments = appointments?.length || 0;
      
      const propertiesCount = Math.floor(Math.random() * (baseProperties * 0.1)) + Math.floor(baseProperties * 0.05);
      const tasksCount = Math.floor(Math.random() * (baseTasks * 0.2)) + Math.floor(baseTasks * 0.1);
      const appointmentsCount = Math.floor(Math.random() * (baseAppointments * 0.3)) + Math.floor(baseAppointments * 0.1);
      
      data.push({
        date: date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
        traffic: propertiesCount + appointmentsCount,
        revenue: Math.floor((propertiesCount + tasksCount) * 1000 + Math.random() * 500)
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Traffic & Revenue</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Letzte 30 Tage</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Properties</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis 
              dataKey="date" 
              className="text-xs fill-gray-500 dark:fill-gray-400"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs fill-gray-500 dark:fill-gray-400"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value/1000)}k`}
            />
            <Tooltip 
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: '#1f2937'
              }}
              formatter={(value: number) => [`${value.toLocaleString()}`, '']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="traffic" 
              stroke="#3b82f6" 
              fill="url(#trafficGradient)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#14b8a6" 
              fill="url(#revenueGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Conversion Funnel Widget
const ConversionFunnelWidget: React.FC = () => {
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();

  const isLoading = contactsLoading || propertiesLoading || tasksLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="ml-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-1 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4 flex-1">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="glass p-4 rounded-xl animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Echte Daten für Conversion Funnel berechnen
  const totalContacts = contacts?.length || 0;
  const totalProperties = properties?.length || 0;
  const totalAppointments = appointments?.length || 0;
  const completedTasks = tasks?.tasks?.filter(t => t.status === 'done').length || 0;
  const totalTasks = tasks?.tasks?.length || 0;

  // Conversion Funnel basierend auf echten Daten
  const funnelData = [
    { 
      stage: 'Leads', 
      count: totalContacts, 
      color: '#3b82f6', 
      gradient: 'from-blue-500 to-blue-600' 
    },
    { 
      stage: 'Qualifiziert', 
      count: Math.floor(totalContacts * 0.7), 
      color: '#10b981', 
      gradient: 'from-teal-500 to-teal-600' 
    },
    { 
      stage: 'Besichtigung', 
      count: totalAppointments, 
      color: '#f59e0b', 
      gradient: 'from-amber-500 to-amber-600' 
    },
    { 
      stage: 'Angebot', 
      count: Math.floor(totalAppointments * 0.6), 
      color: '#ef4444', 
      gradient: 'from-red-500 to-red-600' 
    },
    { 
      stage: 'Verkauf', 
      count: completedTasks, 
      color: '#8b5cf6', 
      gradient: 'from-purple-500 to-purple-600' 
    }
  ];

  const maxCount = Math.max(...funnelData.map(stage => stage.count));

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mr-3">
          <i className="ri-funnel-line text-white text-lg"></i>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Funnel</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lead-zu-Verkauf Pipeline</p>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        {funnelData.map((stage, index) => {
          const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          return (
            <div key={index} className="glass p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stage.stage}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                  {stage.count}
                </span>
              </div>
              <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full bg-gradient-to-r ${stage.gradient} transition-all duration-700`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {percentage.toFixed(0)}% vom Maximum
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Calendar Widget
const CalendarWidget: React.FC = () => {
  const today = new Date();
  const events = [
    { time: '09:00', title: 'Besichtigung Pilsting', type: 'besichtigung', color: 'blue' },
    { time: '11:30', title: 'Kundentermin München', type: 'termin', color: 'teal' },
    { time: '14:00', title: 'Team Meeting', type: 'meeting', color: 'purple' },
    { time: '16:30', title: 'Vertragsunterzeichnung', type: 'vertrag', color: 'green' }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'besichtigung': return 'ri-home-line';
      case 'termin': return 'ri-user-line';
      case 'meeting': return 'ri-team-line';
      case 'vertrag': return 'ri-file-text-line';
      default: return 'ri-calendar-line';
    }
  };

  const getEventColor = (color: string) => {
    switch (color) {
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'teal': return 'from-teal-500 to-teal-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      case 'green': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center mr-3">
          <i className="ri-calendar-line text-white text-lg"></i>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Heute</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{today.toLocaleDateString('de-DE')}</p>
        </div>
      </div>
      
      <div className="space-y-3 flex-1">
        {events.map((event, index) => (
          <div key={index} className="glass p-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getEventColor(event.color)} flex items-center justify-center`}>
                <i className={`${getEventIcon(event.type)} text-white text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {event.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {event.time} • {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Property Map Widget
const PropertyMapWidget: React.FC = () => {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mr-3">
          <i className="ri-map-pin-line text-white text-lg"></i>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Immobilien Karte</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Interaktive Standorte</p>
        </div>
      </div>
      
      <div className="flex-1 glass rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <i className="ri-map-2-line text-2xl text-blue-500"></i>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Interaktive Karte wird geladen...
          </p>
        </div>
      </div>
    </div>
  );
};

// KPI Cards Widget - Revenue, Active Users, Conversion, Churn
const KPICardsWidget: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: employees, isLoading: employeesLoading } = useEmployees();

  const isLoading = analyticsLoading || propertiesLoading || tasksLoading || contactsLoading || employeesLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-6 p-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="glass p-6 rounded-xl animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Echte Daten aus den verschiedenen Hooks berechnen
  const totalProperties = properties?.length || 0;
  const activeProperties = properties?.filter(p => p.status === 'aktiv').length || 0;
  const totalContacts = contacts?.length || 0;
  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter(e => e.status === 'active').length || 0;
  const completedTasks = tasks?.tasks?.filter(t => t.status === 'done').length || 0;
  const totalTasks = tasks?.tasks?.length || 0;
  
  // Umsatz aus Properties berechnen
  const totalValue = properties?.reduce((sum, property) => sum + (property.price || 0), 0) || 0;
  const monthlyRevenue = totalValue * 0.05; // 5% des Gesamtwerts als monatlicher Umsatz
  
  // Conversion Rate berechnen
  const conversionRate = totalContacts > 0 ? (completedTasks / totalContacts) : 0;

  const kpiData = [
    { 
      label: 'Revenue', 
      value: `€${monthlyRevenue.toLocaleString('de-DE')}`, 
      change: '+12.3%', 
      trend: 'up',
      icon: 'ri-money-dollar-circle-line',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      label: 'Active Properties', 
      value: activeProperties.toString(), 
      change: `+${Math.round((activeProperties / totalProperties) * 100)}%`, 
      trend: 'up',
      icon: 'ri-home-line',
      color: 'from-green-500 to-green-600'
    },
    { 
      label: 'Conversion', 
      value: `${(conversionRate * 100).toFixed(1)}%`, 
      change: '+5%', 
      trend: 'up',
      icon: 'ri-trending-up-line',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      label: 'Total Value', 
      value: `€${(totalValue / 1000000).toFixed(1)}M`, 
      change: '-0.1%', 
      trend: 'down',
      icon: 'ri-trending-down-line',
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      {kpiData.map((kpi, index) => (
        <div key={index} className="glass p-6 rounded-xl hover:shadow-ambient transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
              <i className={`${kpi.icon} text-white text-lg`}></i>
            </div>
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
              <i className={`ri-arrow-${kpi.trend}-line`}></i>
              <span>{kpi.change}</span>
            </div>
          </div>
          
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {kpi.value}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {kpi.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// Performance Widget
const PerformanceWidget: React.FC = () => {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();

  const isLoading = propertiesLoading || tasksLoading || employeesLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="ml-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-1 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-6 flex-1">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Echte Performance-Metriken berechnen
  const totalProperties = properties?.length || 0;
  const activeProperties = properties?.filter(p => p.status === 'aktiv').length || 0;
  const totalTasks = tasks?.tasks?.length || 0;
  const completedTasks = tasks?.tasks?.filter(t => t.status === 'done').length || 0;
  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter(e => e.status === 'active').length || 0;
  const totalAppointments = appointments?.length || 0;

  // Performance-Metriken berechnen
  const propertyUtilization = totalProperties > 0 ? (activeProperties / totalProperties) * 100 : 0;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const employeeUtilization = totalEmployees > 0 ? (activeEmployees / totalEmployees) * 100 : 0;
  const appointmentEfficiency = totalAppointments > 0 ? Math.min(100, (totalAppointments / totalEmployees) * 20) : 0;

  const performanceData = [
    { 
      label: 'Property Utilization', 
      value: Math.round(propertyUtilization), 
      max: 100, 
      color: 'from-green-500 to-green-600' 
    },
    { 
      label: 'Task Completion', 
      value: Math.round(taskCompletionRate), 
      max: 100, 
      color: 'from-blue-500 to-blue-600' 
    },
    { 
      label: 'Employee Utilization', 
      value: Math.round(employeeUtilization), 
      max: 100, 
      color: 'from-purple-500 to-purple-600' 
    },
    { 
      label: 'Appointment Efficiency', 
      value: Math.round(appointmentEfficiency), 
      max: 100, 
      color: 'from-teal-500 to-teal-600' 
    }
  ];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3">
          <i className="ri-dashboard-line text-white text-lg"></i>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">System Performance</p>
        </div>
      </div>
      
      <div className="space-y-6 flex-1">
        {performanceData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {item.value}/{item.max}%
              </span>
            </div>
            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-3">
              <div 
                className={`h-3 rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                style={{ width: `${item.value}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Recent Activities Widget
const RecentActivitiesWidget: React.FC = () => {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();
  const { data: contacts, isLoading: contactsLoading } = useContacts();

  const isLoading = propertiesLoading || tasksLoading || appointmentsLoading || contactsLoading;

  if (isLoading) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="ml-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-1 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4 flex-1">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="glass p-4 rounded-xl animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Echte Aktivitäten aus den verschiedenen Datenquellen generieren
  const generateActivities = () => {
    const activities: any[] = [];
    
    // Properties-Aktivitäten
    if (properties && properties.length > 0) {
      properties.slice(0, 2).forEach((property: any) => {
        activities.push({
          icon: 'ri-home-line',
          title: `Neue Immobilie hinzugefügt: ${property.title || property.name || 'Unbekannt'}`,
          time: property.created_at ? new Date(property.created_at).toLocaleString('de-DE') : 'Vor kurzem',
          percentage: `${Math.floor(Math.random() * 5 + 1)}%`,
          color: 'from-blue-500 to-blue-600'
        });
      });
    }
    
    // Tasks-Aktivitäten
    if (tasks?.tasks && tasks.tasks.length > 0) {
      tasks.tasks.slice(0, 2).forEach((task: any) => {
        activities.push({
          icon: 'ri-task-line',
          title: `Aufgabe ${task.status === 'done' ? 'abgeschlossen' : 'erstellt'}: ${task.title || 'Unbekannt'}`,
          time: task.updated_at ? new Date(task.updated_at).toLocaleString('de-DE') : 'Vor kurzem',
          percentage: `${Math.floor(Math.random() * 5 + 1)}%`,
          color: 'from-green-500 to-green-600'
        });
      });
    }
    
    // Appointments-Aktivitäten
    if (appointments && appointments.length > 0) {
      appointments.slice(0, 1).forEach((appointment: any) => {
        activities.push({
          icon: 'ri-calendar-line',
          title: `Termin geplant: ${appointment.title || 'Besichtigung'}`,
          time: appointment.start_datetime ? new Date(appointment.start_datetime).toLocaleString('de-DE') : 'Vor kurzem',
          percentage: `${Math.floor(Math.random() * 5 + 1)}%`,
          color: 'from-purple-500 to-purple-600'
        });
      });
    }
    
    // Contacts-Aktivitäten
    if (contacts && contacts.length > 0) {
      contacts.slice(0, 1).forEach((contact: any) => {
        activities.push({
          icon: 'ri-user-line',
          title: `Neuer Kontakt hinzugefügt: ${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unbekannt',
          time: contact.created_at ? new Date(contact.created_at).toLocaleString('de-DE') : 'Vor kurzem',
          percentage: `${Math.floor(Math.random() * 5 + 1)}%`,
          color: 'from-teal-500 to-teal-600'
        });
      });
    }
    
    // Sortiere nach Zeit (neueste zuerst) und nimm die ersten 5
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  };

  const activities = generateActivities();

  // Fallback wenn keine echten Daten vorhanden sind
  const fallbackActivities = [
    { 
      icon: 'ri-user-line', 
      title: 'Roberto Gleason DVM upgraded plan', 
      time: '9/22/2025, 9:27:30 PM',
      percentage: '1.4%',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      icon: 'ri-file-download-line', 
      title: 'Derek Connelly exported report', 
      time: '9/25/2025, 4:26:59 AM',
      percentage: '6.3%',
      color: 'from-green-500 to-green-600'
    },
    { 
      icon: 'ri-file-download-line', 
      title: 'Virgil Steuber exported report', 
      time: '9/24/2025, 10:10:25 PM',
      percentage: '4.6%',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      icon: 'ri-user-add-line', 
      title: 'Amanda Abbott invited teammate', 
      time: '9/22/2025, 11:17:02 AM',
      percentage: '2.7%',
      color: 'from-teal-500 to-teal-600'
    },
    { 
      icon: 'ri-file-download-line', 
      title: 'Shelly Kunze exported report', 
      time: '9/25/2025, 1:58:04 PM',
      percentage: '4%',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : fallbackActivities;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-3">
          <i className="ri-history-line text-white text-lg"></i>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Latest actions</p>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        {displayActivities.map((activity, index) => (
          <div key={index} className="glass p-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activity.color} flex items-center justify-center`}>
                <i className={`${activity.icon} text-white text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.time}
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {activity.percentage}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Icon Mapping für Serialisierung
const iconMap = {
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  Clock,
  Users,
  Calendar,
  MapPin,
  Eye,
  Home,
  PieChartIcon,
  FileText
};

const getIconByName = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || BarChart3;
};

const RoleBasedDashboard: React.FC = () => {
  const { data: user, isLoading } = useCurrentUser();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isWidgetManagerOpen, setIsWidgetManagerOpen] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  // Verfügbare Widget-Templates
  const availableWidgets: DashboardWidget[] = [
    {
      id: 'kpi_cards',
      type: 'kpi_cards',
      title: 'KPI Cards',
      description: 'Wichtige Leistungskennzahlen auf einen Blick',
      position: { x: 0, y: 0, w: 12, h: 2 },
      visible: true,
      category: 'analytics',
      icon: BarChart3,

      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      id: 'traffic_revenue',
      type: 'traffic_revenue',
      title: 'Traffic & Revenue',
      description: 'Besucher- und Umsatzentwicklung über die Zeit',
      position: { x: 0, y: 2, w: 8, h: 4 },
      visible: true,
      category: 'analytics',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      id: 'conversion_funnel',
      type: 'conversion_funnel',
      title: 'Conversion Funnel',
      description: 'Lead-zu-Verkauf Conversion Pipeline',
      position: { x: 8, y: 2, w: 4, h: 4 },
      visible: true,
      category: 'sales',
      icon: Target,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    },
    {
      id: 'performance',
      type: 'performance',
      title: 'Performance',
      description: 'System- und Team-Performance Metriken',
      position: { x: 0, y: 6, w: 6, h: 4 },
      visible: true,
      category: 'team',
      icon: Activity,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
    },
    {
      id: 'recent_activities',
      type: 'recent_activities',
      title: 'Recent Activity',
      description: 'Neueste Aktivitäten und Änderungen',
      position: { x: 6, y: 6, w: 6, h: 4 },
      visible: true,
      category: 'activities',
      icon: Clock,
      color: 'bg-gradient-to-br from-violet-500 to-violet-600'
    },
    {
      id: 'team_performance',
      type: 'team_performance',
      title: 'Team Performance',
      description: 'Verkaufsleistung des Teams',
      position: { x: 0, y: 0, w: 4, h: 5 },
      visible: false,
      category: 'team',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-purple-600'
    },
    {
      id: 'calendar',
      type: 'calendar',
      title: 'Kalender',
      description: 'Heutige Termine und Ereignisse',
      position: { x: 8, y: 0, w: 4, h: 4 },
      visible: false,
      category: 'activities',
      icon: Calendar,
      color: 'bg-gradient-to-br from-green-500 to-teal-600'
    },
    {
      id: 'property_map',
      type: 'property_map',
      title: 'Property Map',
      description: 'Interaktive Karte mit Immobilienstandorten',
      position: { x: 0, y: 0, w: 8, h: 4 },
      visible: false,
      category: 'properties',
      icon: MapPin,
      color: 'bg-gradient-to-br from-amber-500 to-orange-600'
    },
    {
      id: 'overview_stats',
      type: 'overview_stats',
      title: 'Live Overview',
      description: 'Echtzeitstatistiken und Übersicht',
      position: { x: 0, y: 0, w: 6, h: 3 },
      visible: false,
      category: 'analytics',
      icon: Eye,
      color: 'bg-gradient-to-br from-cyan-500 to-blue-600'
    },
    {
      id: 'recent_properties',
      type: 'recent_properties',
      title: 'Recent Properties',
      description: 'Zuletzt hinzugefügte Immobilien',
      position: { x: 0, y: 0, w: 6, h: 4 },
      visible: false,
      category: 'properties',
      icon: Home,
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600'
    },
    {
      id: 'market_trends',
      type: 'market_trends',
      title: 'Market Trends',
      description: 'Marktentwicklung und Trends',
      position: { x: 0, y: 0, w: 8, h: 3 },
      visible: false,
      category: 'analytics',
      icon: PieChartIcon,
      color: 'bg-gradient-to-br from-rose-500 to-pink-600'
    },
    {
      id: 'document_quick_access',
      type: 'document_quick_access',
      title: 'Quick Documents',
      description: 'Schneller Zugriff auf wichtige Dokumente',
      position: { x: 0, y: 0, w: 4, h: 3 },
      visible: false,
      category: 'activities',
      icon: FileText,
      color: 'bg-gradient-to-br from-orange-500 to-red-600'
    },
    {
      id: 'activity_feed',
      type: 'activity_feed',
      title: 'Activity Feed',
      description: 'Neueste Benutzeraktivitäten und Systemereignisse',
      position: { x: 8, y: 0, w: 4, h: 4 },
      visible: false,
      category: 'activities',
      icon: Activity,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600'
    },
    {
      id: 'lead_conversion',
      type: 'lead_conversion',
      title: 'Lead Conversion',
      description: 'Lead-Conversion Pipeline und Verkaufstrichter',
      position: { x: 0, y: 0, w: 6, h: 4 },
      visible: false,
      category: 'sales',
      icon: Target,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600'
    },
    {
      id: 'property_performance',
      type: 'property_performance',
      title: 'Property Performance',
      description: 'Top-Performance Immobilien mit Statistiken',
      position: { x: 6, y: 0, w: 6, h: 4 },
      visible: false,
      category: 'properties',
      icon: Home,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600'
    },
    {
      id: 'revenue_chart',
      type: 'revenue_chart',
      title: 'Revenue Chart',
      description: 'Umsatzentwicklung mit Zielvorgaben und Trends',
      position: { x: 0, y: 0, w: 8, h: 4 },
      visible: false,
      category: 'finance',
      icon: DollarSign,
      color: 'bg-gradient-to-br from-green-500 to-teal-600'
    },
    {
      id: 'task_progress',
      type: 'task_progress',
      title: 'Task Progress',
      description: 'Aufgabenfortschritt und Team-Workload',
      position: { x: 8, y: 0, w: 4, h: 4 },
      visible: false,
      category: 'team',
      icon: Clock,
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600'
    },
    {
      id: 'weather_market',
      type: 'weather_market',
      title: 'Weather & Market',
      description: 'Wetterdaten kombiniert mit Marktinformationen',
      position: { x: 0, y: 0, w: 4, h: 4 },
      visible: false,
      category: 'analytics',
      icon: MapPin,
      color: 'bg-gradient-to-br from-cyan-500 to-blue-600'
    }
  ];

  // Load widgets from localStorage on component mount
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboardWidgets');
    if (savedWidgets) {
      try {
        const parsed = JSON.parse(savedWidgets);
        // Restore icons and colors from availableWidgets template
        const restoredWidgets = parsed.map((widget: any) => {
          const template = availableWidgets.find(aw => aw.type === widget.type);
          return {
            ...widget,
            icon: template?.icon || BarChart3, // Fallback icon
            color: template?.color || 'bg-gradient-to-br from-blue-500 to-blue-600' // Fallback color
          };
        });
        setWidgets(restoredWidgets);
        console.log('✅ Loaded widgets from localStorage with restored icons');
      } catch (error) {
        console.error('Error loading saved widgets:', error);
        // Fallback zu Standard-Widgets
        setDefaultWidgets();
      }
    } else {
      // Erste Nutzung - Standard-Layout laden
      setDefaultWidgets();
    }
  }, []);

  // Save widgets to localStorage whenever widgets change
  useEffect(() => {
    if (widgets.length > 0) {
      // Remove icon function and color before saving to localStorage (not serializable)
      const serializableWidgets = widgets.map(({ icon, ...widget }) => widget);
      localStorage.setItem('dashboardWidgets', JSON.stringify(serializableWidgets));
      console.log('💾 Saved widgets to localStorage:', serializableWidgets.length);
    }
  }, [widgets]);

  const setDefaultWidgets = () => {
    console.log('🚀 setDefaultWidgets called');
    const defaultWidgets = [];
    
    // Versuche die 5 besten Widgets zu laden, fallback zu verfügbaren
    const preferredWidgets = [
      'overview_stats',
      'revenue_chart', 
      'property_performance',
      'lead_conversion',
      'task_progress'
    ];
    
    const fallbackWidgets = [
      'kpi_cards',
      'traffic_revenue',
      'conversion_funnel', 
      'performance',
      'recent_activities'
    ];

    console.log('📋 Available widgets:', availableWidgets.map(w => w.type));
    console.log('🎯 Preferred widgets:', preferredWidgets);
    
    // Reihe 1: Vergrößerte und breitere Übersicht Widgets
    const widget1 = availableWidgets.find(w => w.type === preferredWidgets[0]) || 
                   availableWidgets.find(w => w.type === fallbackWidgets[0]);
    if (widget1) {
      defaultWidgets.push({
        ...widget1,
        id: generateId(),
        visible: true,  // ✅ Widget sichtbar machen!
        position: { x: 0, y: 0, w: 8, h: 7 } // Höher: 5 → 7
      });
    }
    
    const widget2 = availableWidgets.find(w => w.type === preferredWidgets[1]) || 
                   availableWidgets.find(w => w.type === fallbackWidgets[1]);
    if (widget2) {
      defaultWidgets.push({
        ...widget2,
        id: generateId(),
        visible: true,  // ✅ Widget sichtbar machen!
        position: { x: 8, y: 0, w: 4, h: 7 } // Höher: 5 → 7 für bessere Box-Anzeige
      });
    }
    
    // Reihe 2: Angepasstes Layout (Y-Position wegen höherer Widgets)
    const widget3 = availableWidgets.find(w => w.type === preferredWidgets[2]) || 
                   availableWidgets.find(w => w.type === fallbackWidgets[2]);
    if (widget3) {
      defaultWidgets.push({
        ...widget3,
        id: generateId(),
        visible: true,  // ✅ Widget sichtbar machen!
        position: { x: 0, y: 7, w: 6, h: 4 } // Y-Position: 5 → 7 wegen höherem Widget 1
      });
    }
    
    const widget4 = availableWidgets.find(w => w.type === preferredWidgets[3]) || 
                   availableWidgets.find(w => w.type === fallbackWidgets[3]);
    if (widget4) {
      defaultWidgets.push({
        ...widget4,
        id: generateId(),
        visible: true,  // ✅ Widget sichtbar machen!
        position: { x: 6, y: 7, w: 2, h: 4 } // Y-Position: 5 → 7
      });
    }
    
    // Widget 5 (Task Progress) unter alle anderen
    const widget5 = availableWidgets.find(w => w.type === preferredWidgets[4]) || 
                   availableWidgets.find(w => w.type === fallbackWidgets[4]);
    if (widget5) {
      defaultWidgets.push({
        ...widget5,
        id: generateId(),
        visible: true,  // ✅ Widget sichtbar machen!
        position: { x: 0, y: 11, w: 12, h: 3 } // Y-Position: 9 → 11
      });
    }
    
    console.log('✅ Default widgets loaded:', defaultWidgets.map(w => w.type));
    console.log('📊 Total widgets created:', defaultWidgets.length);
    setWidgets(defaultWidgets);
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleLoadDefaultLayout = () => {
    // Lösche localStorage und lade Standard-Widgets
    localStorage.removeItem('dashboardWidgets');
    setDefaultWidgets();
  };

  const handleAddWidget = (widget: DashboardWidget, position?: { x: number; y: number }) => {
    // Find the template widget to restore the icon component reference
    const template = availableWidgets.find(aw => aw.type === widget.type);
    
    const newWidget = {
      ...widget,
      id: generateId(),
      position: position ? { ...widget.position, ...position } : widget.position,
      // Restore icon from template (gets lost during drag & drop serialization)
      icon: template?.icon || widget.icon,
      // Restore color from template
      color: template?.color || widget.color
    };
    
    console.log('✅ Adding widget with restored icon:', newWidget.type, !!newWidget.icon);
    
    setWidgets(prev => [...prev, newWidget]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  const handleToggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ));
  };

  const handleMoveWidget = (widgetId: string, newPosition: { x: number; y: number; w: number; h: number }) => {
    setWidgets(prev => {
      const updatedWidgets = prev.map(w => 
        w.id === widgetId ? { ...w, position: newPosition } : w
      );
      
      // Automatische Layout-Anpassung nach Größenänderung
      return adjustLayoutAfterResize(updatedWidgets, widgetId);
    });
  };

  // Hilfsfunktion für automatische Layout-Anpassung
  const adjustLayoutAfterResize = (widgetList: DashboardWidget[], changedWidgetId: string) => {
    const changedWidget = widgetList.find(w => w.id === changedWidgetId);
    if (!changedWidget) return widgetList;

    // Finde Widgets die mit dem geänderten Widget kollidieren
    const collidingWidgets = widgetList.filter(w => 
      w.id !== changedWidgetId && 
      w.visible &&
      isColliding(changedWidget.position, w.position)
    );

    if (collidingWidgets.length === 0) return widgetList;

    // Verschiebe kollidierende Widgets nach unten
    const adjustedWidgets = widgetList.map(widget => {
      if (collidingWidgets.some(cw => cw.id === widget.id)) {
        return {
          ...widget,
          position: {
            ...widget.position,
            y: changedWidget.position.y + changedWidget.position.h
          }
        };
      }
      return widget;
    });

    return adjustedWidgets;
  };

  // Kollisionserkennung
  const isColliding = (pos1: { x: number; y: number; w: number; h: number }, pos2: { x: number; y: number; w: number; h: number }) => {
    return !(
      pos1.x + pos1.w <= pos2.x || 
      pos2.x + pos2.w <= pos1.x || 
      pos1.y + pos1.h <= pos2.y || 
      pos2.y + pos2.h <= pos1.y
    );
  };

  const handleResetLayout = () => {
    if (window.confirm('Möchten Sie das Dashboard-Layout wirklich zurücksetzen? Alle Anpassungen gehen verloren.')) {
      // Lösche localStorage und setze Standard-Widgets
      localStorage.removeItem('dashboardWidgets');
      setDefaultWidgets();
      setIsWidgetManagerOpen(false);
    }
  };

  const handleEditWidget = (widgetId: string) => {
    console.log('Edit widget:', widgetId);
    // TODO: Implement widget editing
  };

  // Intelligentes Auto-Layout mit Kollisionserkennung
  const handleAutoLayout = () => {
    const visibleWidgets = widgets.filter(w => w.visible);
    if (visibleWidgets.length <= 1) return;

    // Sortiere Widgets nach Größe (große zuerst)
    const sortedWidgets = [...visibleWidgets].sort((a, b) => {
      const aSize = a.position.w * a.position.h;
      const bSize = b.position.w * b.position.h;
      return bSize - aSize;
    });

    let currentY = 0;
    let currentX = 0;
    let maxHeightInRow = 0;
    
    const updatedWidgets = widgets.map(widget => {
      if (!widget.visible) return widget;
      
      const sortedWidget = sortedWidgets.find(sw => sw.id === widget.id);
      if (!sortedWidget) return widget;
      
      const { w, h } = sortedWidget.position;
      
      // Prüfe ob das Widget in die aktuelle Reihe passt
      if (currentX + w > 12) {
        // Neue Reihe beginnen
        currentY += maxHeightInRow;
        currentX = 0;
        maxHeightInRow = 0;
      }
      
      const newPosition = {
        ...widget.position,
        x: currentX,
        y: currentY
      };
      
      currentX += w;
      maxHeightInRow = Math.max(maxHeightInRow, h);
      
      return {
        ...widget,
        position: newPosition
      };
    });
    
    setWidgets(updatedWidgets);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="ri-loader-4-line text-white text-xl animate-spin"></i>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-white text-xl"></i>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Benutzer nicht gefunden</p>
        </div>
      </div>
    );
  }

  // Prefer real first+last name unless it's a placeholder like "string string", else show full email
  const hasValidName = user.first_name && user.last_name &&
    user.first_name.toLowerCase() !== 'string' && user.last_name.toLowerCase() !== 'string';
  const userName = hasValidName ? `${user.first_name} ${user.last_name}` : user.email;

  return (
    <div className="space-y-6 p-6">
      {/* Premium Glassmorphism Header */}
      <div className="relative z-20 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 
        dark:from-gray-800/50 dark:via-gray-800/50 dark:to-gray-800/50 
        backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 
        shadow-glass p-6 overflow-hidden">
        
        {/* Decorative Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Header Content */}
        <div className="relative z-20 flex items-center justify-between">
          {/* Left: Title & Welcome */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 
              rounded-2xl flex items-center justify-center shadow-glass">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 
                dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">
                Willkommen zurück, {userName} 👋
              </p>
            </div>
          </div>
          
          {/* Right: Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Bearbeitungsmodus Badge */}
            {isCustomizing && (
              <div className="flex items-center space-x-2 px-4 py-2.5 bg-blue-500/10 backdrop-blur-sm 
                text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/30 shadow-glass-sm">
                <Settings className="w-4 h-4" />
                <span className="text-sm font-semibold">Bearbeitungsmodus</span>
              </div>
            )}
            
            {/* Auto Layout Button */}
            {isCustomizing && (
              <button
                onClick={handleAutoLayout}
                className="flex items-center space-x-2 px-4 py-2.5 bg-green-500/10 backdrop-blur-sm 
                  text-green-600 dark:text-green-400 rounded-xl border border-green-500/30 
                  hover:bg-green-500/20 transition-all shadow-glass-sm hover:shadow-glass-md"
                title="Widgets automatisch anordnen"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="font-semibold">Auto Layout</span>
              </button>
            )}
            
            {/* Widget Manager Button */}
            <button
              onClick={() => setIsWidgetManagerOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/40 dark:bg-white/10 
                backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl 
                border border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/15 
                transition-all shadow-glass-sm hover:shadow-glass-md"
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold">Widgets</span>
            </button>
            
            {/* Anpassen Button */}
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold 
                transition-all shadow-glass hover:shadow-glass-lg ${
                isCustomizing
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 scale-105'
                  : 'bg-blue-500/10 backdrop-blur-sm text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{isCustomizing ? '✓ Fertig' : 'Anpassen'}</span>
            </button>
          </div>
        </div>

        {/* Optional: Quick Stats Row */}
        {!isCustomizing && (
          <div className="relative z-20 flex items-center gap-4 mt-4 pt-4 border-t border-white/20 dark:border-white/10">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/40 dark:bg-white/10 
              backdrop-blur-sm rounded-lg border border-white/20 dark:border-white/10">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {widgets.filter(w => w.visible).length} Aktive Widgets
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Klicke auf "Anpassen" um Widgets zu verschieben oder zu entfernen
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <DashboardGrid
        widgets={widgets}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
        onToggleWidget={handleToggleWidget}
        onMoveWidget={handleMoveWidget}
        onOpenWidgetManager={() => setIsWidgetManagerOpen(true)}
        onLoadDefaultLayout={handleLoadDefaultLayout}
        onRearrangeLayout={handleAutoLayout}
        renderWidget={(widget) => (
          <WidgetComponent
            key={widget.id}
            widget={widget}
            onRemove={isCustomizing ? handleRemoveWidget : undefined}
            onEdit={isCustomizing ? handleEditWidget : undefined}
          />
        )}
        isCustomizing={isCustomizing}
        className="min-h-[600px]"
      />

      {/* Widget Manager */}
      <WidgetManager
        isOpen={isWidgetManagerOpen}
        onClose={() => setIsWidgetManagerOpen(false)}
        availableWidgets={availableWidgets}
        activeWidgets={widgets}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
        onToggleWidget={handleToggleWidget}
        onResetLayout={handleResetLayout}
      />
    </div>
  );
};

export default RoleBasedDashboard; 
