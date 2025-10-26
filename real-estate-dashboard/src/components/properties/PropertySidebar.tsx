import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Euro, TrendingUp, Calendar, Clock, Eye, MessageSquare, 
  Car, Flame, Building2, Ruler, Bed, Bath, Zap,
  CheckCircle, AlertCircle, Clock as ClockIcon, XCircle, ChevronDown
} from 'lucide-react';
import { PropertyResponse, PropertyMetrics } from '../../types/property';
import { 
  getPropertyStatusLabel, 
  getPropertyStatusColor,
  getConditionStatusLabel, 
  getParkingTypeLabel 
} from '../../types/property';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';

interface PropertySidebarProps {
  property: PropertyResponse;
  metrics?: PropertyMetrics;
  onStatusChange: (newStatus: string) => Promise<void>;
}

const PropertySidebar: React.FC<PropertySidebarProps> = ({ 
  property, 
  metrics, 
  onStatusChange 
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const sections = [
    { id: 'overview', label: 'Übersicht', icon: Building2 },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ];

  const statusOptions = [
    { value: 'vorbereitung', label: 'Vorbereitung', icon: ClockIcon, color: 'text-gray-500' },
    { value: 'aktiv', label: 'Aktiv', icon: CheckCircle, color: 'text-green-500' },
    { value: 'reserviert', label: 'Reserviert', icon: AlertCircle, color: 'text-yellow-500' },
    { value: 'verkauft', label: 'Verkauft', icon: CheckCircle, color: 'text-blue-500' },
    { value: 'zurückgezogen', label: 'Zurückgezogen', icon: XCircle, color: 'text-red-500' },
  ];

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === property.status) return;
    
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(newStatus);
      toast.success('Status erfolgreich aktualisiert');
      setShowStatusDropdown(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Fehler beim Aktualisieren des Status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getCurrentStatusOption = () => {
    return statusOptions.find(option => option.value === property.status) || statusOptions[0];
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleDropdownToggle = () => {
    if (!showStatusDropdown) {
      updateDropdownPosition();
    }
    setShowStatusDropdown(!showStatusDropdown);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (showStatusDropdown) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (showStatusDropdown) {
        updateDropdownPosition();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown]);

  return (
    <div className="space-y-6">
      {/* Kaufpreis Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-xl bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500/20 rounded-2xl p-6 shadow-xl shadow-blue-500/25"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Euro className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Kaufpreis</h3>
            <p className="text-blue-100 text-sm">Sofort verfügbar</p>
          </div>
        </div>
        
        <div className="text-3xl font-bold text-white mb-2">
          {property.price ? `${property.price.toLocaleString()} €` : 'N/A'}
        </div>
        
        <div className="flex items-center space-x-2 text-blue-100">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm">Marktkonform</span>
        </div>
      </motion.div>

      {/* Status Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-6 shadow-xl shadow-blue-500/10"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status</h3>
        </div>
        
        <div className="relative z-50">
          <motion.button
            ref={buttonRef}
            onClick={handleDropdownToggle}
            disabled={isUpdatingStatus}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
              isUpdatingStatus 
                ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' 
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
            } border-gray-200 dark:border-gray-600`}
          >
            <div className="flex items-center space-x-3">
              {React.createElement(getCurrentStatusOption().icon, {
                className: `w-5 h-5 ${getCurrentStatusOption().color}`
              })}
              <span className="font-medium text-gray-900 dark:text-white">
                {getCurrentStatusOption().label}
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              showStatusDropdown ? 'rotate-180' : ''
            }`} />
          </motion.button>
          
          {showStatusDropdown && createPortal(
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'absolute',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                zIndex: 9999
              }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl"
            >
              {statusOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = option.value === property.status;
                
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={isUpdatingStatus}
                    className={`w-full flex items-center space-x-3 p-4 text-left transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${option.color}`} />
                    <span className="font-medium">{option.label}</span>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-auto" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>,
            document.body
          )}
        </div>
        
        {isUpdatingStatus && (
          <div className="mt-4 flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Status wird aktualisiert...</span>
          </div>
        )}
      </motion.div>

      {/* Objekt-Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-6 shadow-xl shadow-blue-500/10"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Objekt-Details</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Ruler className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Wohnfläche</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold">
              {property.living_area ? `${property.living_area} m²` : 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Zimmer</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold">
              {property.rooms || 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Bed className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Schlafzimmer</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold">
              {property.bedrooms || 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Bath className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Badezimmer</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold">
              {property.bathrooms || 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Baujahr</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold">
              {property.year_built || 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Energieklasse</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold">
              {property.energy_class || 'N/A'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Performance Card */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-6 shadow-xl shadow-blue-500/10"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Aufrufe</span>
              </div>
              <span className="text-gray-900 dark:text-white font-semibold">
                {metrics.views || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Anfragen</span>
              </div>
              <span className="text-gray-900 dark:text-white font-semibold">
                {metrics.inquiries || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Besichtigungen</span>
              </div>
              <span className="text-gray-900 dark:text-white font-semibold">
                {(metrics as any).showings || 0}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PropertySidebar;