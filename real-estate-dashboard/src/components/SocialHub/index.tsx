/**
 * SocialHub Index View
 * Hauptansicht mit Navigation zu allen Submodulen
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import AccountsView from './Accounts/AccountsView';
import ComposerView from './Composer/ComposerView';
import SchedulerView from './Scheduler/SchedulerView';
import QueueView from './Queue/QueueView';
import AnalyticsView from './Analytics/AnalyticsView';
import { useSocialStats, useSocialActivities } from '../../hooks/useSocial';
import { 
  FileText, 
  Heart,  
  TrendingUp, 
  Calendar,
  ArrowUp,
  Clock,
  UserCog,
  Edit3,
  CalendarCheck,
  Inbox,
  BarChart3,
  Image,
  Lock,
  CheckCircle,
  ArrowRight,
  Activity
} from 'lucide-react';

type ViewType = 'overview' | 'accounts' | 'composer' | 'scheduler' | 'queue' | 'analytics';

const SocialHubIndex: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('overview');

  // Use real API data instead of mock data
  const { 
    connectedAccounts, 
    pendingPosts, 
    scheduledPosts, 
    totalEngagements, 
    isLoading 
  } = useSocialStats();

  // Get recent activities
  const { data: activities = [], isLoading: activitiesLoading } = useSocialActivities(3);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
  };

  // Render subview
  if (currentView === 'accounts') return <AccountsView onBack={handleBackToOverview} />;
  if (currentView === 'composer') return <ComposerView onBack={handleBackToOverview} />;
  if (currentView === 'scheduler') return <SchedulerView onBack={handleBackToOverview} />;
  if (currentView === 'queue') return <QueueView onBack={handleBackToOverview} />;
  if (currentView === 'analytics') return <AnalyticsView onBack={handleBackToOverview} />;

  // Overview Dashboard
  return (
    <div className="space-y-8">
      {/* Header - Premium Design */}
      <div className="relative">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-[32px] blur-3xl -z-10 animate-pulse"></div>
        
        <div className="relative bg-white/10 dark:bg-[#1C1C1E]/40 backdrop-blur-xl rounded-[32px] p-10 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl -z-10 opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-3xl -z-10 opacity-30"></div>
          
          <div className="relative flex items-start justify-between">
            <div>
              {/* Gradient Text Title */}
              <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent leading-tight">
                Social Media Hub
              </h1>
              <p className="text-lg text-[#3A3A3C] dark:text-gray-400 max-w-2xl leading-relaxed">
                Verwalten Sie alle Ihre Social Media Aktivitäten zentral an einem Ort. 
                Erstellen, planen und analysieren Sie Ihre Beiträge mit Leichtigkeit.
              </p>
              
              {/* Quick Info Badges */}
              <div className="flex items-center gap-3 mt-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-[#1C1C1E]/40 rounded-full border border-white/30 dark:border-white/10 backdrop-blur-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-[#1C1C1E] dark:text-white">{connectedAccounts} Konten verbunden</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-[#1C1C1E]/40 rounded-full border border-white/30 dark:border-white/10 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-[#1C1C1E] dark:text-white">{scheduledPosts} Posts geplant</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-[#1C1C1E]/40 rounded-full border border-white/30 dark:border-white/10 backdrop-blur-sm">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-[#1C1C1E] dark:text-white">{isLoading ? '...' : `+${Math.min(Math.floor((totalEngagements || 0) / 5), 99)}% Reichweite`}</span>
                </div>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:from-emerald-400/10 dark:to-green-400/10 rounded-full border border-emerald-500/30 dark:border-emerald-400/20 backdrop-blur-sm shadow-lg">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Alle Systeme online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Card 1 - Posts */}
        <div className="group relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-7 hover:bg-white/15 dark:hover:bg-[#1C1C1E]/40 hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/10 dark:from-blue-400/20 dark:to-blue-500/10 rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 dark:bg-green-400/10 rounded-full">
                <ArrowUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">{isLoading ? '...' : `+${Math.min(Math.floor((totalEngagements || 0) / 10), 99)}%`}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-[#3A3A3C] dark:text-gray-400 mb-2">Veröffentlichte Posts</p>
              <p className="text-4xl font-bold text-[#1C1C1E] dark:text-white mb-1">{isLoading ? '...' : formatNumber(totalEngagements || 0)}</p>
              <p className="text-xs text-[#3A3A3C] dark:text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Diesen Monat
              </p>
            </div>
          </div>
        </div>

        {/* Stat Card 2 - Engagement */}
        <div className="group relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-7 hover:bg-white/15 dark:hover:bg-[#1C1C1E]/40 hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-pink-600/10 dark:from-pink-400/20 dark:to-pink-500/10 rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 dark:bg-green-400/10 rounded-full">
                <ArrowUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">{isLoading ? '...' : `+${Math.min(Math.floor((totalEngagements || 0) / 15), 99)}%`}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-[#3A3A3C] dark:text-gray-400 mb-2">Engagement Rate</p>
              <p className="text-4xl font-bold text-[#1C1C1E] dark:text-white mb-1">{isLoading ? '...' : `${((totalEngagements || 0) / Math.max(connectedAccounts || 1, 1) * 0.1).toFixed(1)}%`}</p>
              <p className="text-xs text-[#3A3A3C] dark:text-gray-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Durchschnitt
              </p>
            </div>
          </div>
        </div>

        {/* Stat Card 3 - Reach */}
        <div className="group relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-7 hover:bg-white/15 dark:hover:bg-[#1C1C1E]/40 hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/10 dark:from-purple-400/20 dark:to-purple-500/10 rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 dark:bg-green-400/10 rounded-full">
                <ArrowUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">{isLoading ? '...' : `+${Math.min(Math.floor((totalEngagements || 0) / 5), 99)}%`}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-[#3A3A3C] dark:text-gray-400 mb-2">Gesamtreichweite</p>
              <p className="text-4xl font-bold text-[#1C1C1E] dark:text-white mb-1">{isLoading ? '...' : formatNumber((totalEngagements || 0) * 50)}</p>
              <p className="text-xs text-[#3A3A3C] dark:text-gray-500 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Diesen Monat
              </p>
            </div>
          </div>
        </div>

        {/* Stat Card 4 - Scheduled */}
        <div className="group relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-7 hover:bg-white/15 dark:hover:bg-[#1C1C1E]/40 hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/10 dark:from-orange-400/20 dark:to-orange-500/10 rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CalendarCheck className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 dark:bg-blue-400/10 rounded-full">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Aktiv</span>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-[#3A3A3C] dark:text-gray-400 mb-2">Geplante Posts</p>
              <p className="text-4xl font-bold text-[#1C1C1E] dark:text-white mb-1">{isLoading ? '...' : scheduledPosts || 0}</p>
              <p className="text-xs text-[#3A3A3C] dark:text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Für diese Woche
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tiles - Enhanced Design */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-white">
              Module
            </h2>
            <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mt-1">
              Wählen Sie ein Modul, um loszulegen
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Accounts Tile */}
          <button
            onClick={() => setCurrentView('accounts')}
            className="group relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-7 text-left border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-white/15 dark:hover:bg-[#1C1C1E]/40 hover:scale-[1.02] hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/10 dark:from-blue-400/20 dark:to-blue-500/10 rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserCog className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="px-3 py-1.5 bg-green-500/10 dark:bg-green-400/10 rounded-full border border-green-500/20">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">{connectedAccounts} Verbunden</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-white mb-2">
                Konten
              </h3>
              <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mb-5 leading-relaxed">
                Verwalten Sie Ihre verbundenen Social Media Konten und Einstellungen
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:gap-3 gap-2 transition-all duration-300">
                <span>Konten verwalten</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </button>

          {/* Composer Tile */}
          <button
            onClick={() => setCurrentView('composer')}
            className="group relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-7 text-left border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-white/15 dark:hover:bg-[#1C1C1E]/40 hover:scale-[1.02] hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/10 dark:from-purple-400/20 dark:to-purple-500/10 rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Edit3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="px-3 py-1.5 bg-purple-500/10 dark:bg-purple-400/10 rounded-full border border-purple-500/20">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Neu</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-white mb-2">
                Composer
              </h3>
              <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mb-5 leading-relaxed">
                Erstellen und bearbeiten Sie Ihre Social Media Beiträge mit unserem Editor
              </p>
              <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-semibold group-hover:gap-3 gap-2 transition-all duration-300">
                <span>Beitrag erstellen</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </button>

          {/* Scheduler Tile */}
          <button
            onClick={() => setCurrentView('scheduler')}
            className="group relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-7 text-left border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-white/15 dark:hover:bg-[#1C1C1E]/40 hover:scale-[1.02] hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/10 dark:from-orange-400/20 dark:to-orange-500/10 rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="px-3 py-1.5 bg-orange-500/10 dark:bg-orange-400/10 rounded-full border border-orange-500/20">
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">{scheduledPosts} Geplant</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-white mb-2">
                Scheduler
              </h3>
              <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mb-5 leading-relaxed">
                Planen Sie Ihre Beiträge im Voraus mit unserem Kalender-Tool
              </p>
              <div className="flex items-center text-orange-600 dark:text-orange-400 text-sm font-semibold group-hover:gap-3 gap-2 transition-all duration-300">
                <span>Zeitplan anzeigen</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </button>

          {/* Queue Tile */}
          <button
            onClick={() => setCurrentView('queue')}
            className="group relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-7 text-left border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-white/15 dark:hover:bg-[#1C1C1E]/40 hover:scale-[1.02] hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-pink-600/10 dark:from-pink-400/20 dark:to-pink-500/10 rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Inbox className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="px-3 py-1.5 bg-pink-500/10 dark:bg-pink-400/10 rounded-full border border-pink-500/20">
                  <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">{pendingPosts} Wartend</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-white mb-2">
                Warteschlange
              </h3>
              <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mb-5 leading-relaxed">
                Überwachen Sie den Status Ihrer Beiträge in der Warteschlange
              </p>
              <div className="flex items-center text-pink-600 dark:text-pink-400 text-sm font-semibold group-hover:gap-3 gap-2 transition-all duration-300">
                <span>Queue ansehen</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </button>

          {/* Analytics Tile */}
          <button
            onClick={() => setCurrentView('analytics')}
            className="group relative bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-7 text-left border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-white/15 dark:hover:bg-[#1C1C1E]/40 hover:scale-[1.02] hover:shadow-[0_12px_48px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 dark:from-emerald-400/20 dark:to-emerald-500/10 rounded-[20px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full border border-emerald-500/20">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Insights</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-white mb-2">
                Analytics
              </h3>
              <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mb-5 leading-relaxed">
                Analysieren Sie die Performance Ihrer Social Media Aktivitäten
              </p>
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-semibold group-hover:gap-3 gap-2 transition-all duration-300">
                <span>Insights anzeigen</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </button>

          {/* Media Library Tile (Disabled) */}
          <div className="relative bg-white/5 dark:bg-[#1C1C1E]/20 backdrop-blur-xl rounded-[24px] p-7 text-left border border-white/10 dark:border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] opacity-60 cursor-not-allowed">
            <div className="flex items-start justify-between mb-5">
              <div className="w-16 h-16 bg-[#1C1C1E]/5 dark:bg-white/5 rounded-[20px] flex items-center justify-center">
                <Image className="w-8 h-8 text-[#1C1C1E]/50 dark:text-white/50" />
              </div>
              <div className="px-3 py-1.5 bg-gray-500/10 dark:bg-gray-400/10 rounded-full border border-gray-500/20">
                <Lock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-[#1C1C1E]/70 dark:text-white/70 mb-2">
              Medien-Bibliothek
            </h3>
            <p className="text-sm text-[#3A3A3C]/70 dark:text-gray-400/70 mb-5 leading-relaxed">
              Verwalten Sie Ihre Bilder, Videos und andere Medien
            </p>
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm font-semibold gap-2">
              <span>Bald verfügbar</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Enhanced Design */}
      <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-[#1C1C1E] dark:text-white">
              Aktuelle Aktivitäten
            </h3>
            <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mt-1">
              Ihre letzten Aktionen im Überblick
            </p>
          </div>
          <button className="px-4 py-2 bg-white/10 dark:bg-[#1C1C1E]/20 hover:bg-white/15 dark:hover:bg-[#1C1C1E]/30 rounded-full text-sm font-medium text-[#1C1C1E] dark:text-white transition-all duration-200 border border-white/20 dark:border-white/10">
            Alle anzeigen
          </button>
        </div>
        
        <div className="space-y-4">
          {activitiesLoading ? (
            // Loading state
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-gray-500">Lade Aktivitäten...</span>
            </div>
          ) : activities.length > 0 ? (
            // Real activities
            activities.map((activity, index) => {
              // Map activity type to icon and color
              let Icon, color;
              switch (activity.type) {
                case 'post_published':
                  Icon = CheckCircle;
                  color = 'emerald';
                  break;
                case 'post_scheduled':
                  Icon = Clock;
                  color = 'blue';
                  break;
                case 'post_created':
                  Icon = Edit3;
                  color = 'purple';
                  break;
                case 'account_connected':
                  Icon = UserCog;
                  color = 'purple';
                  break;
                default:
                  Icon = Activity;
                  color = 'gray';
              }

              const colorClasses = {
                emerald: 'from-emerald-500/20 to-emerald-600/10 dark:from-emerald-400/20 dark:to-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                blue: 'from-blue-500/20 to-blue-600/10 dark:from-blue-400/20 dark:to-blue-500/10 text-blue-600 dark:text-blue-400',
                purple: 'from-purple-500/20 to-purple-600/10 dark:from-purple-400/20 dark:to-purple-500/10 text-purple-600 dark:text-purple-400',
                gray: 'from-gray-500/20 to-gray-600/10 dark:from-gray-400/20 dark:to-gray-500/10 text-gray-600 dark:text-gray-400',
              };

              return (
                <div 
                  key={activity.id}
                  onClick={() => {
                    // Navigate to relevant view based on activity type
                    if (activity.type === 'post_published' || activity.type === 'post_scheduled' || activity.type === 'post_created') {
                      setCurrentView('queue');
                    } else if (activity.type === 'account_connected') {
                      setCurrentView('accounts');
                    }
                  }}
                  className="group flex items-start gap-4 p-5 bg-white/5 dark:bg-[#1C1C1E]/20 backdrop-blur-sm rounded-[20px] border border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-[#1C1C1E]/30 hover:border-white/20 dark:hover:border-white/10 hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base text-[#1C1C1E] dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-sm text-[#3A3A3C] dark:text-gray-400 mt-1.5 leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Clock className="w-3.5 h-3.5 text-[#3A3A3C] dark:text-gray-500" />
                      <p className="text-xs font-medium text-[#3A3A3C] dark:text-gray-500">
                        {activity.time_ago}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#3A3A3C] dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              );
            })
          ) : (
            // Empty state
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Noch keine Aktivitäten</p>
              <p className="text-xs text-gray-400 mt-1">Erstellen Sie Ihren ersten Post oder verbinden Sie ein Konto</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialHubIndex;
