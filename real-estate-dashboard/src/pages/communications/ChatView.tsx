import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { ConversationList } from '../../components/communications/ConversationList';
import { MessageThread } from '../../components/communications/MessageThread';
import { StartChatModal } from '../../components/communications/StartChatModal';
import { useConversations, useMarkMessagesAsRead } from '../../api/hooks';
import type { ConversationResponse } from '../../api/types.gen';

/**
 * Chat View
 * Full 3-pane chat interface with inbox, thread, and info panel
 * Apple Glass Design with all professional chat features
 */
const ChatView: React.FC = () => {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStartChatModal, setShowStartChatModal] = useState(false);

  // Use real API hooks
  const { data: conversationsData, isLoading } = useConversations();
  const conversations: ConversationResponse[] = conversationsData?.items || [];
  const markAsRead = useMarkMessagesAsRead();

  const handleSelectConversation = (id: string) => {
    setSelectedConvId(id);
    // Mark conversation as read
    const conversation = conversations.find(c => c.id === id);
    if (conversation && conversation.unread_count > 0) {
      // TODO: Implement mark conversation as read
    }
  };

  const handlePin = (id: string) => {
    // TODO: Implement pin conversation
    console.log('Pin conversation:', id);
  };

  const handleArchive = (id: string) => {
    // TODO: Implement archive conversation
    console.log('Archive conversation:', id);
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConvId(conversationId);
    setShowStartChatModal(false);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left: Conversation List (Inbox) */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col">
        {/* Start Chat Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowStartChatModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuen Chat starten
          </button>
        </div>

        <ConversationList
          conversations={conversations}
          selectedId={selectedConvId || undefined}
          onSelect={handleSelectConversation}
          onPin={handlePin}
          onArchive={handleArchive}
          searchQuery={searchQuery}
        />
      </div>

      {/* Middle: Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedConvId ? (
          <MessageThread conversationId={selectedConvId} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Wähle eine Unterhaltung</p>
              <p className="text-sm mt-2">
                Klicke auf eine Unterhaltung links, um zu beginnen
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Info Panel */}
      {selectedConvId && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Details
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                Hier erscheinen:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Beteiligte Personen</li>
                <li>Verknüpfte Immobilie/Kunde</li>
                <li>Letzte Aktivitäten</li>
                <li>Offene Tasks</li>
                <li>Geteilte Dateien</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Start Chat Modal */}
      <StartChatModal
        isOpen={showStartChatModal}
        onClose={() => setShowStartChatModal(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};

export default ChatView;
