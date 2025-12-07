import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BarChart3,
  FileText,
  TrendingUp,
  Users,
  Target,
  Settings,
  Bell,
  Search,
  Calendar,
  MapPin,
  DollarSign,
  Filter,
  Activity,
  Share2,
  Building2,
  UserCircle,
  Briefcase
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  badge?: number;
  isActive?: boolean;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarItems: SidebarItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'properties',
      label: 'Immobilien',
      icon: Building2,
      path: '/properties'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: UserCircle,
      path: '/contacts'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      path: '/reports'
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: TrendingUp,
      path: '/sales'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      path: '/customers'
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Target,
      path: '/performance'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ];

  const moduleItems: SidebarItem[] = [
    {
      id: 'investoren',
      label: 'Investoren',
      icon: Briefcase,
      path: '/investoren'
    },
    {
      id: 'kpi',
      label: 'KPIs',
      icon: Activity,
    },
    {
      id: 'geographical',
      label: 'Geografisch',
      icon: MapPin,
    },
    {
      id: 'segmentation',
      label: 'Segmentierung',
      icon: Filter,
    },
    {
      id: 'financial',
      label: 'Finanzen',
      icon: DollarSign,
    },
    {
      id: 'social-hub',
      label: 'Social Hub',
      icon: Share2,
      path: '/social-hub'
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: Bell,
      badge: 3
    }
  ];

  const handleItemClick = (item: SidebarItem) => {
    if (item.path) {
      navigate(item.path);
    } else {
      onTabChange(item.id);
    }
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    return activeTab === item.id;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 z-50">
      {/* Glasmorphism Sidebar */}
      <div className="h-full bg-white/20 dark:bg-white/5 backdrop-blur-xl border-r border-white/20 dark:border-white/10 shadow-glass">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glass">
              <span className="text-white font-bold text-lg">GB</span>
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-white font-semibold text-lg">Glass Bento</h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs">CIM Dashboard</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search analytics, users, reports"
              className="w-full pl-10 pr-4 py-2.5 bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 pb-4">
          {/* Haupt-Navigation */}
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    active
                      ? 'bg-white/40 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass border border-white/30 dark:border-white/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-colors duration-200 ${
                      active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"></div>

          {/* Module Navigation */}
          <div className="space-y-1">
            <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Module
            </h3>
            {moduleItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    active
                      ? 'bg-white/40 dark:bg-white/10 text-gray-900 dark:text-white shadow-glass border border-white/30 dark:border-white/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-colors duration-200 ${
                      active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-3 shadow-glass">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white font-medium text-sm truncate">Jane Doe</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs truncate">Administrator</p>
              </div>
              <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
