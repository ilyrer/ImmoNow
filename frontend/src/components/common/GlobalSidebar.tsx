import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useTenant } from '../../hooks/useTenant';
import {
  Home,
  BarChart3,
  FileText,
  TrendingUp,
  Users,
  Target,
  Building2,
  MessageSquare,
  ClipboardList,
  Calculator,
  Share2,
  UserCircle,
  Briefcase,
  ChevronDown
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

interface GlobalSidebarProps {
  user?: any;
  onLogout?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ onLogout, onCollapsedChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useUser();
  const { tenant } = useTenant();

  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed);
    }
  };

  // Gruppierte Navigation für bessere Übersicht
  const mainNavItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'properties', label: 'Immobilien', icon: Building2, path: '/properties' },
    { id: 'contacts', label: 'Kontakte', icon: UserCircle, path: '/contacts' },
    { id: 'communications', label: 'Kommunikation', icon: MessageSquare, path: '/communications', badge: 2 }
  ];

  const workflowItems: SidebarItem[] = [
    { id: 'team-status', label: 'Team Status', icon: Users, path: '/team-status' },
    { id: 'kanban', label: 'Kanban Board', icon: ClipboardList, path: '/kanban' }
  ];

  const analyticsItems: SidebarItem[] = [
    { id: 'cim', label: 'CIM Analytics', icon: BarChart3, path: '/cim' },
    { id: 'avm', label: 'AVM & Markt', icon: TrendingUp, path: '/avm' },
    { id: 'matching', label: 'KI-Matching', icon: Target, path: '/matching' }
  ];

  const toolsItems: SidebarItem[] = [
    { id: 'documents', label: 'Dokumente', icon: FileText, path: '/documents' },
    { id: 'finance', label: 'Finanzierung', icon: Calculator, path: '/financing' },
    { id: 'investoren', label: 'Investoren', icon: Briefcase, path: '/investor' },
    { id: 'social-hub', label: 'Social Hub', icon: Share2, path: '/social-hub' }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleItemClick = (item: SidebarItem) => {
    navigate(item.path);
  };

  // Render-Funktion für Navigation Items
  const renderNavItem = (item: SidebarItem) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    return (
      <div key={item.id} className="relative group/item">
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-[12px] 
            transition-all duration-200 relative overflow-hidden
            ${isCollapsed ? 'justify-center px-3' : ''}
            ${active 
              ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm' 
              : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          {/* Subtle Active Indicator */}
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full"></div>
          )}
          
          {/* Icon */}
          <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-all duration-200 ${
            active 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-slate-600 dark:text-slate-400 group-hover/item:text-slate-900 dark:group-hover/item:text-white'
          }`} />
          
          {/* Label */}
          {!isCollapsed && (
            <span className={`font-medium text-[14px] transition-all duration-200 ${
              active ? 'font-semibold' : ''
            }`}>
              {item.label}
            </span>
          )}
          
          {/* Badge */}
          {item.badge && (
            <>
              {!isCollapsed ? (
                <span className="ml-auto px-2 py-0.5 bg-blue-500 text-white text-[11px] rounded-full font-semibold shadow-sm">
                  {item.badge}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-sm"></span>
              )}
            </>
          )}
        </button>
        
        {/* Tooltip für Collapsed Mode */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 
            bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl
            text-white text-sm font-medium rounded-lg 
            shadow-lg
            opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible 
            transition-all duration-200 whitespace-nowrap z-50 pointer-events-none
            border border-white/10">
            {item.label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 
              border-[5px] border-transparent 
              border-r-slate-900/95 dark:border-r-slate-800/95"></div>
          </div>
        )}
      </div>
    );
  };

  // User-Daten aus UserContext
  if (!user) {
    return null;
  }

  // UserContext liefert bereits normalisierte Daten
  const userName = user.name || user.email;
  const userInitials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out z-50 ${
        isCollapsed ? 'w-[90px]' : 'w-[300px]'
      }`}
    >
      {/* Apple-Style Glasmorphismus Container */}
      <div className={`h-full m-3 rounded-[28px] backdrop-blur-3xl transition-all duration-300 relative
        bg-white/30 dark:bg-slate-900/50
        border border-white/50 dark:border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(255,255,255,0.15)]
        dark:shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.08)]
        flex flex-col overflow-hidden`}
      >
        
        {/* Subtile Background Glow */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px] pointer-events-none opacity-40">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[80px]"></div>
        </div>

        {/* Header: Logo & Brand - Apple Style mit ImmoNow Logo */}
        <div className={`relative px-6 pt-7 pb-5 border-b border-white/20 dark:border-white/10 transition-all duration-300 ${
          isCollapsed ? 'px-4' : ''
        }`}>
          <button 
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center group cursor-pointer"
          >
            <div className={`flex items-center gap-4 transition-all duration-300 ${
              isCollapsed ? 'flex-col gap-2' : ''
            }`}>
              {/* ImmoNow Logo - Dein Firmenlogo */}
              <div className="relative w-14 h-14 rounded-[18px] bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-500 overflow-hidden">
                {/* Platzhalter für dein Logo - kannst du später durch ein Bild ersetzen */}
                <img 
                  src="/logo/immonow-logo.png" 
                  alt="ImmoNow" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback zu Initialen wenn Bild nicht geladen werden kann
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="relative text-white font-bold text-2xl tracking-tight">IM</span>';
                  }}
                />
                {/* Subtle Inner Glow */}
                <div className="absolute inset-[2px] rounded-[16px] bg-gradient-to-br from-white/20 to-transparent opacity-60"></div>
              </div>
              
              {/* Brand Text */}
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white font-semibold text-xl leading-tight">
                    ImmoNow
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-tight">
                    Real Estate
                  </span>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* User Profile Section mit Firmenlogo des Users */}
        <div className={`relative px-5 py-4 border-b border-white/20 dark:border-white/10 transition-all duration-300 ${
          isCollapsed ? 'px-4' : ''
        }`}>
          <div className={`w-full rounded-[16px] p-3.5 flex items-center gap-3.5 
            bg-white/40 dark:bg-white/5
            border border-white/50 dark:border-white/10
            shadow-sm
            transition-all duration-300
            ${isCollapsed ? 'justify-center p-2.5' : ''}`}
          >
            {/* User Avatar mit Firmenlogo */}
            <div className="relative">
              {tenant?.logo_url ? (
                /* Firmenlogo des Tenants */
                <div className="relative w-11 h-11 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-md border-2 border-white/50 dark:border-slate-700/50 overflow-hidden">
                  <img 
                    src={tenant.logo_url} 
                    alt={tenant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback zu Initialen wenn Logo nicht geladen werden kann
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = document.createElement('span');
                      fallback.className = 'text-slate-700 dark:text-slate-300 font-semibold text-base';
                      fallback.textContent = userInitials;
                      target.parentElement!.appendChild(fallback);
                    }}
                  />
                </div>
              ) : (
                /* Fallback: User Initialen */
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-base">
                    {userInitials}
                  </span>
                </div>
              )}
              
              {/* Online Status */}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
            </div>
            
            {/* User Info mit Firmenname */}
            {!isCollapsed && (
              <div className="flex-1 flex flex-col">
                <span className="text-slate-900 dark:text-white font-semibold text-sm">
                  {userName}
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-xs">
                  {tenant?.name || 'My Account'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items - Gruppiert für bessere Übersicht */}
        <nav className="flex-1 px-4 py-3 overflow-y-auto apple-scrollbar">
          
          {/* Hauptnavigation */}
          {!isCollapsed && (
            <div className="px-2 mb-3">
              <span className="text-slate-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-50">
                Hauptmenü
              </span>
            </div>
          )}
          <div className="space-y-0.5 mb-4">
            {mainNavItems.map((item) => renderNavItem(item))}
          </div>

          {/* Workflow */}
          <div className="my-4 mx-2 border-t border-white/20 dark:border-white/10"></div>
          {!isCollapsed && (
            <div className="px-2 mb-3 mt-4">
              <span className="text-slate-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-50">
                Workflow
              </span>
            </div>
          )}
          <div className="space-y-0.5 mb-4">
            {workflowItems.map((item) => renderNavItem(item))}
          </div>

          {/* Analytics */}
          <div className="my-4 mx-2 border-t border-white/20 dark:border-white/10"></div>
          {!isCollapsed && (
            <div className="px-2 mb-3 mt-4">
              <span className="text-slate-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-50">
                Analytics
              </span>
            </div>
          )}
          <div className="space-y-0.5 mb-4">
            {analyticsItems.map((item) => renderNavItem(item))}
          </div>

          {/* Tools & Services */}
          <div className="my-4 mx-2 border-t border-white/20 dark:border-white/10"></div>
          {!isCollapsed && (
            <div className="px-2 mb-3 mt-4">
              <span className="text-slate-500 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-50">
                Tools & Services
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            {toolsItems.map((item) => renderNavItem(item))}
          </div>
        </nav>
      </div>

      {/* Minimale Custom Styles für Apple Look */}
      <style>{`
        .apple-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .apple-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .apple-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .apple-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
        .dark .apple-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.4);
        }
        .dark .apple-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.6);
        }
      `}</style>
    </aside>
  );
};

export default GlobalSidebar;
