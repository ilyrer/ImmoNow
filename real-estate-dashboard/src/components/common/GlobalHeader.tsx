import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useApi';
import { Sun, Moon, Bell, User, Settings, LogOut, HelpCircle, Shield, CreditCard } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const GlobalHeader: React.FC = () => {
  const { data: user } = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!user) {
    return null;
  }

  // Prefer real first+last name unless it's a placeholder like "string string", else show full email
  const hasValidName = user.first_name && user.last_name &&
    user.first_name.toLowerCase() !== 'string' && user.last_name.toLowerCase() !== 'string';
  const userName = hasValidName ? `${user.first_name} ${user.last_name}` : user.email;
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  // Mock notifications
  const notifications = [
    {
      id: 1,
      type: 'success',
      icon: 'ri-check-line',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      title: 'Beitrag veröffentlicht',
      message: 'Ihr Instagram Post wurde erfolgreich veröffentlicht',
      time: 'vor 5 Minuten',
      unread: true,
    },
    {
      id: 2,
      type: 'info',
      icon: 'ri-user-add-line',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      title: 'Neuer Kontakt',
      message: 'Max Mustermann wurde zu Ihren Kontakten hinzugefügt',
      time: 'vor 1 Stunde',
      unread: true,
    },
    {
      id: 3,
      type: 'warning',
      icon: 'ri-calendar-line',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      title: 'Termin-Erinnerung',
      message: 'Meeting mit Kunde in 30 Minuten',
      time: 'vor 2 Stunden',
      unread: false,
    },
    {
      id: 4,
      type: 'info',
      icon: 'ri-file-text-line',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      title: 'Dokument hochgeladen',
      message: 'Neues Dokument "Vertrag_2024.pdf" wurde hinzugefügt',
      time: 'vor 3 Stunden',
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = () => {
    // Clear auth token
    localStorage.removeItem('authToken');
    // Redirect to login
    navigate('/login');
  };

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/team-status':
        return 'Vertriebsteam-Status';
      case '/projektstatus':
        return 'Projektstatus-Übersicht';
      case '/aufgaben':
        return 'Vertriebsaufgaben';
      case '/kanban':
        return 'Aufgaben Board';
      case '/termine':
        return 'Terminkalender & Fristen';
      case '/calendar':
        return 'Kalender';
      case '/messages':
        return 'Nachrichten';
      case '/meetings':
      case '/video-meetings':
        return 'Video Meetings';
      case '/immobilien':
        return 'Immobilien';
      case '/kontakte':
        return 'Kontakte';
      case '/finance':
        return 'Finanzierung';
      case '/admin':
        return 'Verwaltung';
      case '/dokumente':
      case '/documents':
        return 'Dokument-Management';
      case '/measures':
        return 'Maßnahmen-Tracking';
      case '/subscription':
        return 'Abonnement verwalten';
      case '/cim':
        return 'CIM Dashboard';
      case '/reports':
        return 'Berichte';
      case '/integrations':
        return 'Integrationen';
      case '/mailbox':
        return 'Posteingang';
      case '/tasks':
        return 'Aufgaben';
      case '/contacts':
        return 'Kontakte';
      case '/properties':
        return 'Immobilien';
      case '/settings':
        return 'Einstellungen';
      case '/social-hub':
        return 'Social Media Hub';
      default:
        if (location.pathname.startsWith('/immobilien/')) {
          return 'Immobilien-Details';
        }
        if (location.pathname.startsWith('/kontakte/')) {
          return 'Kontakt-Details';
        }
        return 'Dashboard';
    }
  };

  return (
    <div className="glass border-b border-white/10 dark:border-glass-dark-border backdrop-blur-4xl relative z-[9998]">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
          {getPageTitle()}
        </h1>
        
        <div className="flex items-center space-x-4">
          {/* Search Field */}
          <div className="w-80">
            <GlobalSearch placeholder="Search analytics, users, reports" />
          </div>
          
          {/* Date Dropdown */}
          <div className="relative">
            <select className="bg-white/10 dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-glass-dark-border px-4 py-2.5 rounded-xl text-sm text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-apple-blue/50 appearance-none pr-8 shadow-apple-soft transition-all duration-200 hover:bg-white/20 dark:hover:bg-glass-dark-hover hover:scale-102">
              <option>Last 30d</option>
              <option>Last 7d</option>
              <option>Last 90d</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <i className="ri-arrow-down-s-line text-gray-400 dark:text-dark-text-tertiary text-sm"></i>
            </div>
          </div>
          
          {/* Dark/Light Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="relative w-12 h-6 bg-white/10 dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-glass-dark-border rounded-full transition-all duration-300 hover:bg-white/20 dark:hover:bg-glass-dark-hover shadow-apple-soft group hover:scale-102"
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-gradient-to-r ${
              isDarkMode 
                ? 'from-apple-blue to-apple-purple translate-x-6' 
                : 'from-apple-orange to-apple-yellow translate-x-0.5'
            } rounded-full transition-all duration-300 shadow-apple-soft flex items-center justify-center`}>
              {isDarkMode ? (
                <Moon className="w-3 h-3 text-white" />
              ) : (
                <Sun className="w-3 h-3 text-white" />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-apple-blue/20 to-apple-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {/* Notifications */}
          <div className="relative z-[10000]" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 bg-white/10 dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-glass-dark-border rounded-xl flex items-center justify-center hover:bg-white/20 dark:hover:bg-glass-dark-hover transition-all duration-300 shadow-apple-soft hover:scale-102"
            >
              <Bell className="w-4 h-4 text-gray-600 dark:text-dark-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-apple-red rounded-full flex items-center justify-center text-white text-xs font-bold shadow-apple-soft">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-300 backdrop-blur-4xl rounded-xl shadow-apple-elevated border border-gray-200 dark:border-glass-dark-border overflow-hidden z-[9999]">
                {/* Header */}
                <div className="p-3 border-b border-gray-200 dark:border-glass-dark-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-glass-blue dark:to-glass-purple">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
                      Benachrichtigungen
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-apple-blue/20 dark:bg-glass-blue text-apple-blue dark:text-dark-text-primary text-xs font-semibold rounded-full">
                        {unreadCount} neu
                      </span>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 dark:border-glass-dark-border hover:bg-gray-50 dark:hover:bg-glass-dark-hover transition-colors cursor-pointer ${
                        notification.unread ? 'bg-blue-50/50 dark:bg-glass-blue' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 ${notification.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <i className={`${notification.icon} ${notification.color} text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-xs text-gray-900 dark:text-dark-text-primary">
                              {notification.title}
                            </p>
                            {notification.unread && (
                              <div className="w-1.5 h-1.5 bg-apple-blue rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-gray-200 dark:border-glass-dark-border bg-gray-50 dark:bg-dark-300/50 backdrop-blur-xl">
                  <button className="w-full text-center text-xs font-medium text-apple-blue dark:text-apple-blue hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1">
                    Alle Benachrichtigungen anzeigen
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* User Profile */}
          <div className="relative z-[10000]" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:bg-white/10 dark:hover:bg-glass-dark-hover px-3 py-2 rounded-xl transition-all duration-200 hover:scale-102"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-apple-purple to-apple-pink rounded-xl flex items-center justify-center shadow-apple-purple-glow">
                <span className="text-white font-semibold text-sm">
                  {userInitials}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                  {userName}
                </span>
                <i className={`ri-arrow-down-s-line text-gray-400 dark:text-dark-text-tertiary text-sm transition-transform duration-200 ${
                  showUserMenu ? 'rotate-180' : ''
                }`}></i>
              </div>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-300 backdrop-blur-4xl rounded-xl shadow-apple-elevated border border-gray-200 dark:border-glass-dark-border overflow-hidden z-[9999]">
                {/* User Info Header */}
                <div className="p-3 border-b border-gray-200 dark:border-glass-dark-border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-glass-purple dark:to-glass-red">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-gradient-to-br from-apple-purple to-apple-pink rounded-lg flex items-center justify-center shadow-apple-purple-glow flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {userInitials}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-dark-text-primary truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-dark-text-secondary truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-glass-dark-hover transition-colors text-left hover:scale-102"
                  >
                    <User className="w-4 h-4 text-gray-600 dark:text-dark-text-tertiary flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 dark:text-dark-text-primary">
                      Mein Profil
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-glass-dark-hover transition-colors text-left hover:scale-102"
                  >
                    <Settings className="w-4 h-4 text-gray-600 dark:text-dark-text-tertiary flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 dark:text-dark-text-primary">
                      Einstellungen
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/subscription');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-glass-dark-hover transition-colors text-left hover:scale-102"
                  >
                    <CreditCard className="w-4 h-4 text-gray-600 dark:text-dark-text-tertiary flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 dark:text-dark-text-primary">
                      Abonnement
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/admin');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-glass-dark-hover transition-colors text-left hover:scale-102"
                  >
                    <Shield className="w-4 h-4 text-gray-600 dark:text-dark-text-tertiary flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 dark:text-dark-text-primary">
                      Verwaltung
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      window.open('https://docs.immonow.com', '_blank');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-glass-dark-hover transition-colors text-left hover:scale-102"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-600 dark:text-dark-text-tertiary flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 dark:text-dark-text-primary">
                      Hilfe & Support
                    </span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="p-1.5 border-t border-gray-200 dark:border-glass-dark-border">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-glass-red transition-colors text-left group hover:scale-102"
                  >
                    <LogOut className="w-4 h-4 text-gray-600 dark:text-dark-text-tertiary group-hover:text-apple-red dark:group-hover:text-apple-red flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 dark:text-dark-text-primary group-hover:text-apple-red dark:group-hover:text-apple-red">
                      Abmelden
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalHeader;
