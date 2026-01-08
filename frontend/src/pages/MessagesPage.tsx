import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/config';
import { toast } from 'react-hot-toast';

interface Conversation {
  id: string;
  participant_name: string;
  participant_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  property_title?: string;
  status: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'client';
  sender_name: string;
  created_at: string;
  is_read: boolean;
}

const MessagesPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/chat/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Fallback to mock data for development
      setConversations([
        {
          id: '1',
          participant_name: 'Max Mustermann',
          participant_email: 'max@example.com',
          last_message: 'Wann können wir die Wohnung besichtigen?',
          last_message_time: new Date().toISOString(),
          unread_count: 2,
          property_title: 'Villa in Hamburg',
          status: 'active'
        },
        {
          id: '2',
          participant_name: 'Anna Schmidt',
          participant_email: 'anna@example.com',
          last_message: 'Vielen Dank für die Unterlagen!',
          last_message_time: new Date(Date.now() - 3600000).toISOString(),
          unread_count: 0,
          property_title: 'Penthouse in München',
          status: 'active'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
        // Mark messages as read
        await apiClient.post(`/chat/conversations/${conversationId}/mark-read`);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to mock data
      setMessages([
        {
          id: '1',
          content: 'Hallo! Ich interessiere mich für die Immobilie.',
          sender_type: 'client',
          sender_name: selectedConversation?.participant_name || 'Client',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          is_read: true
        },
        {
          id: '2',
          content: 'Gerne! Wann hätten Sie Zeit für eine Besichtigung?',
          sender_type: 'user',
          sender_name: 'Sie',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          is_read: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await apiClient.post(`/chat/conversations/${selectedConversation.id}/messages`, {
        content: newMessage.trim()
      });
      
      if (response.data.success) {
        const newMsg: Message = {
          id: response.data.message.id,
          content: newMessage.trim(),
          sender_type: 'user',
          sender_name: 'Sie',
          created_at: new Date().toISOString(),
          is_read: true
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        // Refresh conversations to update last message
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fehler beim Senden der Nachricht');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.property_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Gerade eben';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffHours < 48) return 'Gestern';
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Nachrichten</h1>
          <p className="text-gray-600 dark:text-gray-400">Kommunizieren Sie direkt mit Interessenten und Kunden</p>
        </div>
      </div>
      
      <div className="flex h-screen">
        {/* Konversationsliste */}
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder="Nachrichten durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
          
          <div className="overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {conversation.participant_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.participant_name}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(conversation.last_message_time)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {conversation.property_title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {conversation.last_message}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className="flex-shrink-0 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">{conversation.unread_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {!loading && filteredConversations.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="ri-message-3-line text-4xl mb-4"></i>
                <p>Keine Nachrichten gefunden</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat-Bereich */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat-Header */}
              <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {selectedConversation.participant_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedConversation.participant_name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedConversation.property_title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nachrichten */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_type === 'user'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_type === 'user' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Nachricht schreiben */}
              <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Nachricht schreiben..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="ri-send-plane-line"></i>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <i className="ri-message-3-line text-6xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Wählen Sie eine Unterhaltung
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Wählen Sie eine Unterhaltung aus der Liste, um Nachrichten zu lesen und zu antworten.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
