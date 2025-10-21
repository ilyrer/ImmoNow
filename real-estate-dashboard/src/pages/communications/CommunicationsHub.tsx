import React, { useState } from 'react';
import { MessageSquare, Phone, Calendar, Bell, Search, Filter } from 'lucide-react';
import { Tabs } from '../../components/common/Tabs';
import ChatView from './ChatView';
import { useConversations } from '../../api/hooks';

interface CommunicationsHubProps {
  initialTab?: 'chat' | 'calls' | 'schedule' | 'notifications';
}

/**
 * Communications Hub
 * Central hub for all communication features
 * Apple Glass Design with Tab Navigation
 */
const CommunicationsHub: React.FC<CommunicationsHubProps> = ({ 
  initialTab = 'chat' 
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get real conversation data
  const { data: conversationsData } = useConversations();
  const conversations = conversationsData?.items || [];
  
  // Calculate unread count from real data
  const unreadCount = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);

  const tabs = [
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: <Phone className="w-5 h-5" />,
    },
    {
      id: 'schedule',
      label: 'Termine',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 'notifications',
      label: 'Kampagnen',
      icon: <Bell className="w-5 h-5" />,
    },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header with Navigation & Search */}
      <div className="
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl
        border-b border-gray-200 dark:border-gray-700
        px-6 py-4
        shadow-sm
      ">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kommunikationszentrale
          </h1>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} ungelesene Nachrichten` : 'Alle Nachrichten gelesen'}
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Namen, Objekten, Tickets..."
              className="
                w-full pl-10 pr-4 py-2
                bg-gray-100/50 dark:bg-gray-800/50
                border border-gray-200 dark:border-gray-700
                rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200
              "
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              px-4 py-2 rounded-lg
              flex items-center gap-2
              transition-all duration-200
              ${showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Filter className="w-5 h-5" />
            Filter
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
            variant="underline"
            size="md"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <ChatView />}

        {activeTab === 'calls' && (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Phone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Video-Calls</p>
              <p className="text-sm text-gray-400 mt-2">
                WebRTC UI mit Call-History & In-Call-Controls
              </p>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Terminplanung</p>
              <p className="text-sm text-gray-400 mt-2">
                Besichtigungen & Kalender-Integration
              </p>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Kampagnen & Benachrichtigungen</p>
              <p className="text-sm text-gray-400 mt-2">
                Audience-Builder & Template-Editor
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationsHub;
