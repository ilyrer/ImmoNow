import React, { useState, useEffect } from 'react';
import SidebarChat from '../Chat/SidebarChat';
import GlobalHeader from '../common/GlobalHeader';
import GlobalSidebar from '../common/GlobalSidebar';
import ChatbotFAB from '../common/ChatbotFAB.tsx';
import { PaymentModal } from '../billing/PaymentModal';
import { useTrialStatus } from '../../hooks/useTrialStatus';

const Layout = ({ children, user, onLogout }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Trial Status Check
  const { trialStatus } = useTrialStatus();

  // Show Payment Modal wenn Trial abgelaufen
  useEffect(() => {
    if (trialStatus?.show_payment_modal) {
      setShowPaymentModal(true);
    }
  }, [trialStatus]);



  return (
    <div className="min-h-screen relative">
      {/* Apple Glassmorphism Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-dark-500 dark:via-dark-400 dark:to-dark-300" />
      <div className="fixed inset-0 backdrop-blur-4xl" />

      <div className="relative z-10 flex min-h-screen">
        {/* Global Glasmorphism Sidebar */}
        <GlobalSidebar user={user} onLogout={onLogout} onCollapsedChange={setSidebarCollapsed} />

        {/* Hauptbereich - Dynamic margin based on sidebar state */}
        <main className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-80'}`}>
          {/* Global Header */}
          <GlobalHeader />

          {/* Inhalt */}
          <div className="p-6">
            {children}
          </div>
        </main>

        {/* Sidebar Chat */}
        <SidebarChat open={chatOpen} onClose={() => setChatOpen(false)} />

        {/* KI-Assistent - Premium Chatbot */}
        <ChatbotFAB user={user} />

        {/* Payment Modal */}
        {showPaymentModal && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={trialStatus?.is_expired ? undefined : () => setShowPaymentModal(false)}
            isTrialExpired={trialStatus?.is_expired}
            daysRemaining={trialStatus?.days_remaining}
          />
        )}
      </div>
    </div>
  );
};

export default Layout; 