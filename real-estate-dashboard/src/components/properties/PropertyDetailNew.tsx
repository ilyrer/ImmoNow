import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Edit3, Share2, MoreVertical, MapPin, Euro, Home, Calendar, 
  TrendingUp, Eye, MessageSquare, Users, Clock, Tag, Star,
  Building2, Ruler, Bed, Bath, Car, Zap, Flame, Download,
  FileText, Settings, ChevronLeft, ChevronRight,
  ExternalLink, RefreshCw, CheckCircle, XCircle, AlertCircle,
  Play, Pause, Link, Unlink, Shield, Mail, User, BarChart3,
  Activity, Target, Award, Globe, Phone, Mail as MailIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useProperty, usePropertyMetrics, useUpdateProperty } from '../../hooks/useProperties';
import { PropertyResponse } from '../../types/property';
import { propertiesService } from '../../services/properties';

// Import neue Komponenten
import DetailsTab from './DetailsTab';
import ContactsTab from './ContactsTab';
import PortalExportTab from './PortalExportTab';
import PerformanceTab from './PerformanceTab';
import PortalAnalytics from './PortalAnalytics';
import PropertySidebar from './PropertySidebar';
import ImageGallery from './ImageGallery';

const PropertyDetailNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Data fetching
  const { data: property, isLoading: propertyLoading, error: propertyError } = useProperty(id!);
  const { data: metrics, isLoading: metricsLoading } = usePropertyMetrics(id!);
  const updatePropertyMutation = useUpdateProperty();

  const handleUpdateProperty = async (updates: Partial<PropertyResponse>) => {
    console.log('🔍 PropertyDetailNew: handleUpdateProperty called with', updates);
    if (!property) {
      console.log('🔍 PropertyDetailNew: No property, returning');
      return;
    }
    
    try {
      const payload = { id: property.id, payload: updates as any };
      console.log('🔍 PropertyDetailNew: Calling updatePropertyMutation with', payload);
      await updatePropertyMutation.mutateAsync(payload);
      console.log('🔍 PropertyDetailNew: Update successful');
      toast.success('Immobilie erfolgreich aktualisiert');
    } catch (error) {
      console.error('🔍 PropertyDetailNew: Update error', error);
      toast.error('Fehler beim Aktualisieren der Immobilie');
    }
  };

  const handleGlobalEditToggle = () => {
    setGlobalEditMode(!globalEditMode);
  };

  const handleStatusChange = async (newStatus: string) => {
    await handleUpdateProperty({ status: newStatus });
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'contacts', label: 'Kontakte', icon: Users },
    { id: 'portals', label: 'Portale', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ];

  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Lade Immobilie...</p>
        </motion.div>
      </div>
    );
  }

  if (propertyError || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Immobilie nicht gefunden</h2>
          <p className="text-gray-600 mb-6">Die angeforderte Immobilie konnte nicht geladen werden.</p>
          <button
            onClick={() => navigate('/properties')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Zurück zur Übersicht
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-accent-50/30">
      {/* Header mit Glass-Morphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg shadow-primary-500/5"
      >
        <div className="max-w-[95vw] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Zurück Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/properties')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Zurück</span>
            </motion.button>

            {/* Titel */}
            <div className="flex-1 text-center">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-gray-900 mb-1"
              >
                {property.title}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center space-x-2 text-gray-600"
              >
                <MapPin className="w-4 h-4" />
                <span>{property.address?.city}, {property.address?.zip_code}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {property.status}
                </span>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 transition-all duration-200 text-gray-700 hover:text-gray-900 shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span className="font-medium">Bearbeiten</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                <Share2 className="w-4 h-4" />
                <span className="font-medium">Teilen</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-[95vw] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Main Content Area - Breiter */}
          <div className="xl:col-span-4 space-y-8">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <ImageGallery property={property} />
            </motion.div>

            {/* Summary Card mit Glass-Morphism */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-3xl p-8 shadow-2xl shadow-primary-500/10"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
                    <Euro className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    {property.price ? `${property.price.toLocaleString()} €` : 'N/A'}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Kaufpreis</div>
                </div>
                
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-500/25">
                    <Ruler className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    {property.living_area ? `${property.living_area} m²` : 'N/A'}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Wohnfläche</div>
                </div>
                
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-neutral-600 to-neutral-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-neutral-500/25">
                    <Home className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    {property.rooms || 'N/A'}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Zimmer</div>
                </div>
                
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-400/25">
                    <Bed className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    {property.bedrooms || 'N/A'}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">Schlafzimmer</div>
                </div>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-3xl p-3 shadow-2xl shadow-primary-500/10"
            >
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/40'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-3xl p-8 shadow-2xl shadow-primary-500/10"
            >
              <AnimatePresence mode="wait">
                {activeTab === 'details' && (
                  <DetailsTab
                    key="details"
                    property={property}
                    isEditing={isEditing}
                    onUpdate={handleUpdateProperty}
                    globalEditMode={globalEditMode}
                    onGlobalEditToggle={handleGlobalEditToggle}
                  />
                )}
                {activeTab === 'contacts' && (
                  <ContactsTab
                    key="contacts"
                    property={property}
                    onUpdate={handleUpdateProperty}
                  />
                )}
            {activeTab === 'portals' && (
              <PortalExportTab 
                key="portals" 
                property={property} 
                onUpdate={handleUpdateProperty}
              />
            )}
            {activeTab === 'analytics' && (
              <PortalAnalytics 
                key="analytics" 
                property={property} 
              />
            )}
            {activeTab === 'performance' && (
              <PerformanceTab 
                key="performance" 
                property={property} 
                propertyId={property.id}
              />
            )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-24"
            >
              <PropertySidebar
                property={property}
                metrics={metrics}
                onStatusChange={handleStatusChange}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailNew;