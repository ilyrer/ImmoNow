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
  Building2,
  MessageSquare,
  Video,
  ClipboardList,
  Calculator,
  User,
  LogOut,
  Share2,
  UserCircle,
  Briefcase,
  Phone,
  Shield
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  divider?: boolean;
  section?: 'main' | 'cim' | 'tools' | 'user';
}

interface GlobalSidebarProps {
  user?: any;
  onLogout?: () => void;
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarItems: SidebarItem[] = [
    // Main Navigation
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/',
      section: 'main'
    },
    {
      id: 'properties',
      label: 'Immobilien',
      icon: Building2,
      path: '/properties',
      section: 'main'
    },
    {
      id: 'contacts',
      label: 'Kontakte',
      icon: UserCircle,
      path: '/kontakte',
      section: 'main'
    },
    {
      id: 'team-status',
      label: 'Team Status',
      icon: Users,
      path: '/team-status',
      section: 'main'
    },
    {
      id: 'kanban',
      label: 'Kanban Board',
      icon: ClipboardList,
      path: '/kanban',
      section: 'main',
      divider: true
    },
    
    // Communications
    {
      id: 'communications',
      label: 'Kommunikation',
      icon: MessageSquare,
      path: '/communications',
      badge: 15,
      section: 'main'
    },
    
    // CIM Analytics
    {
      id: 'cim',
      label: 'CIM Analytics',
      icon: BarChart3,
      path: '/cim',
      section: 'cim'
    },
    {
      id: 'avm',
      label: 'AVM & Marktintelligenz',
      icon: TrendingUp,
      path: '/avm',
      section: 'cim'
    },
    {
      id: 'matching',
      label: 'KI-Matching',
      icon: Target,
      path: '/matching',
      section: 'cim',
      divider: true
    },
    
    // Tools & Documents
    {
      id: 'documents',
      label: 'Dokumente',
      icon: FileText,
      path: '/dokumente',
      section: 'tools'
    },
    {
      id: 'finance',
      label: 'Finanzierung',
      icon: Calculator,
      path: '/finance',
      section: 'tools'
    },
    {
      id: 'investoren',
      label: 'Investoren',
      icon: Briefcase,
      path: '/investoren',
      section: 'tools'
    },
    {
      id: 'social-hub',
      label: 'Social Hub',
      icon: Share2,
      path: '/social-hub',
      section: 'tools',
      divider: true
    },
    
    // User & Settings
    {
      id: 'admin',
      label: 'Admin-Konsole',
      icon: Shield,
      path: '/admin',
      section: 'user'
    },
    {
      id: 'profile',
      label: 'Mein Profil',
      icon: UserCircle,
      path: '/profile',
      section: 'user'
    },
    {
      id: 'subscription',
      label: 'Abo verwalten',
      icon: DollarSign,
      path: '/subscription',
      section: 'user'
    },
    {
      id: 'settings',
      label: 'Einstellungen',
      icon: Settings,
      path: '/settings',
      section: 'user'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleItemClick = (item: SidebarItem) => {
    navigate(item.path);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const renderNavSection = (sectionItems: SidebarItem[], title: string) => {
    if (sectionItems.length === 0) return null;
    
    return (
      <div key={title} className="mb-6">
        <h3 className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-dark-text-tertiary uppercase tracking-wider">
          {title}
        </h3>
        <div className="space-y-1">
          {sectionItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <React.Fragment key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    active
                      ? 'bg-glass-blue dark:bg-glass-blue text-gray-900 dark:text-dark-text-primary shadow-apple-soft border border-apple-blue/20 dark:border-apple-blue/40 scale-102'
                      : 'text-gray-700 dark:text-dark-text-secondary hover:bg-white/30 dark:hover:bg-glass-dark-hover hover:text-gray-900 dark:hover:text-dark-text-primary hover:scale-102'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-colors duration-200 ${
                      active ? 'text-apple-blue dark:text-apple-blue' : 'text-gray-600 dark:text-dark-text-tertiary group-hover:text-gray-700 dark:group-hover:text-dark-text-secondary'
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-apple-red text-white text-xs rounded-full font-medium shadow-apple-soft">
                      {item.badge}
                    </span>
                  )}
                </button>
                {item.divider && <div className="h-px bg-white/10 dark:bg-glass-dark-border my-2" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const mainItems = sidebarItems.filter(item => item.section === 'main');
  const cimItems = sidebarItems.filter(item => item.section === 'cim');
  const toolsItems = sidebarItems.filter(item => item.section === 'tools');
  const userItems = sidebarItems.filter(item => item.section === 'user');

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 bg-white/10 dark:bg-dark-500/90 backdrop-blur-4xl border-r border-white/20 dark:border-glass-dark-border shadow-apple-elevated z-50">
      <div className="flex flex-col h-full">
        
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10 dark:border-glass-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-apple-blue via-apple-purple to-apple-green rounded-2xl flex items-center justify-center shadow-apple-blue-glow">
              <span className="text-white font-bold text-lg">IM</span>
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-dark-text-primary font-semibold text-lg">Immonow</h1>
              <p className="text-gray-600 dark:text-dark-text-tertiary text-xs">Real Estate CRM</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-4">
          <GlobalSearch placeholder="Suchen..." compact />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 overflow-y-auto">
          {renderNavSection(mainItems, 'HAUPTBEREICH')}
          {renderNavSection(cimItems, 'CIM & ANALYTICS')}
          {renderNavSection(toolsItems, 'TOOLS & DOKUMENTE')}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10 dark:border-glass-dark-border bg-white/5 dark:bg-dark-300/20 backdrop-blur-xl">
          {user && (
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-apple-purple to-apple-pink rounded-xl flex items-center justify-center shadow-apple-purple-glow">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-dark-text-primary font-medium text-sm truncate">
                    {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                  </p>
                  <p className="text-gray-600 dark:text-dark-text-tertiary text-xs truncate">
                    {user.plan || 'Professional'} Plan
                  </p>
                </div>
              </div>
              
              {/* User Section Items */}
              <div className="space-y-1 mb-3">
                {userItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        active
                          ? 'bg-white/30 dark:bg-glass-blue text-gray-900 dark:text-dark-text-primary shadow-apple-soft'
                          : 'text-gray-600 dark:text-dark-text-secondary hover:bg-white/20 dark:hover:bg-glass-dark-hover hover:text-gray-900 dark:hover:text-dark-text-primary hover:scale-102'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-600 dark:text-dark-text-secondary hover:text-apple-red dark:hover:text-apple-red hover:bg-red-50 dark:hover:bg-glass-red rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default GlobalSidebar;
