import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import Layout from './components/Layout/Layout';
import DashboardNew from './components/dashboard/DashboardNew';
import RoleBasedDashboard from './components/dashboard/RoleBasedDashboard.tsx';
import TeamStatusBoard from './components/dashboard/TeamStatusBoard';
import ProjectStatusOverview from './components/dashboard/TeamStatusComponents/ProjectStatusOverview';
import TasksBoard from './components/dashboard/Kanban/TasksBoard';
import PropertiesPage from './components/properties/PropertiesPage.tsx';
import PropertyCreateWizard from './components/properties/PropertyCreateWizard.tsx';
import PropertyDetail from './components/properties/PropertyDetail.tsx';
import { ContactsList, ContactDetail } from './components/contacts';
import ProfessionalFinancingCalculator from './components/finance/ProfessionalFinancingCalculator';
import LoginPage from './components/Auth/LoginPage';
import SubscriptionManager from './components/Auth/SubscriptionManager';
import ResetPassword from './components/Auth/ResetPassword';
import SubscriptionSuccess from './components/billing/SubscriptionSuccess';
import { BillingPage } from './pages/BillingPage';
import PlanSelectionPage from './components/Auth/PlanSelectionPage';
import RegistrationWithPayment from './components/Auth/RegistrationWithPayment';
import RegistrationComplete from './pages/RegistrationComplete';
import ModernDocumentsPage from './pages/DocumentsPage.tsx';
import { RemovedFeatureRedirect } from './components/common/RemovedFeatureRedirect.tsx';
import CommunicationsHub from './pages/communications/CommunicationsHub';
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
import ProfilePage from './components/profile/ProfilePage.tsx';
import AdminConsole from './components/admin/AdminConsole.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { useCurrentUser, useCurrentTenant, useLogin, useLogout } from './api/hooks';

function AppContent() {
  const { token, tenantId, setAuth, clearAuth, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  // Nur User-Daten laden wenn authentifiziert
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser({
    enabled: !!token && isAuthenticated
  });
  const { data: tenantInfo, isLoading: tenantLoading, error: tenantError } = useCurrentTenant({
    enabled: !!token && isAuthenticated
  });
  
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  // EINFACHER Authentication check - KEINE automatischen Löschungen
  useEffect(() => {
    console.log('🔍 App: Simple auth check - token:', !!token, 'isAuthenticated:', isAuthenticated, 'user:', !!user);
    
    // Wenn wir bereits einen User haben, brauchen wir nichts zu tun
    if (user) {
      console.log('✅ App: User already loaded');
      setLoading(false);
      return;
    }
    
    // Wenn kein Token, zeige Login
    if (!token || !isAuthenticated) {
      console.log('⚠️ App: No token, showing login');
      setLoading(false);
      return;
    }
    
    // Wir haben einen Token - lass React Query die User-Daten laden
    console.log('✅ App: Token found, React Query will load user data');
    setLoading(false);
  }, [token, isAuthenticated, user]);

  // Handle user/tenant data loading
  useEffect(() => {
    if (user && !loading) {
      console.log('✅ App: User data loaded:', user.email);
      setLoading(false);
    }
  }, [user, loading]);

  // Handle errors - ABER NICHT automatisch löschen
  useEffect(() => {
    if (userError || tenantError) {
      console.error('❌ App: Error loading user data:', userError || tenantError);
      // NICHT automatisch löschen - nur Logging
      setLoading(false);
    }
  }, [userError, tenantError]);

  // Login-Handler
  const handleLogin = async (payload) => {
    try {
      console.log('🔐 App: Starting login process...');
      setLoading(true);
      
      // Use React Query mutation
      const response = await loginMutation.mutateAsync(payload);
      console.log('✅ App: Login response received:', response);
      
      // Speichere Tokens im AuthContext
      if (response.access_token && response.tenant?.id) {
        console.log('✅ App: Setting auth tokens in AuthContext');
        console.log('🔍 Token preview:', response.access_token.substring(0, 20) + '...');
        console.log('🔍 Tenant ID:', response.tenant.id);
        
        setAuth(response.access_token, response.tenant.id);
        
        // Speichere Tenant-Informationen für Sidebar
        if (response.tenant) {
          localStorage.setItem('tenant_info', JSON.stringify({
            id: response.tenant.id,
            name: response.tenant.name,
            slug: response.tenant.slug,
            plan: response.tenant.plan,
            is_active: response.tenant.is_active,
            logo_url: response.tenant.logo_url
          }));
        }
        
        // Speichere auch refresh token
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
        
        // Debug localStorage nach Login
        setTimeout(() => {
          console.log('🔍 localStorage after login:', {
            auth_token: localStorage.getItem('auth_token'),
            tenant_id: localStorage.getItem('tenant_id'),
            refresh_token: localStorage.getItem('refresh_token')
          });
        }, 100);
      } else {
        console.error('❌ App: No access_token or tenant in response:', response);
      }
      
      console.log('✅ App: Login complete');
      setLoading(false);
      
    } catch (error) {
      console.error('❌ App: Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  // Logout-Handler - NUR manueller Aufruf
  const handleLogout = async () => {
    try {
      console.log('🚪 App: Manual logout initiated');
      await logoutMutation.mutateAsync();
      clearAuth();
      console.log('✅ App: Logout complete');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Plan-Änderungs-Handler
  const handlePlanChange = (newPlan, billingCycle) => {
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

  // Login-Screen oder Registration Routes
  if (!isAuthenticated || !token) {
    console.log('🔐 App: Showing login/registration screen');
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<PlanSelectionPage />} />
          <Route path="/register/details" element={<RegistrationWithPayment />} />
          <Route path="/registration/complete" element={<RegistrationComplete />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  // Main App
  console.log('🏠 App: Rendering main application');
  return (
    <div className="App">
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<RoleBasedDashboard />} />
          <Route path="/dashboard" element={<RoleBasedDashboard />} />
          <Route path="/dashboard-classic" element={<DashboardNew user={user} />} />
          <Route path="/team-status" element={<TeamStatusBoard />} />
          <Route path="/project-status" element={<ProjectStatusOverview />} />
          <Route path="/tasks" element={<TasksBoard />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/properties" element={<PropertiesPage user={user} />} />
          <Route path="/properties/create" element={<PropertyCreateWizard />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/contacts" element={<ContactsList user={user} />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/documents" element={<ModernDocumentsPage />} />
          <Route path="/financing" element={<ProfessionalFinancingCalculator />} />
          <Route path="/subscription" element={<BillingPage />} />
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/investor" element={<InvestorDashboard />} />
          <Route path="/cim" element={<CIMOverview />} />
          <Route path="/cim/sales" element={<CIMSales />} />
          <Route path="/cim/geographical" element={<CIMGeographical />} />
          <Route path="/cim/kpi" element={<CIMKPI />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminConsole />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/avm" element={<AvmPage />} />
          <Route path="/matching" element={<MatchingPage />} />
          <Route path="/social-hub" element={<SocialHubIndex />} />
          <Route path="/reports" element={<RemovedFeatureRedirect />} />
          <Route path="/communications" element={<CommunicationsHub />} />
          <Route path="/analytics" element={<RemovedFeatureRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </div>
  );
}

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <UserProvider>
          <Router>
            <AppContent />
          </Router>
        </UserProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;