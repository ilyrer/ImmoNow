import React, { useState, useEffect } from 'react';
import { X, Search, User, Users } from 'lucide-react';
import { useCreateConversation, useColleagues } from '../../api/hooks';
import type { UserResponse } from '../../api/types.gen';
import { UserRole } from '../../api/types.gen';

interface StartChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const StartChatModal: React.FC<StartChatModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([]);
  const [conversationTitle, setConversationTitle] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);
  
  const createConversationMutation = useCreateConversation();
  
  // Get real colleagues from API
  const { data: colleagues, isLoading: colleaguesLoading } = useColleagues();

  const filteredUsers = (colleagues || []).filter(user =>
    user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (user: UserResponse) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const participantIds = selectedUsers.map(user => user.id);
      
      const conversationData = {
        title: conversationTitle || (isGroupChat 
          ? `${selectedUsers.map(u => u.first_name).join(', ')}`
          : selectedUsers[0].first_name
        ),
        participant_ids: participantIds,
        is_group: isGroupChat || selectedUsers.length > 1
      };

      const conversation = await createConversationMutation.mutateAsync(conversationData);
      
      onConversationCreated(conversation.id);
      onClose();
      
      // Reset form
      setSelectedUsers([]);
      setConversationTitle('');
      setSearchQuery('');
      setIsGroupChat(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedUsers([]);
    setConversationTitle('');
    setSearchQuery('');
    setIsGroupChat(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Neuen Chat starten
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Chat Type Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGroupChat(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                !isGroupChat
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              Einzelchat
            </button>
            <button
              onClick={() => setIsGroupChat(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isGroupChat
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Gruppenchat
            </button>
          </div>

          {/* Group Chat Title */}
          {isGroupChat && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chat-Titel
              </label>
              <input
                type="text"
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                placeholder="z.B. Projekt Team Alpha"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mitarbeiter suchen
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name oder E-Mail eingeben..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ausgewählte Mitarbeiter ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{user.first_name} {user.last_name}</span>
                    <button
                      onClick={() => handleUserSelect(user)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User List */}
          <div className="max-h-60 overflow-y-auto">
            {colleaguesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Lade Mitarbeiter...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Keine Mitarbeiter gefunden' : 'Keine Mitarbeiter verfügbar'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.find(u => u.id === user.id)
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {user.first_name[0]}{user.last_name[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                    {selectedUsers.find(u => u.id === user.id) && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0 || createConversationMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createConversationMutation.isPending ? 'Erstelle...' : 'Chat starten'}
          </button>
        </div>
      </div>
    </div>
  );
};
