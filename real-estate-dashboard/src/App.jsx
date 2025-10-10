import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import Layout from './components/Layout/Layout';
import Dashboard from './components/dashboard/Dashboard.tsx';
import RoleBasedDashboard from './components/dashboard/RoleBasedDashboard.tsx';
import TeamStatusBoard from './components/dashboard/TeamStatusBoard';
import ProjectStatusOverview from './components/dashboard/TeamStatusComponents/ProjectStatusOverview';
import TasksBoard from './components/dashboard/Kanban/TasksBoard';
import Properties from './components/properties/Properties.tsx';
import PropertyCreateWizard from './components/properties/PropertyCreateWizard.tsx';
import PropertyDetail from './components/properties/PropertyDetail.tsx';
import { ContactsList, ContactDetail } from './components/contacts';
import ProfessionalFinancingCalculator from './components/finance/ProfessionalFinancingCalculator';
import LoginPage from './components/Auth/LoginPage';
import SubscriptionManager from './components/Auth/SubscriptionManager';
import ResetPassword from './components/Auth/ResetPassword';
import SubscriptionSuccess from './components/billing/SubscriptionSuccess';
import ModernDocumentsPage from './pages/DocumentsPage.tsx';
import { RemovedFeatureRedirect } from './components/common/RemovedFeatureRedirect.tsx';
import KanbanPage from './pages/KanbanPage.tsx';
import InvestorDashboard from './pages/InvestorDashboard.tsx';
import CIMOverview from './components/CIM/CIMOverview';
import CIMSales from './components/CIM/CIMSales';
import CIMGeographical from './components/CIM/CIMGeographical';
import CIMKPI from './components/CIM/CIMKPI';
import SettingsPage from './pages/SettingsPage.tsx';
import AvmPage from './pages/AvmPage.tsx';
import MatchingPage from './pages/MatchingPage.tsx';
import SocialHubIndex from './components/SocialHub';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import apiService from './services/api.service';
// TODO: Remove apiService import - not needed anymore
import CommunicationsHub from './pages/communications/CommunicationsHub.tsx';
import ChatView from './pages/communications/ChatView.tsx';
import AdminConsole from './components/admin/AdminConsole.tsx';
import CIMPage from './pages/CIMPage.tsx';
import CalendarPage from './pages/CalendarPage.tsx';
import AuthPage from './pages/AuthPage.tsx';

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryProvider>
  );
}

function AppContent() {
  const { token, tenantId, setAuth, clearAuth, isAuthenticated } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Prüfe beim App-Start UND wenn sich der Token ändert
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 App: Auth check triggered', { 
        hasToken: !!token, 
        hasUser: !!user,
        isAuthenticated,
        loading
      });
      
      // Wenn wir bereits einen User haben, nichts tun
      if (user) {
        console.log('✅ App: User already loaded, skipping check');
        setLoading(false);
        return;
      }
      
      // WICHTIG: Loading state aktiv halten während Token-Refresh!
      setLoading(true);
      
      // Wenn kein Access Token, prüfe ob wir einen Refresh Token haben
      if (!token || !isAuthenticated) {
        console.log('⚠️ App: No access token found');
        
        // Versuche Token mit Refresh Token zu erneuern
        const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
        if (refreshToken && refreshToken !== 'mock-refresh') {
          console.log('🔄 App: Refresh token found, attempting to refresh access token...');
          try {
            const refreshResult = await apiService.refreshAccessToken();
            console.log('✅ App: Token refreshed successfully');
            
            // Update AuthContext with new token
            if (refreshResult.token && refreshResult.tenant?.id) {
              setAuth(refreshResult.token, refreshResult.tenant.id);
            }
            
            // WICHTIG: Loading bleibt TRUE, damit Dashboard noch nicht rendert
            // Der useEffect wird mit neuem Token erneut laufen und dann User laden
            console.log('⏳ App: Waiting for re-run with new token...');
            return;
          } catch (error) {
            console.error('❌ App: Token refresh failed:', error);
            // Refresh failed, clear everything and show login
            await apiService.logout();
            clearAuth();
            setUser(null);
            setLoading(false);
            return;
          }
        }
        
        console.log('ℹ️ App: No valid tokens, user needs to login');
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Wir haben einen Token aber noch keinen User -> Lade User vom Backend
      console.log('✅ App: Token found, loading user from backend...');
      try {
        // Teste zuerst die Backend-Verbindung
        await apiService.testBackendConnection();
        
        const currentUser = await apiService.getCurrentUser();
        console.log('✅ App: User loaded successfully:', currentUser.email);
        setUser(currentUser);
        setLoading(false); // NUR HIER wird loading false, wenn alles fertig ist!
      } catch (error) {
        console.error('❌ App: Failed to load user, token might be expired:', error);
        
        // Versuche Token Refresh als letzte Chance
        const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
        if (refreshToken && refreshToken !== 'mock-refresh') {
          console.log('🔄 App: Trying token refresh as fallback...');
          try {
            const refreshResult = await apiService.refreshAccessToken();
            console.log('✅ App: Token refreshed on fallback');
            
            // Update AuthContext with new token
            if (refreshResult.token && refreshResult.tenant?.id) {
              setAuth(refreshResult.token, refreshResult.tenant.id);
            }
            
            // Effect will run again with new token - loading stays true
            return;
          } catch (refreshError) {
            console.error('❌ App: Token refresh also failed:', refreshError);
          }
        }
        
        // Token ist ungültig und Refresh fehlgeschlagen, entferne alles
        await apiService.logout();
        clearAuth();
        setUser(null);
        setLoading(false);
        console.log('🗑️ App: Invalid/expired token removed');
      }
    };

    // Debug Token-Informationen
    apiService.debugTokens();
    checkAuth();
  }, [token, isAuthenticated]); // ✅ Run when token changes!

  // Login-Handler (für Legacy-Support, falls noch verwendet)
  const handleLogin = async (payload) => {
    try {
      // If payload looks like a user, just adopt it (used after registration)
      if (payload && !payload.password && payload.email && payload.id) {
        console.log('✅ App: Setting user from payload');
        setUser(payload);
        setLoading(false);
        setTimeout(() => apiService.debugTokens(), 100);
        return;
      }
      
      console.log('🔐 App: Starting login process...');
      setLoading(true);
      
      const response = await apiService.login(payload);
      console.log('✅ App: Login response received:', response.user.email);
      
      // Setze Auth-Token und Tenant-ID im API Client ZUERST
      if (response.token && response.user.tenant_id) {
        console.log('✅ App: Setting auth token and tenant ID');
        setAuth(response.token, response.user.tenant_id);
      }
      
      // Dann setze User - WICHTIG: Direkt nach setAuth
      console.log('✅ App: Setting user state');
      setUser(response.user);
      setLoading(false);
      
      // Debug nach Login
      setTimeout(() => {
        apiService.debugTokens();
        console.log('✅ App: Login complete, user should stay logged in');
      }, 100);
    } catch (error) {
      console.error('❌ App: Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  // Logout-Handler
  const handleLogout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      clearAuth();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Plan-Änderungs-Handler
  const handlePlanChange = (newPlan, billingCycle) => {
    const updatedUser = {
      ...user,
      plan: newPlan,
      billing_cycle: billingCycle,
      planChangeDate: new Date().toISOString()
    };
    setUser(updatedUser);
    
    // Hier würde normalerweise ein API-Call zur Zahlungsabwicklung stattfinden
    console.log(`Plan geändert zu: ${newPlan} (${billingCycle})`);
  };

  // Loading-Screen
  if (loading) {
    console.log('🔄 App: Loading state active');
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Anwendung...</p>
        </div>
      </div>
    );
  }

  // Wenn nicht eingeloggt, zeige Login-/öffentliche Routen
  if (!user) {
    console.log('🔒 App: No user, showing login routes');
    return (
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/subscription/success" element={<SubscriptionSuccess />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Hauptanwendung für eingeloggte Benutzer
  console.log('✅ App: User authenticated, showing main app for:', user.email);
  return (
    <div className="App">
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<RoleBasedDashboard />} />
          <Route path="/dashboard" element={<RoleBasedDashboard />} />
          <Route path="/dashboard-classic" element={<Dashboard user={user} />} />
          <Route path="/team-status" element={<TeamStatusBoard user={user} />} />
          <Route path="/projektstatus" element={<ProjectStatusOverview timeRange="week" teamFilter="sales" user={user} />} />
          <Route path="/aufgaben" element={<TasksBoard user={user} />} />
          <Route path="/kanban" element={<KanbanPage />} />
          {/* ENTFERNTE ROUTEN: Kalender, Termine, Nachrichten, Video-Meetings, Admin */}
          <Route path="/termine" element={<RemovedFeatureRedirect featureName="Termine" />} />
          <Route path="/calendar" element={<RemovedFeatureRedirect featureName="Kalender" />} />
          <Route path="/messages" element={<RemovedFeatureRedirect featureName="Nachrichten" />} />
          <Route path="/meetings" element={<RemovedFeatureRedirect featureName="Video-Meetings" />} />
          
          {/* NEW: Admin Console */}
          <Route path="/admin" element={<AdminConsole />} />
          
          <Route path="/immobilien" element={<Properties user={user} />} />
          <Route path="/immobilien/neu" element={<PropertyCreateWizard />} />
          <Route path="/immobilien/:id" element={<PropertyDetail user={user} />} />
          {/* Backward compatibility */}
          <Route path="/properties" element={<Properties user={user} />} />
          <Route path="/properties/add" element={<PropertyCreateWizard />} />
          <Route path="/properties/:id" element={<PropertyDetail user={user} />} />
          <Route path="/kontakte" element={<ContactsList user={user} />} />
          <Route path="/kontakte/:id" element={<ContactDetail user={user} />} />
          <Route path="/cim" element={<CIMOverview />} />
          <Route path="/cim/sales" element={<CIMSales />} />
          <Route path="/cim/geographical" element={<CIMGeographical />} />
          <Route path="/cim/kpi" element={<CIMKPI />} />
          <Route path="/investoren" element={<InvestorDashboard />} />
          <Route path="/avm" element={<AvmPage />} />
          <Route path="/matching" element={<MatchingPage />} />
          <Route path="/social-hub" element={<SocialHubIndex />} />
          <Route path="/communications" element={<CommunicationsHub />} />
          <Route path="/communications/chat" element={<ChatView />} />
          <Route path="/finance" element={<ProfessionalFinancingCalculator user={user} />} />
          <Route path="/documents" element={<ModernDocumentsPage />} />
          <Route path="/dokumente" element={<ModernDocumentsPage />} />
          <Route path="/documents/*" element={<ModernDocumentsPage />} />
          <Route path="/dokumente/*" element={<ModernDocumentsPage />} />
          <Route path="/cim" element={<CIMPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/subscription" 
            element={
              <SubscriptionManager 
                currentUser={user} 
                onPlanChange={handlePlanChange} 
              />
            } 
          />
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          {/* Fallback für unbekannte Routen */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </div>
  );
}

export default App; 