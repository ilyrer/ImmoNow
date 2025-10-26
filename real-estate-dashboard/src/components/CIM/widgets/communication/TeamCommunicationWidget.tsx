import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Circle, Send, Phone, Video } from 'lucide-react';

interface CommunicationData {
  unreadMessages: number;
  activeConversations: Array<{
    id: string;
    title: string;
    lastMessage: string;
    unreadCount: number;
    participants: Array<{
      name: string;
      isOnline: boolean;
    }>;
    lastActivity: string;
  }>;
  onlineMembers: Array<{
    id: string;
    name: string;
    status: 'online' | 'away' | 'busy';
  }>;
  totalMembers: number;
}

const TeamCommunicationWidget: React.FC = () => {
  const [communicationData, setCommunicationData] = useState<CommunicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommunicationData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch communications data
        const [conversationsResponse, membersResponse] = await Promise.all([
          fetch('/api/v1/communications/conversations'),
          fetch('/api/v1/users')
        ]);

        const conversationsData = await conversationsResponse.json();
        const membersData = await membersResponse.json();

        console.log('📊 Communications Response:', conversationsData);
        console.log('📊 Members Response:', membersData);

        const totalUnread = conversationsData.conversations?.reduce((sum: number, conv: any) => 
          sum + (conv.unread_count || 0), 0) || 0;

        setCommunicationData({
          unreadMessages: totalUnread,
          activeConversations: (conversationsData.conversations || []).map((conv: any) => ({
            id: conv.id || '',
            title: conv.title || 'Unbekannte Konversation',
            lastMessage: conv.last_message || 'Keine Nachrichten',
            unreadCount: conv.unread_count || 0,
            participants: (conv.participants || []).map((p: any) => ({
              name: p.name || 'Unbekannt',
              isOnline: p.is_online || false
            })),
            lastActivity: conv.last_activity || new Date().toISOString()
          })),
          onlineMembers: (membersData.users || []).filter((user: any) => user.is_online).map((user: any) => ({
            id: user.id || '',
            name: user.name || 'Unbekannt',
            status: user.status || 'online'
          })),
          totalMembers: membersData.users?.length || 0
        });

      } catch (error) {
        console.error('❌ Error fetching communication data:', error);
        // Fallback data
        setCommunicationData({
          unreadMessages: 0,
          activeConversations: [],
          onlineMembers: [],
          totalMembers: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunicationData();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchCommunicationData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lädt Team-Chat...</p>
        </div>
      </div>
    );
  }

  if (!communicationData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Keine Team-Chat Daten verfügbar</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Team Chat
        </h3>
        <div className="flex items-center space-x-2">
          {communicationData.unreadMessages > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {communicationData.unreadMessages}
            </div>
          )}
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
      </div>

      {/* Online Members */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
            <Users className="w-4 h-4 mr-1" />
            Online ({communicationData.onlineMembers.length})
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {communicationData.totalMembers} Mitglieder
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {communicationData.onlineMembers.length > 0 ? (
            communicationData.onlineMembers.slice(0, 6).map((member, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="relative">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${getStatusColor(member.status)}`} />
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {member.name}
                </span>
              </div>
            ))
          ) : (
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center w-full">
              <p className="text-xs text-gray-500 dark:text-gray-400">Keine Mitglieder online</p>
            </div>
          )}
        </div>
      </div>

      {/* Aktive Konversationen */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Aktive Chats
          </h4>
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-2">
          {communicationData.activeConversations.length > 0 ? (
            communicationData.activeConversations.slice(0, 3).map((conversation, index) => (
              <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {conversation.title}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <div className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(conversation.lastActivity).toLocaleTimeString('de-DE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {conversation.lastMessage}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {conversation.participants.slice(0, 3).map((participant, pIndex) => (
                    <div key={pIndex} className="relative">
                      <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                        participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  ))}
                  {conversation.participants.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{conversation.participants.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Keine aktiven Chats</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Send className="w-3 h-3" />
          <span>Nachricht</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors">
          <Video className="w-3 h-3" />
          <span>Video Call</span>
        </button>
      </div>
    </div>
  );
};

export default TeamCommunicationWidget;
