import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QUERY_KEYS } from '../../hooks/useApi';
import { useProperty, usePropertyMetrics, propertyKeys, useUpdateProperty } from '../../hooks/useProperties';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UpdatePropertyPayload } from '../../types/property';
import {
  ArrowLeft, Edit2, Save, X, MapPin, Euro, Home, Calendar,
  TrendingUp, Eye, MessageSquare, Users, Clock, Tag, Star,
  Building2, Ruler, Bed, Bath, Car, Zap, Flame, Download,
  FileText, Share2, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Import specialized tab components
import ExposeTab from './ExposeTab';
import PublishTab from './PublishTab';
import EnergyEfficiencyTab from './EnergyEfficiencyTab';
import LocationTab from './LocationTab';
import MediaManager from './MediaManager';
import PerformanceTab from './PerformanceTab';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: 'house' | 'apartment' | 'commercial';
  status: 'aktiv' | 'verkauft' | 'reserviert' | 'akquise' | 'vorbereitung' | 'zurückgezogen';
  features: {
    bedrooms: string;
    bathrooms: string;
    area: string;
    yearBuilt: string;
    parking: string;
    energyClass: string;
    heatingType: string;
    floor: string;
  };
  amenities: string[];
  images: string[];
  contactPerson: {
    name: string;
    phone: string;
    email: string;
  };
  address: {
    street: string;
    house_number: string;
    zip_code: string;
    city: string;
    country: string;
  };
  financials: {
    purchasePrice: number;
    additionalCosts: number;
    monthlyRent?: number;
    yield?: number;
  };
  metrics: {
    views: number;
    inquiries: number;
    visits: number;
    daysOnMarket: number;
  };
  lastUpdated: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  locationDescription?: string;
  equipmentDescription?: string;
  additionalInfo?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  areas?: {
    living?: number;
    plot?: number;
    usable?: number;
    balcony?: number;
    garden?: number;
    floors?: number;
  };
  buildYear?: number;
  energyClass?: {
    efficiency?: string;
    energyValue?: number;
    co2Emissions?: number;
    validUntil?: string;
    certificateType?: string;
    heatingType?: string;
  };
}

const PropertyDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ✅ Backend-Integration: Echte Property-Daten + Metrics
  const { data: apiProperty, isLoading } = useProperty(id || '');
  const { data: metrics, isLoading: metricsLoading } = usePropertyMetrics(id || '');
  const updateMutation = useUpdateProperty();

  // State Management
  const [property, setProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tab Configuration - Professional & Compact
  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: Home },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'features', label: 'Ausstattung', icon: Settings },
    { id: 'location', label: 'Lage', icon: MapPin },
    { id: 'energy', label: 'Energie', icon: Zap },
    { id: 'media', label: 'Medien', icon: Building2 },
    { id: 'expose', label: 'Exposé', icon: Download },
    { id: 'publish', label: 'Portale', icon: Share2 },
    { id: 'performance', label: 'Analytics', icon: TrendingUp },
  ];

  // Map API property to UI property
  useEffect(() => {
    if (!apiProperty) return;

    const p = apiProperty as any;
    const mapped: Property = {
      id: p.id || '',
      title: p.title || p.titel || '',
      description: p.description || p.beschreibung || '',
      price: p.price || p.kaufpreis || 0,
      location: p.location || `${p.plz || ''} ${p.ort || ''}`.trim(),
      type: p.property_type === 'apartment' || p.objektart === 'Wohnung' ? 'apartment' :
        p.property_type === 'house' || p.objektart === 'Haus' ? 'house' : 'commercial',
      status: mapStatus(p.status),
      features: {
        bedrooms: (p.rooms || p.anzahl_zimmer)?.toString() || '0',
        bathrooms: (p.bathrooms || p.anzahl_badezimmer)?.toString() || '0',
        area: (p.living_area || p.wohnflaeche)?.toString() || '0',
        yearBuilt: (p.year_built || p.baujahr)?.toString() || '',
        parking: p.anzahl_parkplaetze?.toString() || '0',
        energyClass: p.energieeffizienzklasse || '',
        heatingType: p.heizungsart || '',
        floor: p.etage?.toString() || '',
      },
      amenities: [],
      images: p.images?.map((img: any) => img.url) || p.bilder || [],
      contactPerson: {
        name: p.contact_person?.name || p.ansprechpartner || '',
        phone: p.contact_person?.phone || p.telefon || '',
        email: p.contact_person?.email || p.email || '',
      },
      address: {
        street: p.address?.street || p.strasse || '',
        house_number: p.address?.house_number || p.hausnummer || '',
        zip_code: p.address?.zip_code || p.plz || '',
        city: p.address?.city || p.ort || '',
        country: p.address?.country || 'Deutschland',
      },
      financials: {
        purchasePrice: p.price || 0,
        additionalCosts: p.nebenkosten || 0,
        monthlyRent: p.kaltmiete,
        yield: p.rendite,
      },
      metrics: {
        views: metrics?.views || 0,
        inquiries: metrics?.inquiries || 0,
        visits: metrics?.visits || 0,
        daysOnMarket: metrics?.daysOnMarket || 0,
      },
      lastUpdated: p.updated_at || new Date().toISOString(),
      priority: 'medium',
      tags: [],
      locationDescription: p.lagebeschreibung,
      equipmentDescription: p.ausstattung,
      additionalInfo: p.sonstiges,
      coordinates: p.coordinates || (p.latitude && p.longitude ? { lat: p.latitude, lng: p.longitude } : undefined),
      areas: {
        living: p.wohnflaeche,
        plot: p.grundstuecksflaeche,
        usable: p.nutzflaeche,
      },
      buildYear: p.baujahr,
      energyClass: {
        efficiency: p.energieeffizienzklasse,
        energyValue: p.endenergiebedarf,
        co2Emissions: p.co2_emissionen,
        validUntil: p.energieausweis_gueltig_bis,
        certificateType: p.energieausweis_typ,
        heatingType: p.heizungsart,
      },
    };

    setProperty(mapped);
  }, [apiProperty, metrics]); // ✅ Re-run when metrics change

  // Helper: Map API status to UI status (now uses backend values directly)
  const mapStatus = (status?: string): Property['status'] => {
    switch (status) {
      case 'aktiv': return 'aktiv';
      case 'verkauft': return 'verkauft';
      case 'reserviert': return 'reserviert';
      case 'vorbereitung': return 'vorbereitung';
      case 'akquise': return 'akquise';
      case 'zurückgezogen': return 'zurückgezogen';
      default: return 'vorbereitung';
    }
  };

  // Helper: Get status styling (using backend status values)
  const getStatusStyle = (status: string) => {
    const styles = {
      aktiv: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
      verkauft: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
      reserviert: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      akquise: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      vorbereitung: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      zurückgezogen: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
    };
    return styles[status as keyof typeof styles] || styles.vorbereitung;
  };

  // Handle Edit Mode
  const handleEdit = () => {
    setIsEditing(true);
    setEditingProperty(property);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingProperty(null);
  };

  const handleSave = async () => {
    if (!editingProperty) return;

    setIsSaving(true);
    try {
      // Map UI structure to API structure
      const apiStatus = mapStatusToApi(editingProperty.status);
      const apiType = editingProperty.type === 'apartment' ? 'apartment' :
        editingProperty.type === 'house' ? 'house' : 'commercial';

      // Sammle alle Werte aus editingProperty
      const bedroomsValue = editingProperty.features?.bedrooms
        ? Number(editingProperty.features.bedrooms)
        : undefined;
      const bathroomsValue = editingProperty.features?.bathrooms
        ? Number(editingProperty.features.bathrooms)
        : undefined;
      const energyClassValue = editingProperty.energyClass?.efficiency || undefined;
      const heatingTypeValue = editingProperty.features?.heatingType || undefined;
      const yearBuiltValue = editingProperty.buildYear
        ? Number(editingProperty.buildYear)
        : undefined;
      const livingAreaValue = editingProperty.areas?.living || editingProperty.features?.area || undefined;
      const floorsValue = editingProperty.features?.floor ? Number(editingProperty.features.floor) : undefined;

      // Build API payload - flache Felder für Property Model
      const payload: any = {
        title: editingProperty.title,
        description: editingProperty.description,
        status: apiStatus,
        property_type: apiType,
        price: editingProperty.price,
        location: editingProperty.address?.city || editingProperty.location,
      };

      // Flache Felder setzen
      if (livingAreaValue !== undefined && livingAreaValue !== null) {
        payload.living_area = Number(livingAreaValue);
      }
      if (editingProperty.areas?.plot) {
        payload.plot_area = editingProperty.areas.plot;
      }
      if (editingProperty.areas?.usable) {
        payload.total_area = editingProperty.areas.usable;
      }
      if (editingProperty.features?.bedrooms) {
        payload.rooms = Number(editingProperty.features.bedrooms);
      }
      if (bathroomsValue !== undefined && bathroomsValue !== null) {
        payload.bathrooms = Number(bathroomsValue);
      }
      if (bedroomsValue !== undefined && bedroomsValue !== null) {
        payload.bedrooms = Number(bedroomsValue);
      }
      if (floorsValue !== undefined && floorsValue !== null) {
        payload.floors = Number(floorsValue);
      }
      if (heatingTypeValue) {
        payload.heating_type = heatingTypeValue;
      }
      if (energyClassValue) {
        payload.energy_class = energyClassValue;
      }
      if (yearBuiltValue) {
        payload.year_built = Number(yearBuiltValue);
      }

      // Features Objekt für PropertyFeatures Model
      payload.features = {
        bedrooms: bedroomsValue || null,
        bathrooms: bathroomsValue || null,
        year_built: yearBuiltValue || null,
        energy_class: energyClassValue || null,
        heating_type: heatingTypeValue || null,
        parking_spaces: editingProperty.features?.parking ? Number(editingProperty.features.parking) : null,
        balcony: false,
        garden: false,
        elevator: false,
      };

      // Map address
      if (editingProperty.address) {
        payload.address = {
          street: editingProperty.address.street || '',
          city: editingProperty.address.city || '',
          zip_code: editingProperty.address.zip_code || '',
          postal_code: editingProperty.address.zip_code || '',
          country: editingProperty.address.country || 'Deutschland',
        };
      }

      // Map location description and additional info
      if (editingProperty.locationDescription) {
        payload.location_description = editingProperty.locationDescription;
      }
      if (editingProperty.equipmentDescription) {
        payload.equipment_description = editingProperty.equipmentDescription;
      }
      if (editingProperty.additionalInfo) {
        payload.additional_info = editingProperty.additionalInfo;
      }

      // Führe Update aus
      await updateMutation.mutateAsync({
        id: editingProperty.id,
        payload: payload as UpdatePropertyPayload,
      });

      // Warte kurz, damit die Query-Invalidierung wirkt
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refetch die Property-Daten um sicherzustellen, dass wir die neuesten Daten haben
      await queryClient.refetchQueries({ queryKey: propertyKeys.detail(editingProperty.id) });

      setIsEditing(false);
      setEditingProperty(null);
      toast.success('Immobilie erfolgreich aktualisiert!');
    } catch (error) {
      console.error('❌ Save error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: Map UI status to API status (now direct mapping - same values)
  const mapStatusToApi = (status: Property['status']): string => {
    // Status values are now the same as backend
    return status || 'vorbereitung';
  };

  // Update editing property helper
  const updateEditingProperty = (field: string, value: any) => {
    if (!editingProperty) return;

    const fields = field.split('.');
    const updated = { ...editingProperty };
    let current: any = updated;

    for (let i = 0; i < fields.length - 1; i++) {
      current[fields[i]] = { ...current[fields[i]] };
      current = current[fields[i]];
    }

    current[fields[fields.length - 1]] = value;
    setEditingProperty(updated);
  };

  // Image Navigation
  const handlePrevImage = () => {
    if (!property) return;
    setSelectedImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!property) return;
    setSelectedImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  // ✅ Performance Chart Data vom Backend
  const performanceData: Array<{ date: string; views: number; inquiries: number; visits: number }> =
    metrics?.chartData?.map(item => ({
      date: new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      views: item.views,
      inquiries: item.inquiries,
      visits: item.visits,
    })) || [];

  if (isLoading || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Immobilie wird geladen...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/properties')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Zurück</span>
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {property.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  {property.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isEditing ? (
                <select
                  value={editingProperty?.status || property.status}
                  onChange={(e) => updateEditingProperty('status', e.target.value)}
                  className="px-4 py-2 rounded-lg font-semibold bg-white dark:bg-gray-700 border-2 border-blue-500 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="akquise">Akquise</option>
                  <option value="vorbereitung">Vorbereitung</option>
                  <option value="aktiv">Aktiv</option>
                  <option value="reserviert">Reserviert</option>
                  <option value="verkauft">Verkauft</option>
                  <option value="zurückgezogen">Zurückgezogen</option>
                </select>
              ) : (
                <span className={`px-4 py-2 rounded-lg font-semibold ${getStatusStyle(property.status)}`}>
                  {property.status === 'aktiv' && 'Aktiv'}
                  {property.status === 'verkauft' && 'Verkauft'}
                  {property.status === 'reserviert' && 'Reserviert'}
                  {property.status === 'akquise' && 'Akquise'}
                  {property.status === 'vorbereitung' && 'Vorbereitung'}
                  {property.status === 'zurückgezogen' && 'Zurückgezogen'}
                </span>
              )}

              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Speichern...' : 'Speichern'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Bearbeiten
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Column: Image Gallery & Tabs */}
          <div className="xl:col-span-3 space-y-6">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="relative aspect-video bg-gray-900">
                {property.images.length > 0 ? (
                  <>
                    <img
                      src={property.images[selectedImageIndex]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Navigation Arrows */}
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                        >
                          <ChevronLeft className="w-7 h-7" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                        >
                          <ChevronRight className="w-7 h-7" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                      {selectedImageIndex + 1} / {property.images.length}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-24 h-24 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {property.images.length > 1 && (
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex gap-3 overflow-x-auto">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${idx === selectedImageIndex
                        ? 'border-blue-500 ring-2 ring-blue-500/30 scale-105'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:scale-105'
                        }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Tab Navigation - Professional & Compact */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Objektübersicht
                    </h3>

                    {/* Basic Info - Editable */}
                    {isEditing && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Titel
                          </label>
                          <input
                            type="text"
                            value={editingProperty?.title || ''}
                            onChange={(e) => updateEditingProperty('title', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Objektart
                          </label>
                          <select
                            value={editingProperty?.type || 'house'}
                            onChange={(e) => updateEditingProperty('type', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="apartment">Wohnung</option>
                            <option value="house">Haus</option>
                            <option value="commercial">Gewerbe</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all">
                        <Euro className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-3" />
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingProperty?.price || ''}
                            onChange={(e) => updateEditingProperty('price', Number(e.target.value))}
                            className="w-full text-2xl font-bold bg-transparent border-b border-blue-300 dark:border-blue-600 text-gray-900 dark:text-white mb-1 focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {property.price.toLocaleString('de-DE')} €
                          </div>
                        )}
                        <div className="text-sm text-gray-500 dark:text-gray-400">Kaufpreis</div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all">
                        <Ruler className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-3" />
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingProperty?.features?.area || ''}
                            onChange={(e) => updateEditingProperty('features.area', e.target.value)}
                            className="w-full text-2xl font-bold bg-transparent border-b border-purple-300 dark:border-purple-600 text-gray-900 dark:text-white mb-1 focus:outline-none focus:border-purple-500"
                          />
                        ) : (
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {property.features.area} m²
                          </div>
                        )}
                        <div className="text-sm text-gray-500 dark:text-gray-400">Wohnfläche</div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-700 hover:shadow-lg transition-all">
                        <Bed className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-3" />
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingProperty?.features?.bedrooms || ''}
                            onChange={(e) => updateEditingProperty('features.bedrooms', e.target.value)}
                            className="w-full text-2xl font-bold bg-transparent border-b border-emerald-300 dark:border-emerald-600 text-gray-900 dark:text-white mb-1 focus:outline-none focus:border-emerald-500"
                          />
                        ) : (
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {property.features.bedrooms}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 dark:text-gray-400">Zimmer</div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all">
                        <Bath className="w-10 h-10 text-orange-600 dark:text-orange-400 mb-3" />
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingProperty?.features?.bathrooms || ''}
                            onChange={(e) => updateEditingProperty('features.bathrooms', e.target.value)}
                            className="w-full text-2xl font-bold bg-transparent border-b border-orange-300 dark:border-orange-600 text-gray-900 dark:text-white mb-1 focus:outline-none focus:border-orange-500"
                          />
                        ) : (
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {property.features.bathrooms}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 dark:text-gray-400">Badezimmer</div>
                      </div>
                    </div>

                    {/* Additional Fields in Edit Mode */}
                    {isEditing && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Gesamtfläche (m²)
                          </label>
                          <input
                            type="number"
                            value={editingProperty?.areas?.living || ''}
                            onChange={(e) => updateEditingProperty('areas.living', Number(e.target.value))}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Grundstücksfläche (m²)
                          </label>
                          <input
                            type="number"
                            value={editingProperty?.areas?.plot || ''}
                            onChange={(e) => updateEditingProperty('areas.plot', Number(e.target.value))}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Baujahr
                          </label>
                          <input
                            type="number"
                            value={editingProperty?.buildYear || ''}
                            onChange={(e) => updateEditingProperty('buildYear', Number(e.target.value))}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Energieklasse
                          </label>
                          <select
                            value={editingProperty?.energyClass?.efficiency || ''}
                            onChange={(e) => updateEditingProperty('energyClass.efficiency', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Nicht angegeben</option>
                            <option value="A+">A+</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                            <option value="F">F</option>
                            <option value="G">G</option>
                            <option value="H">H</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Heizungsart
                          </label>
                          <input
                            type="text"
                            value={editingProperty?.features?.heatingType || ''}
                            onChange={(e) => updateEditingProperty('features.heatingType', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="z.B. Gas, Öl, Wärmepumpe"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Etagen
                          </label>
                          <input
                            type="number"
                            value={editingProperty?.features?.floor || ''}
                            onChange={(e) => updateEditingProperty('features.floor', e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Beschreibung</h4>
                      {isEditing ? (
                        <textarea
                          value={editingProperty?.description || ''}
                          onChange={(e) => updateEditingProperty('description', e.target.value)}
                          rows={8}
                          className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base leading-relaxed"
                        />
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {property.description || 'Keine Beschreibung verfügbar'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Objektdetails
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[
                        { label: 'Objektart', value: property.type === 'apartment' ? 'Wohnung' : property.type === 'house' ? 'Haus' : 'Gewerbe', icon: Building2 },
                        { label: 'Baujahr', value: property.features.yearBuilt || 'Nicht angegeben', icon: Calendar },
                        { label: 'Etage', value: property.features.floor || 'Nicht angegeben', icon: Building2 },
                        { label: 'Parkplätze', value: property.features.parking || '0', icon: Car },
                        { label: 'Heizungsart', value: property.features.heatingType || 'Nicht angegeben', icon: Flame },
                        { label: 'Energieklasse', value: property.features.energyClass || 'Nicht angegeben', icon: Zap },
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div key={idx} className="p-5 bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{item.label}</div>
                                <div className="text-base font-semibold text-gray-900 dark:text-white">{item.value}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Areas */}
                    {property.areas && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Flächen</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {property.areas.living && (
                            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Wohnfläche</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{property.areas.living} m²</div>
                            </div>
                          )}
                          {property.areas.plot && (
                            <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Grundstück</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{property.areas.plot} m²</div>
                            </div>
                          )}
                          {property.areas.usable && (
                            <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Nutzfläche</div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{property.areas.usable} m²</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Features Tab */}
                {activeTab === 'features' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Ausstattung & Beschreibung
                    </h3>

                    {/* Equipment Description */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Ausstattungsbeschreibung</h4>
                      {isEditing ? (
                        <textarea
                          value={editingProperty?.equipmentDescription || ''}
                          onChange={(e) => updateEditingProperty('equipmentDescription', e.target.value)}
                          rows={6}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Beschreiben Sie die Ausstattung..."
                        />
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {property.equipmentDescription || 'Keine Ausstattungsbeschreibung verfügbar'}
                        </p>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Sonstige Angaben</h4>
                      {isEditing ? (
                        <textarea
                          value={editingProperty?.additionalInfo || ''}
                          onChange={(e) => updateEditingProperty('additionalInfo', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Weitere Informationen..."
                        />
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {property.additionalInfo || 'Keine weiteren Angaben verfügbar'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                  <MediaManager
                    propertyId={property.id}
                    images={property.images || []}
                    documents={[]}
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: propertyKeys.detail(property.id) })}
                  />
                )}

                {/* Energy Tab */}
                {activeTab === 'energy' && (
                  <EnergyEfficiencyTab property={property} />
                )}

                {/* Location Tab */}
                {activeTab === 'location' && (
                  <LocationTab
                    property={property}
                    isEditing={isEditing}
                    onEdit={() => setIsEditing(true)}
                    onSave={(data) => {
                      // Update property with new location data
                      const updatedProperty = { ...property, ...data };
                      setProperty(updatedProperty);
                      setIsEditing(false);
                      // Here you would typically call an API to save the changes
                      toast.success('Lageinformationen erfolgreich gespeichert!');
                    }}
                    onCancel={() => {
                      setIsEditing(false);
                      setEditingProperty(null);
                    }}
                  />
                )}

                {/* Expose Tab */}
                {activeTab === 'expose' && (
                  <ExposeTab propertyId={property.id} />
                )}

                {/* Publish Tab */}
                {activeTab === 'publish' && (
                  <PublishTab propertyId={property.id} property={property} />
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && (
                  <PerformanceTab propertyId={property.id} property={property} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-8">
            {/* Financial Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Euro className="w-6 h-6 text-blue-500" />
                Finanzen
              </h3>

              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Kaufpreis</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {property.financials.purchasePrice.toLocaleString('de-DE')} €
                  </div>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Nebenkosten</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                    {property.financials.additionalCosts.toLocaleString('de-DE')} €
                  </div>
                </div>

                {property.financials.monthlyRent && (
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Monatliche Miete</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                      {property.financials.monthlyRent.toLocaleString('de-DE')} €
                    </div>
                  </div>
                )}

                {property.financials.yield && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Rendite</div>
                    <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                      {property.financials.yield}%
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Contact Person */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Ansprechpartner
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {property.contactPerson.name || 'Nicht angegeben'}
                  </div>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Telefon</div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {property.contactPerson.phone || 'Nicht angegeben'}
                  </div>
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">E-Mail</div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white break-all">
                    {property.contactPerson.email || 'Nicht angegeben'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Aktionen
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('expose')}
                  className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl transition-all hover:shadow-xl"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-semibold">Exposé erstellen</span>
                </button>

                <button
                  onClick={() => setActiveTab('publish')}
                  className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all hover:shadow-xl"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-semibold">Veröffentlichen</span>
                </button>

                <button className="w-full flex items-center gap-3 px-5 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl transition-all hover:shadow-lg">
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">Dokumente</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
