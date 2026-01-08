/**
 * Investor Dashboard - Main Page
 * Professional investor mode with portfolio, reports, analytics, simulations, and marketplace
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  FileText,
  BarChart3,
  Calculator,
  ShoppingBag
} from 'lucide-react';
import PortfolioView from '../components/investor/PortfolioView';
import ReportsView from '../components/investor/ReportsView';
import AnalyticsView from '../components/investor/AnalyticsView';
import SimulationsView from '../components/investor/SimulationsView';
import MarketplaceView from '../components/investor/MarketplaceView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tab = 'portfolio' | 'reports' | 'analytics' | 'simulations' | 'marketplace';

const InvestorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('portfolio');

  const tabs = [
    {
      id: 'portfolio' as Tab,
      label: 'Portfolio',
      icon: Briefcase,
      description: 'Übersicht Ihrer Immobilien-Assets'
    },
    {
      id: 'reports' as Tab,
      label: 'Berichte',
      icon: FileText,
      description: 'Automatische Renditeberichte'
    },
    {
      id: 'analytics' as Tab,
      label: 'Analysen',
      icon: BarChart3,
      description: 'Leerstand & Kostenanalyse'
    },
    {
      id: 'simulations' as Tab,
      label: 'Simulationen',
      icon: Calculator,
      description: 'ROI-Kalkulationen'
    },
    {
      id: 'marketplace' as Tab,
      label: 'Marktplatz',
      icon: ShoppingBag,
      description: 'Immobilienpakete'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return <PortfolioView />;
      case 'reports':
        return <ReportsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'simulations':
        return <SimulationsView />;
      case 'marketplace':
        return <MarketplaceView />;
      default:
        return <PortfolioView />;
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 overflow-hidden -m-6">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
      <div className="fixed inset-0 backdrop-blur-3xl" />

      <div className="relative z-10 h-full p-6 max-w-[1600px] mx-auto overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Investoren-Modus
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Professionelles Portfolio-Management für Ihre Immobilieninvestments
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <Card className="mb-6">
            <CardContent className="p-2">
              <TabsList className="flex gap-2 overflow-x-auto overflow-y-hidden">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-3 px-6 py-4 whitespace-nowrap"
                    >
                      <Icon className="w-5 h-5" />
                      <div className="text-left">
                        <div>{tab.label}</div>
                        <div className="text-xs opacity-90 mt-0.5">
                          {tab.description}
                        </div>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </CardContent>
          </Card>

          {/* Content Area with Animation */}
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default InvestorDashboard;
