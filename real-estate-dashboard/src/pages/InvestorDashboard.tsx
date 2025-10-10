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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
      <div className="fixed inset-0 backdrop-blur-3xl" />

      <div className="relative z-10 p-6 max-w-[1600px] mx-auto">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-2 border border-white/20 dark:border-gray-700/50 shadow-lg mb-6"
        >
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className={`${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {tab.label}
                    </div>
                    {isActive && (
                      <div className="text-xs opacity-90 mt-0.5">
                        {tab.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Area with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InvestorDashboard;
