import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatbotPanel from '../chatbot/ChatbotPanel';

const ChatbotFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-6 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 z-40"
          title="Assistent öffnen"
        >
          <MessageSquare className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chatbot Panel */}
      <ChatbotPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatbotFAB;
