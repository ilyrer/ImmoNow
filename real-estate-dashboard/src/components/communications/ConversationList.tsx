import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Pin, 
  Archive, 
  MoreVertical, 
  CheckCheck,
  Circle
} from 'lucide-react';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import type { ConversationResponse } from '../../api/types.gen';

interface ConversationListProps {
  conversations: ConversationResponse[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onPin?: (id: string) => void;
  onArchive?: (id: string) => void;
  searchQuery?: string;
}

/**
 * ConversationList Component
 * Displays list of conversations with search and filtering
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  onPin,
  onArchive,
  searchQuery = '',
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Jetzt';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const getConversationIcon = (participants: any[]): React.ReactNode => {
    if (participants.length > 2) {
      return (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
          👥
        </div>
      );
    }
    return null;
  };

  const handleContextMenu = (e: React.MouseEvent, convId: string) => {
    e.preventDefault();
    setActiveMenu(activeMenu === convId ? null : convId);
  };

  // Sortiere: Pinned zuerst, dann nach updated_at
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = a.metadata?.is_pinned || false;
    const bPinned = b.metadata?.is_pinned || false;
    
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Unterhaltungen
        </h2>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
            <div className="text-center">
              <Circle className="w-12 h-12 mx-auto mb-2" />
              <p>Keine Unterhaltungen</p>
            </div>
          </div>
        ) : (
          sortedConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              onContextMenu={(e) => handleContextMenu(e, conv.id)}
                className={`
                relative px-4 py-3 cursor-pointer
                border-l-4 transition-all duration-200
                ${selectedId === conv.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-600'
                  : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
                ${conv.unread_count > 0 ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    name={conv.participants[0]?.name || conv.title}
                    size="md"
                    showStatus={conv.participants.length === 2}
                    status="online"
                  />
                  {getConversationIcon(conv.participants)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`
                        text-sm font-semibold truncate
                        ${conv.unread_count > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
                      `}>
                        {conv.title}
                      </span>
                      {conv.metadata?.is_pinned && (
                        <Pin className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                      {conv.metadata?.priority && conv.metadata.priority !== 'normal' && (
                        <Badge variant={conv.metadata.priority === 'high' || conv.metadata.priority === 'urgent' ? 'danger' : 'warning'} className="text-xs">
                          {conv.metadata.priority}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(conv.updated_at)}
                    </span>
                  </div>

                  {/* Last Message */}
                  {conv.last_message && (
                    <div className="flex items-center gap-2">
                      <p className={`
                        text-sm truncate
                        ${conv.unread_count > 0
                          ? 'text-gray-900 dark:text-white font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                        }
                      `}>
                        {conv.participants.length > 2 && `${conv.last_message?.sender_name}: `}
                        {conv.last_message?.content}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Participants (for groups) */}
                  {conv.participants.length > 2 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-400">
                        {conv.participants.length} Teilnehmer
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Context Menu */}
              {activeMenu === conv.id && (
                <div className="absolute right-2 top-2 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPin?.(conv.id);
                      setActiveMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Pin className="w-4 h-4" />
                    {conv.metadata?.is_pinned ? 'Entpinnen' : 'Anpinnen'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive?.(conv.id);
                      setActiveMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Archivieren
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
