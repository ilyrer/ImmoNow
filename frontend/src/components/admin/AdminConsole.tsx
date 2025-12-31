import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  DollarSign,
  FileText,
  Activity,
  Building2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeesTab from './tabs/EmployeesTab';
import RolesTab from './tabs/RolesTab';
import PayrollTab from './tabs/PayrollTab';
import DocumentsTab from './tabs/DocumentsTab';
import AuditTab from './tabs/AuditTab';
import { OrganizationTab } from './tabs/OrganizationTab';

type AdminTab = 'employees' | 'roles' | 'payroll' | 'documents' | 'audit' | 'organization';

interface TabConfig {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'employees',
    label: 'Mitarbeitende',
    icon: Users,
    description: 'Mitarbeiter verwalten',
  },
  {
    id: 'roles',
    label: 'Rollen & Rechte',
    icon: Shield,
    description: 'Berechtigungen konfigurieren',
  },
  {
    id: 'payroll',
    label: 'Lohn & Abrechnung',
    icon: DollarSign,
    description: 'Gehaltsabrechnung',
  },
  {
    id: 'documents',
    label: 'Dokumente',
    icon: FileText,
    description: 'Verträge & Nachweise',
  },
  {
    id: 'audit',
    label: 'Aktivitäten',
    icon: Activity,
    description: 'Audit-Protokolle',
  },
  {
    id: 'organization',
    label: 'Organisation',
    icon: Building2,
    description: 'Firmeneinstellungen',
  },
];

const AdminConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('employees');

  // Stelle sicher, dass Dark Mode beim Laden der Seite beibehalten wird
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        const theme = settings.theme || 'system';
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (e) {
        console.error('Error loading theme settings:', e);
      }
    }
    // Falls keine Settings vorhanden sind, aber darkMode im localStorage
    else if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'employees':
        return <EmployeesTab />;
      case 'roles':
        return <RolesTab />;
      case 'payroll':
        return <PayrollTab />;
      case 'documents':
        return <DocumentsTab />;
      case 'audit':
        return <AuditTab />;
      case 'organization':
        return <OrganizationTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Admin-Konsole
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Zentrale Verwaltung für Geschäftsführung
        </p>
      </div>

      {/* Tab Navigation */}
      <Card className="p-2 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  p-4 rounded-2xl transition-all duration-200
                  flex flex-col items-center gap-2
                  ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-lg scale-105'
                      : 'hover:bg-gray-500/10 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <Icon className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold text-sm">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="animate-fadeIn">{renderTabContent()}</div>
    </div>
  );
};

export default AdminConsole;
