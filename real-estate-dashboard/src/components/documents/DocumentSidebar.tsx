import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentAnalytics,
  DOCUMENT_VISIBILITY_ICONS,
  DOCUMENT_VISIBILITY_COLORS,
  DOCUMENT_VISIBILITY_LABELS
} from '../../types/document';
import { GlassCard, GlassButton, GlassBadge } from './GlassUI';
import { 
  FolderOpen, 
  User, 
  Lock, 
  Users, 
  Share2, 
  Star, 
  Upload, 
  FolderPlus, 
  Tag, 
  BarChart3,
  TrendingUp,
  HardDrive,
  Clock,
  RefreshCw
} from 'lucide-react';

interface DocumentSidebarProps {
  analytics?: DocumentAnalytics;
  onRefresh?: () => void;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ analytics, onRefresh }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };
  
  const menuItems = [
    {
      title: 'Alle Dokumente',
      path: '/documents',
      icon: FolderOpen,
      count: analytics?.summary?.totalDocuments || 0,
      color: 'text-blue-500'
    },
    {
      title: 'Meine Dokumente',
      path: '/documents/my-documents',
      icon: User,
      count: analytics?.summary?.myDocuments || 0,
      color: 'text-green-500'
    },
    {
      title: 'Meine Privaten Dokumente',
      path: '/documents/private',
      icon: Lock,
      count: 0,
      color: DOCUMENT_VISIBILITY_COLORS.private
    },
    {
      title: 'Team-Dokumente',
      path: '/documents/team',
      icon: Users,
      count: 0,
      color: DOCUMENT_VISIBILITY_COLORS.team
    },
    {
      title: 'Geteilte Dokumente',
      path: '/documents/shared',
      icon: Share2,
      count: analytics?.summary?.sharedDocuments || 0,
      color: DOCUMENT_VISIBILITY_COLORS.shared
    },
    {
      title: 'Favoriten',
      path: '/documents/favorites',
      icon: Star,
      count: analytics?.summary?.favoriteDocuments || 0,
      color: 'text-yellow-500'
    }
  ];
  
  const quickActions = [
    {
      title: 'Dokument hochladen',
      icon: Upload,
      action: 'upload',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Neuer Ordner',
      icon: FolderPlus,
      action: 'create-folder',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Tag erstellen',
      icon: Tag,
      action: 'create-tag',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const handleQuickAction = (action: string) => {
    // Handle quick actions
    switch (action) {
      case 'upload':
        // Trigger upload modal
        break;
      case 'create-folder':
        // Trigger folder creation modal
        break;
      case 'create-tag':
        // Trigger tag creation modal
        break;
    }
  };

  return (
    <div className={`glass-sidebar transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-gray-700/30">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-blue-500" />
                Dokumente
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Dokumenten-Management
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
          
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className={`ri-${isCollapsed ? 'menu-unfold' : 'menu-fold'}-line text-lg`}></i>
          </motion.button>
        </div>
      </div>

      {/* Quick Actions */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 border-b border-white/20 dark:border-gray-700/30"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
              Schnellaktionen
            </h3>
            <div className="space-y-2">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.action}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <GlassButton
                    onClick={() => handleQuickAction(action.action)}
                    className={`w-full justify-start ${action.color} text-white`}
                    icon={<action.icon className="w-4 h-4" />}
                  >
                    {action.title}
                  </GlassButton>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/30 hover:shadow-md'
                }`}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className={`w-5 h-5 ${item.color} ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                }`} />
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between flex-1 min-w-0"
                    >
                      <span className="truncate">{item.title}</span>
                      {item.count > 0 && (
                        <GlassBadge variant="default" size="sm">
                          {item.count}
                        </GlassBadge>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Statistics */}
      <AnimatePresence>
        {!isCollapsed && analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="p-6 border-t border-white/20 dark:border-gray-700/30"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-indigo-500" />
              Statistiken
            </h3>
            
            <div className="space-y-4">
              {/* Storage Usage */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <HardDrive className="w-4 h-4 mr-2 text-blue-500" />
                    Speicher verwendet
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    2.3 GB / 10 GB
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '23%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </GlassCard>
              
              {/* Document Types Chart */}
              <GlassCard className="p-4">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                  Dokument-Typen
                </h4>
                <div className="space-y-2">
                  {analytics.charts.byType.slice(0, 3).map((item, index) => (
                    <motion.div 
                      key={item.document_type} 
                      className="flex items-center justify-between text-xs"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {item.document_type}
                        </span>
                      </div>
                      <GlassBadge variant="default" size="sm">
                        {item.count}
                      </GlassBadge>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
              
              {/* Recent Activity */}
              <GlassCard className="p-4">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-orange-500" />
                  Letzte Aktivität
                </h4>
                <div className="space-y-2">
                  {analytics.recentActivities.slice(0, 3).map((activity, index) => (
                    <motion.div 
                      key={activity.id} 
                      className="text-xs text-gray-600 dark:text-gray-400"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {activity.document.title}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{activity.activityType}</span>
                        <span>{new Date(activity.createdAt).toLocaleDateString('de-DE')}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </div>
            
            {onRefresh && (
              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full mt-4 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700/30 transition-colors flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Aktualisieren
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentSidebar;
