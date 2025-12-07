import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  DocumentAnalytics,
  DOCUMENT_VISIBILITY_ICONS,
  DOCUMENT_VISIBILITY_COLORS,
  DOCUMENT_VISIBILITY_LABELS
} from '../../types/document';

interface DocumentSidebarProps {
  analytics?: DocumentAnalytics;
  onRefresh?: () => void;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ analytics, onRefresh }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const menuItems = [
    {
      title: 'Alle Dokumente',
      path: '/documents',
      icon: 'ri-folder-line',
      count: analytics?.summary?.totalDocuments || 0
    },
    {
      title: 'Meine Dokumente',
      path: '/documents/my-documents',
      icon: 'ri-user-line',
      count: analytics?.summary?.myDocuments || 0
    },
    {
      title: 'Meine Privaten Dokumente',
      path: '/documents/private',
      icon: DOCUMENT_VISIBILITY_ICONS.private,
      iconColor: DOCUMENT_VISIBILITY_COLORS.private,
      count: 0 // Will be loaded from API
    },
    {
      title: 'Team-Dokumente',
      path: '/documents/team',
      icon: DOCUMENT_VISIBILITY_ICONS.team,
      iconColor: DOCUMENT_VISIBILITY_COLORS.team,
      count: 0
    },
    {
      title: 'Geteilte Dokumente',
      path: '/documents/shared',
      icon: DOCUMENT_VISIBILITY_ICONS.shared,
      iconColor: DOCUMENT_VISIBILITY_COLORS.shared,
      count: analytics?.summary?.sharedDocuments || 0
    },
    {
      title: 'Favoriten',
      path: '/documents/favorites',
      icon: 'ri-star-line',
      iconColor: 'text-yellow-600',
      count: analytics?.summary?.favoriteDocuments || 0
    }
  ];
  
  const quickActions = [
    {
      title: 'Dokument hochladen',
      icon: 'ri-upload-line',
      action: 'upload',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Neuer Ordner',
      icon: 'ri-folder-add-line',
      action: 'create-folder',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Tag erstellen',
      icon: 'ri-price-tag-3-line',
      action: 'create-tag',
      color: 'bg-purple-600 hover:bg-purple-700'
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
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dokumente
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dokumenten-Management
            </p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <i className={`ri-${isCollapsed ? 'menu-unfold' : 'menu-fold'}-line`}></i>
        </button>
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Schnellaktionen
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.action}
                onClick={() => handleQuickAction(action.action)}
                className={`w-full flex items-center px-3 py-2 text-sm text-white rounded-lg transition-colors ${action.color}`}
              >
                <i className={`${action.icon} mr-2`}></i>
                {action.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={isCollapsed ? item.title : undefined}
            >
              <i className={`${item.icon} ${item.iconColor || 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'} ${
                isActive(item.path) ? (item.iconColor?.replace('text-', 'text-') || 'text-blue-600') : ''
              } ${isCollapsed ? 'text-lg' : 'mr-3'}`}></i>
              
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.count > 0 && (
                    <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Statistics */}
      {!isCollapsed && analytics && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Statistiken
          </h3>
          
          <div className="space-y-3">
            {/* Storage Usage */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Speicher verwendet</span>
                <span>2.3 GB / 10 GB</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
            
            {/* Document Types Chart */}
            <div>
              <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                Dokument-Typen
              </h4>
              <div className="space-y-2">
                {analytics.charts.byType.slice(0, 3).map((item, index) => (
                  <div key={item.document_type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {item.document_type}
                      </span>
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recent Activity */}
            <div>
              <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                Letzte Aktivität
              </h4>
              <div className="space-y-2">
                {analytics.recentActivities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="text-xs text-gray-600 dark:text-gray-400">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {activity.document.title}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{activity.activityType}</span>
                      <span>{new Date(activity.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="w-full mt-3 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <i className="ri-refresh-line mr-1"></i>
              Aktualisieren
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentSidebar;
