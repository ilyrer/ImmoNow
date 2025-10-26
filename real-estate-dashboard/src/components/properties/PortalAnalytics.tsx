import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Eye, MessageSquare, Users, 
  Calendar, BarChart3, PieChart, Activity, Target,
  RefreshCw, Download, Filter, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { PropertyResponse } from '../../types/property';
import { propertiesService } from '../../services/properties';
import { toast } from 'react-hot-toast';

interface PortalAnalyticsProps {
  property: PropertyResponse;
}

interface PortalAnalytics {
  portal: string;
  views: number;
  inquiries: number;
  favorites: number;
  visits: number;
  conversionRate: number;
  avgViewDuration: number;
  lastUpdated: string;
  trends: {
    views: { current: number; previous: number; change: number };
    inquiries: { current: number; previous: number; change: number };
    favorites: { current: number; previous: number; change: number };
  };
  dailyStats: Array<{
    date: string;
    views: number;
    inquiries: number;
    favorites: number;
  }>;
  demographics: {
    ageGroups: Array<{ age: string; percentage: number }>;
    gender: Array<{ gender: string; percentage: number }>;
    locations: Array<{ location: string; percentage: number }>;
  };
}

const PortalAnalytics: React.FC<PortalAnalyticsProps> = ({ property }) => {
  const [analytics, setAnalytics] = useState<PortalAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [property.id, timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with actual API call
      const mockAnalytics: PortalAnalytics[] = [
        {
          portal: 'immoscout24',
          views: 1250,
          inquiries: 45,
          favorites: 23,
          visits: 12,
          conversionRate: 3.6,
          avgViewDuration: 180,
          lastUpdated: new Date().toISOString(),
          trends: {
            views: { current: 1250, previous: 980, change: 27.6 },
            inquiries: { current: 45, previous: 38, change: 18.4 },
            favorites: { current: 23, previous: 19, change: 21.1 }
          },
          dailyStats: generateDailyStats(),
          demographics: {
            ageGroups: [
              { age: '25-34', percentage: 35 },
              { age: '35-44', percentage: 28 },
              { age: '45-54', percentage: 22 },
              { age: '55+', percentage: 15 }
            ],
            gender: [
              { gender: 'Männlich', percentage: 58 },
              { gender: 'Weiblich', percentage: 42 }
            ],
            locations: [
              { location: 'München', percentage: 25 },
              { location: 'Berlin', percentage: 20 },
              { location: 'Hamburg', percentage: 15 },
              { location: 'Andere', percentage: 40 }
            ]
          }
        },
        {
          portal: 'immowelt',
          views: 890,
          inquiries: 32,
          favorites: 18,
          visits: 8,
          conversionRate: 3.6,
          avgViewDuration: 165,
          lastUpdated: new Date().toISOString(),
          trends: {
            views: { current: 890, previous: 720, change: 23.6 },
            inquiries: { current: 32, previous: 28, change: 14.3 },
            favorites: { current: 18, previous: 15, change: 20.0 }
          },
          dailyStats: generateDailyStats(),
          demographics: {
            ageGroups: [
              { age: '25-34', percentage: 32 },
              { age: '35-44', percentage: 30 },
              { age: '45-54', percentage: 25 },
              { age: '55+', percentage: 13 }
            ],
            gender: [
              { gender: 'Männlich', percentage: 55 },
              { gender: 'Weiblich', percentage: 45 }
            ],
            locations: [
              { location: 'München', percentage: 22 },
              { location: 'Berlin', percentage: 18 },
              { location: 'Hamburg', percentage: 12 },
              { location: 'Andere', percentage: 48 }
            ]
          }
        },
        {
          portal: 'kleinanzeigen',
          views: 650,
          inquiries: 28,
          favorites: 15,
          visits: 6,
          conversionRate: 4.3,
          avgViewDuration: 195,
          lastUpdated: new Date().toISOString(),
          trends: {
            views: { current: 650, previous: 580, change: 12.1 },
            inquiries: { current: 28, previous: 25, change: 12.0 },
            favorites: { current: 15, previous: 13, change: 15.4 }
          },
          dailyStats: generateDailyStats(),
          demographics: {
            ageGroups: [
              { age: '25-34', percentage: 40 },
              { age: '35-44', percentage: 25 },
              { age: '45-54', percentage: 20 },
              { age: '55+', percentage: 15 }
            ],
            gender: [
              { gender: 'Männlich', percentage: 52 },
              { gender: 'Weiblich', percentage: 48 }
            ],
            locations: [
              { location: 'München', percentage: 20 },
              { location: 'Berlin', percentage: 15 },
              { location: 'Hamburg', percentage: 10 },
              { location: 'Andere', percentage: 55 }
            ]
          }
        }
      ];
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Fehler beim Laden der Analytics-Daten');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailyStats = () => {
    const stats = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      stats.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50) + 10,
        inquiries: Math.floor(Math.random() * 5) + 1,
        favorites: Math.floor(Math.random() * 3) + 1
      });
    }
    return stats;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const filteredAnalytics = selectedPortal === 'all' 
    ? analytics 
    : analytics.filter(a => a.portal === selectedPortal);

  const totalStats = filteredAnalytics.reduce((acc, curr) => ({
    views: acc.views + curr.views,
    inquiries: acc.inquiries + curr.inquiries,
    favorites: acc.favorites + curr.favorites,
    visits: acc.visits + curr.visits
  }), { views: 0, inquiries: 0, favorites: 0, visits: 0 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Portal Analytics
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Detaillierte Performance-Metriken für alle Portale
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
          </select>
          
          <select
            value={selectedPortal}
            onChange={(e) => setSelectedPortal(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Alle Portale</option>
            <option value="immoscout24">ImmobilienScout24</option>
            <option value="immowelt">Immowelt</option>
            <option value="kleinanzeigen">eBay Kleinanzeigen</option>
          </select>
          
          <button
            onClick={loadAnalytics}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Total Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-6 shadow-xl shadow-blue-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aufrufe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.views.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-6 shadow-xl shadow-green-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Anfragen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.inquiries}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-6 shadow-xl shadow-yellow-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favoriten</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.favorites}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-6 shadow-xl shadow-purple-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Besichtigungen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStats.visits}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Portal-specific Analytics */}
      {filteredAnalytics.map((portal, index) => (
        <motion.div
          key={portal.portal}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-6 shadow-xl shadow-blue-500/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {portal.portal.replace('immoscout24', 'ImmobilienScout24').replace('immowelt', 'Immowelt').replace('kleinanzeigen', 'eBay Kleinanzeigen')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Zuletzt aktualisiert: {new Date(portal.lastUpdated).toLocaleString('de-DE')}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Portal Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{portal.views.toLocaleString()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Aufrufe</div>
              <div className={`flex items-center justify-center space-x-1 text-xs ${getTrendColor(portal.trends.views.change)}`}>
                {getTrendIcon(portal.trends.views.change)}
                <span>{Math.abs(portal.trends.views.change).toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{portal.inquiries}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Anfragen</div>
              <div className={`flex items-center justify-center space-x-1 text-xs ${getTrendColor(portal.trends.inquiries.change)}`}>
                {getTrendIcon(portal.trends.inquiries.change)}
                <span>{Math.abs(portal.trends.inquiries.change).toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{portal.favorites}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Favoriten</div>
              <div className={`flex items-center justify-center space-x-1 text-xs ${getTrendColor(portal.trends.favorites.change)}`}>
                {getTrendIcon(portal.trends.favorites.change)}
                <span>{Math.abs(portal.trends.favorites.change).toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{portal.conversionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Ø {portal.avgViewDuration}s Verweildauer
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Altersgruppen</h5>
              <div className="space-y-2">
                {portal.demographics.ageGroups.map((group, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{group.age}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${group.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                        {group.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Geschlecht</h5>
              <div className="space-y-2">
                {portal.demographics.gender.map((group, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{group.gender}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${group.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                        {group.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Standorte</h5>
              <div className="space-y-2">
                {portal.demographics.locations.map((group, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{group.location}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ width: `${group.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                        {group.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PortalAnalytics;
