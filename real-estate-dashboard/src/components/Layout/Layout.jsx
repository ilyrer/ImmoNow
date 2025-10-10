import React, { useState } from 'react';
import { GlobalAIChatbot } from '../AI';
import SidebarChat from '../Chat/SidebarChat';
import GlobalHeader from '../common/GlobalHeader';
import GlobalSidebar from '../common/GlobalSidebar';
import ChatbotFAB from '../common/ChatbotFAB.tsx';

const Layout = ({ children, user, onLogout }) => {
  const [chatOpen, setChatOpen] = useState(false);

  // Callback-Funktionen für den KI-Chatbot
  const handleCreateTask = (taskData) => {
    console.log('Neue Aufgabe erstellt:', taskData);
    // Hier würde die Aufgabe zur Aufgabenliste hinzugefügt werden
    // In einer echten App würde dies über einen globalen State oder API erfolgen
  };

  const handleCreateProperty = (propertyData) => {
    console.log('Neue Immobilie erstellt:', propertyData);
    // Hier würde die Immobilie zur Immobilienliste hinzugefügt werden
  };

  const handleCreateMeeting = (meetingData) => {
    console.log('Neue Besprechung erstellt:', meetingData);
    // Hier würde die Besprechung zum Kalender hinzugefügt werden
  };



  return (
    <div className="min-h-screen relative">
      {/* Apple Glassmorphism Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-dark-500 dark:via-dark-400 dark:to-dark-300" />
      <div className="fixed inset-0 backdrop-blur-4xl" />
      
      <div className="relative z-10 flex min-h-screen">
        {/* Global Glasmorphism Sidebar */}
        <GlobalSidebar user={user} onLogout={onLogout} />

        {/* Hauptbereich */}
        <main className="flex-1 ml-80 transition-all duration-300 ease-in-out">
          {/* Global Header */}
          <GlobalHeader />

          {/* Inhalt */}
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Globaler KI-Chatbot */}
        <GlobalAIChatbot 
          user={user}
          onCreateTask={handleCreateTask}
          onCreateProperty={handleCreateProperty}
          onCreateMeeting={handleCreateMeeting}
        />

        {/* Sidebar Chat */}
        <SidebarChat open={chatOpen} onClose={() => setChatOpen(false)} />

        {/* New Enhanced Chatbot FAB */}
        <ChatbotFAB />
      </div>
    </div>
  );
};

export default Layout; 