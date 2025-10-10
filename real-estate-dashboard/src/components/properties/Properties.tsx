import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty } from '../../hooks/useProperties';
import { PropertyResponse as APIProperty } from '../../lib/api/types';
import { Home, Plus, Grid, List, Filter, Bed, Bath, Square, MapPin, Edit, Share, X, Heart, Search, ChevronDown, Wand2, PlusCircle } from 'lucide-react';

// Property interface basierend auf der echten API-Schnittstelle mit erweiterten Feldern
interface Property extends Omit<APIProperty, 'images' | 'type'> {
  // Zusätzliche Felder die möglicherweise vom Backend kommen
  priority?: 'low' | 'medium' | 'high';
  amenities?: string[];
  address?: {
    street: string;
    city: string;
    zip_code: string;
    state: string;
    country: string;
  };
  metrics?: {
    views: number;
    inquiries: number;
    visits: number;
    days_on_market: number;
  };
  areas?: {
    living?: number;
    plot?: number;
    usable?: number;
    balcony?: number;
    garden?: number;
    floors?: number;
  };
  energy_data?: {
    efficiency_class?: string;
    creation_date?: string;
    issue_date?: string;
    valid_until?: string;
    energy_value?: number;
    electricity_value?: number;
    heat_value?: number;
    co2_emissions?: number;
    includes_warm_water?: boolean;
    heating_type?: string;
    primary_energy_source?: string;
    building_year?: string;
    system_year?: string;
    year_unknown?: boolean;
  };
  additional_data?: {
    furnished?: boolean;
    pets_allowed?: boolean;
    smoking_allowed?: boolean;
    wheelchair_accessible?: boolean;
    internet_available?: boolean;
    cable_tv?: boolean;
    air_conditioning?: boolean;
    heating?: string;
    cooling?: string;
    parking?: string;
    laundry?: string;
    storage?: string;
    outdoor_space?: string;
    security?: string[];
    amenities?: string[];
    nearby_amenities?: string[];
    transportation?: string[];
    schools?: string[];
    healthcare?: string[];
    shopping?: string[];
    entertainment?: string[];
  };
  financials?: {
    monthly_rent?: number;
    deposit?: number;
    utilities?: number;
    insurance?: number;
    taxes?: number;
    maintenance?: number;
    hoa_fees?: number;
    total_monthly_cost?: number;
    annual_income?: number;
    annual_expenses?: number;
    net_income?: number;
    roi?: number;
    cap_rate?: number;
    cash_flow?: number;
    appreciation?: number;
    total_return?: number;
  };
  // Legacy fields für Kompatibilität
  type?: string;
  images?: string[] | APIProperty['images'];
  features?: {
    bedrooms?: number;
    bathrooms?: number;
    year_built?: number;
    energy_class?: string;
    heating_type?: string;
    parking_spaces?: number;
    balcony: boolean;
    garden: boolean;
    elevator: boolean;
    area?: string; // Legacy field
  };
  // Additional fields
  is_rented?: boolean;
  available_from?: string;
  condition?: string;
  last_renovation?: string;
  equipment_quality?: string;
  parking_spaces?: number;
  parking_type?: string;
  building_phase?: string;
  travel_times?: {
    public_transport?: number;
    highway?: number;
    airport?: number;
  };
  tags?: string[];
  location_description?: string;
  equipment_description?: string;
  additional_info?: string;
  assigned_agent?: string;
}

const Properties: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProperty, setNewProperty] = useState<any>({
    title: '',
    description: '',
    location: '',
    property_type: 'house',
    status: 'vorbereitung',
    price: undefined,
  price_currency: 'EUR',
  price_type: 'sale',
    living_area: undefined,
  total_area: undefined,
  plot_area: undefined,
    rooms: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    floors: undefined,
    year_built: undefined,
    energy_class: '',
  energy_consumption: undefined,
    heating_type: '',
    amenities: [],
    tags: [],
    coordinates_lat: undefined,
    coordinates_lng: undefined,
    contact_person: { first_name: '', last_name: '', email: '', phone: ''},
    address: { street: '', postal_code: '', city: '', state: '', country: 'Deutschland' },
  });
  const [favorites, setFavorites] = useState<string[]>([]);

  // Simple and robust "Neu" dropdown component with unique key
  const NewPropertyButton: React.FC<{ size?: 'md' | 'lg'; uniqueId: string }> = ({ size = 'md', uniqueId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
    const base = size === 'lg' ? 'px-6 py-3 text-base' : 'px-5 py-2.5 text-sm';
    
    const handleToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`🔄 Button ${uniqueId} clicked! Current state: ${isOpen} -> ${!isOpen}`);
      setIsOpen(prev => {
        console.log(`🔄 State changing from ${prev} to ${!prev}`);
        return !prev;
      });
    };
    
    // Close dropdown when clicking outside
    React.useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        // Prüfe ob das Click-Event auf dem Button selbst oder im Dropdown war
        const target = event.target as Node;
        const isOnButton = buttonRef && buttonRef.contains(target);
        const isOnDropdown = target && (target as Element).closest?.('.dropdown-content');
        
        if (!isOnButton && !isOnDropdown) {
          console.log(`❌ Outside click detected for ${uniqueId}, closing dropdown`);
          setIsOpen(false);
        }
      };

      // Längere Verzögerung, damit der Button-Click erst abgeschlossen wird
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 300);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, buttonRef, uniqueId]);
    
    return (
      <div className="relative inline-block text-left">
        {/* Button */}
        <motion.button
          ref={setButtonRef}
          type="button"
          onClick={handleToggle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`group flex items-center gap-2.5 rounded-2xl ${base} shadow-lg text-white bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <Plus className={`${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} relative z-10`} />
          <span className="font-medium relative z-10">Neu</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className={`${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} opacity-80 relative z-10`} />
          </motion.div>
        </motion.button>

        {/* Dropdown - Portal to body for highest z-index */}
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[99999]" style={{ zIndex: 999999 }}>
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/10"
                onClick={(e) => {
                  // Nur schließen wenn direkt auf den Backdrop geklickt wird
                  if (e.target === e.currentTarget) {
                    console.log(`🎯 Backdrop clicked for ${uniqueId}, closing dropdown`);
                    setIsOpen(false);
                  }
                }}
              />
              
              {/* Dropdown Content - Force visibility */}
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="dropdown-content absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl overflow-hidden w-80 z-[99999]"
                style={{ 
                  position: 'fixed',
                  zIndex: 999999,
                  top: buttonRef ? `${Math.min(buttonRef.getBoundingClientRect().bottom + 8, window.innerHeight - 250)}px` : '100px',
                  left: buttonRef ? `${Math.max(10, buttonRef.getBoundingClientRect().left + buttonRef.getBoundingClientRect().width/2 - 160)}px` : '50%',
                  transform: !buttonRef ? 'translateX(-50%)' : 'none',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  visibility: 'visible',
                  display: 'block'
                }}
              >
                <div className="p-2">
                  <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left px-4 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 flex items-center gap-4 text-sm rounded-xl transition-all duration-200 group"
                    onClick={() => { 
                      console.log(`✅ Schnell anlegen clicked from ${uniqueId}`);
                      setIsCreateModalOpen(true); 
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <PlusCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Schnell anlegen
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Kompaktes Formular für schnelle Erfassung
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg] opacity-0 group-hover:opacity-100 transition-all" />
                  </motion.button>
                  
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent my-2" />
                  
                  <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left px-4 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 flex items-center gap-4 text-sm rounded-xl transition-all duration-200 group"
                    onClick={() => { 
                      console.log(`✅ Wizard clicked from ${uniqueId}`);
                      navigate('/immobilien/neu'); 
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <Wand2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Neuerfassung (Wizard)
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Schrittweise geführte Vollerfassung
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 rotate-[-90deg] opacity-0 group-hover:opacity-100 transition-all" />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Fetch properties using React Query
  const { data: apiProperties = [], isLoading, error } = useProperties({ page: 1, size: 50 });

  // Convert API properties to local interface format mit Fallbacks
  const properties: Property[] = useMemo(() => {
    return apiProperties.map((apiProp: APIProperty): Property => ({
      ...apiProp,
      // Sicherstellen dass alle notwendigen Felder vorhanden sind
      priority: 'medium',
      amenities: [],
      address: {
        street: '',
        city: apiProp.location,
        zip_code: '',
        state: '',
        country: 'Deutschland'
      },
      metrics: {
        views: 0,
        inquiries: 0,
        visits: 0,
        days_on_market: 0
      },
      areas: {
        living: parseFloat((apiProp.features as any)?.area || '0') || 0,
        plot: 0,
        usable: 0,
        balcony: 0,
        garden: 0,
        floors: 0
      },
      tags: [],
      // Images als PropertyImage array behandeln
      images: Array.isArray(apiProp.images)
        ? apiProp.images
        : ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'].map((url, index) => ({
            id: `fallback-${index}`,
            url,
            is_primary: index === 0,
            order: index
          }))
    }));
  }, [apiProperties]);

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties.filter((property: Property) => {
      const matchesSearch = searchTerm === '' || 
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase());
      
  const matchesType = selectedType === 'all' || property.property_type === selectedType || (property as any).type === selectedType;
      const matchesStatus = selectedStatus === 'all' || property.status === selectedStatus;
      
      // Price ist ein number in der API
      const propertyPrice = property.price || 0;
      const matchesPrice = propertyPrice >= priceRange[0] && propertyPrice <= priceRange[1];
      
      return matchesSearch && matchesType && matchesStatus && matchesPrice;
    });

    // Sort properties
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a: Property, b: Property) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a: Property, b: Property) => (b.price || 0) - (a.price || 0));
        break;
      case 'area':
        filtered.sort((a: Property, b: Property) => {
          const aArea = parseFloat((a.features as any)?.area || '0') || 0;
          const bArea = parseFloat((b.features as any)?.area || '0') || 0;
          return bArea - aArea;
        });
        break;
      case 'newest':
      default:
        filtered.sort((a: Property, b: Property) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [properties, searchTerm, selectedType, selectedStatus, priceRange, sortBy]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'aktiv':
        return 'bg-green-100 text-green-800';
      case 'reserviert':
        return 'bg-yellow-100 text-yellow-800';
      case 'verkauft':
        return 'bg-red-100 text-red-800';
      case 'vorbereitung':
        return 'bg-blue-100 text-blue-800';
      case 'zurückgezogen':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aktiv': return 'Aktiv';
      case 'reserviert': return 'Reserviert';
      case 'verkauft': return 'Verkauft';
      case 'vorbereitung': return 'Vorbereitung';
      case 'zurückgezogen': return 'Zurückgezogen';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'house': return 'Haus';
      case 'apartment': return 'Wohnung';
      case 'commercial': return 'Gewerbe';
      case 'land': return 'Grundstück';
      default: return type;
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice === 0) return 'Preis auf Anfrage';
    
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  };

  const toggleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    setFavorites(newFavorites);
  };

  const openEditModal = (property: Property) => {
    // Stelle sicher, dass contact_person initialisiert ist
    const propertyWithContact = {
      ...property,
      contact_person: property.contact_person || {
        name: '',
        phone: '',
        email: ''
      }
    };
    setEditingProperty(propertyWithContact as Property);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingProperty(null);
    setIsEditModalOpen(false);
  };

  const saveProperty = () => {
    if (editingProperty) {
      // Implement saving logic
      closeEditModal();
    }
  };

  const updateEditingProperty = (field: keyof Property, value: any) => {
    if (editingProperty) {
      setEditingProperty({
        ...editingProperty,
        [field]: value
      });
    }
  };

  const updateContactPerson = (field: string, value: string) => {
    if (editingProperty) {
      setEditingProperty({
        ...editingProperty,
        contact_person: {
          id: editingProperty.contact_person?.id || '',
          name: editingProperty.contact_person?.name || '',
          email: editingProperty.contact_person?.email || '',
          phone: editingProperty.contact_person?.phone || '',
          role: editingProperty.contact_person?.role || '',
          ...editingProperty.contact_person,
          [field]: value
        }
      });
    }
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.images?.[0] ? (typeof property.images[0] === 'string' ? property.images[0] : property.images[0]?.url) : 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeStyle(property.status)}`}>
            {getStatusText(property.status)}
          </span>
          <span className="px-3 py-1 text-xs font-semibold bg-black/50 text-white rounded-full">
            {getTypeText(property.property_type)}
          </span>
        </div>
        <button
          onClick={() => toggleFavorite(property.id)}
          className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
        >
          <Heart className={`h-5 w-5 ${favorites.includes(property.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {property.title}
            </h3>
            <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{property.location}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(property.price || 0)}
          </p>
          {property.financials?.monthly_rent && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatPrice(property.financials.monthly_rent)}/Monat
            </p>
          )}
        </div>

        {/* Features */}
        {property.features && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
                <Bed className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{property.features.bedrooms || '0'}</span>
              </div>
              <span className="text-xs text-gray-500">Zimmer</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
                <Bath className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{property.features.bathrooms || '0'}</span>
              </div>
              <span className="text-xs text-gray-500">Bäder</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
                <Square className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{(property.features as any)?.area || '0'}</span>
              </div>
              <span className="text-xs text-gray-500">m²</span>
            </div>
          </div>
        )}

        {/* Tags - Fallback zu Amenities falls keine Tags vorhanden */}
        {((property.tags && property.tags.length > 0) || (property.amenities && property.amenities.length > 0)) && (
          <div className="flex flex-wrap gap-1 mb-4">
            {(property.tags || property.amenities || []).slice(0, 2).map((tag: string, tagIndex: number) => (
              <span
                key={tagIndex}
                className="inline-flex px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 rounded-full"
              >
                {tag}
              </span>
            ))}
            {(property.tags || property.amenities || []).length > 2 && (
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                +{(property.tags || property.amenities || []).length - 2}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/immobilien/${property.id}`)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Details
          </button>
          <button
            onClick={() => openEditModal(property)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Share className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-dark-400 dark:via-dark-500 dark:to-dark-600">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-radial from-accent-400/30 via-primary-500/10 to-transparent rounded-full blur-2xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-radial from-primary-400/25 via-primary-500/10 to-transparent rounded-full blur-2xl" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 ring-1 ring-white/20 backdrop-blur-sm mb-3">Portfolio</div>
                <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white">
                  Immobilien
                </h1>
                <p className="text-white/80 mt-2">
                  {filteredAndSortedProperties.length} von {properties.length} Objekten
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 rounded-xl bg-white/10 text-white backdrop-blur-md hover:bg-white/15 transition-colors ring-1 ring-white/20"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              <NewPropertyButton uniqueId="header-button" />

              <div className="flex bg-white/10 text-white rounded-xl p-1 backdrop-blur-md ring-1 ring-white/20">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/30 text-white shadow' : 'hover:bg-white/10'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white/30 text-white shadow' : 'hover:bg-white/10'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-fit overflow-hidden"
              >
                {/* Filter Content */}
                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Suche
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Titel, Ort oder Beschreibung..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Objekttyp
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">Alle Typen</option>
                      <option value="house">Haus</option>
                      <option value="apartment">Wohnung</option>
                      <option value="commercial">Gewerbe</option>
                      <option value="land">Grundstück</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">Alle Status</option>
                      <option value="vorbereitung">Vorbereitung</option>
                      <option value="aktiv">Aktiv</option>
                      <option value="reserviert">Reserviert</option>
                      <option value="verkauft">Verkauft</option>
                      <option value="zurückgezogen">Zurückgezogen</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preisbereich
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="2000000"
                        step="50000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{formatPrice(priceRange[0])}</span>
                        <span>{formatPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sortierung
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="newest">Neueste zuerst</option>
                      <option value="price-low">Preis aufsteigend</option>
                      <option value="price-high">Preis absteigend</option>
                      <option value="area">Größe absteigend</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Properties Grid/List */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-pulse">
                    <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-t-xl"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">
                  Fehler beim Laden der Immobilien: {error?.message || 'Unbekannter Fehler'}
                </p>
              </div>
            ) : filteredAndSortedProperties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-56 bg-white/70 dark:bg-dark-500/60 rounded-2xl shadow-2xl border border-white/30 dark:border-white/10 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-16 -right-16 w-64 h-64 bg-gradient-radial from-primary-400/20 via-primary-500/10 to-transparent rounded-full blur-2xl" />
                  <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-radial from-accent-400/20 via-accent-500/10 to-transparent rounded-full blur-2xl" />
                </div>
                <div className="mx-auto mb-6 grid place-items-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-200 to-primary-400/60 text-primary-800 dark:text-white ring-1 ring-white/40 grid place-items-center shadow-card">
                    <Home className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-neutral-800 dark:text-white mb-2">
                  Keine Immobilien gefunden
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-6 max-w-xl mx-auto">
                  Passen Sie die Filter an oder legen Sie direkt Ihre erste Immobilie an.
                </p>
                <NewPropertyButton size="lg" uniqueId="empty-state-button" />
              </motion.div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                <AnimatePresence>
                  {filteredAndSortedProperties.map((property: Property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal - Redesigned with beautiful UI */}
      {isEditModalOpen && editingProperty && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden"
          >
            {/* Header with Gradient */}
            <div className="relative px-8 py-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Edit className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Immobilie bearbeiten</h2>
                    <p className="text-white/80 text-sm mt-1">Ändern Sie die Eigenschaften der Immobilie</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeEditModal}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Information */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Home className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grundinformationen</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Titel
                    </label>
                    <input
                      type="text"
                      value={editingProperty.title}
                      onChange={(e) => updateEditingProperty('title', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Standort
                    </label>
                    <input
                      type="text"
                      value={editingProperty.location}
                      onChange={(e) => updateEditingProperty('location', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Typ
                      </label>
                      <select
                        value={(editingProperty as any).property_type || (editingProperty as any).type}
                        onChange={(e) => {
                          updateEditingProperty('type' as any, e.target.value);
                          (editingProperty as any).property_type = e.target.value as any;
                          setEditingProperty({ ...(editingProperty as any) });
                        }}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <option value="house">🏠 Haus</option>
                        <option value="apartment">🏢 Wohnung</option>
                        <option value="commercial">🏬 Gewerbe</option>
                        <option value="land">🌿 Grundstück</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Status
                      </label>
                      <select
                        value={editingProperty.status}
                        onChange={(e) => updateEditingProperty('status', e.target.value as any)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <option value="vorbereitung">📝 Vorbereitung</option>
                        <option value="aktiv">✅ Aktiv</option>
                        <option value="reserviert">📋 Reserviert</option>
                        <option value="verkauft">🎉 Verkauft</option>
                        <option value="zurückgezogen">❌ Zurückgezogen</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Preis (€)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={editingProperty.price}
                        onChange={(e) => updateEditingProperty('price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="450000"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                        €
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Contact Person */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-6 bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ansprechpartner</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingProperty.contact_person?.name || ''}
                      onChange={(e) => updateContactPerson('name', e.target.value)}
                      placeholder="Max Mustermann"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={editingProperty.contact_person?.phone || ''}
                      onChange={(e) => updateContactPerson('phone', e.target.value)}
                      placeholder="+49 123 456789"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={editingProperty.contact_person?.email || ''}
                      onChange={(e) => updateContactPerson('email', e.target.value)}
                      placeholder="max.mustermann@example.com"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Description */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 bg-gradient-to-br from-purple-50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Edit className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Beschreibung</h3>
                </div>
                
                <textarea
                  rows={4}
                  value={editingProperty.description}
                  onChange={(e) => updateEditingProperty('description', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                  placeholder="Beschreibung der Immobilie..."
                />
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200/60 dark:border-gray-700/60"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={closeEditModal}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Abbrechen
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (!editingProperty) return;
                    const id = String(editingProperty.id);
                    const payload: any = {
                      title: editingProperty.title,
                      description: editingProperty.description,
                      status: editingProperty.status,
                      property_type: (editingProperty as any).property_type || (editingProperty as any).type,
                      price: editingProperty.price,
                      location: editingProperty.location,
                      living_area: (editingProperty as any).living_area,
                      rooms: (editingProperty as any).features?.bedrooms,
                      bathrooms: (editingProperty as any).features?.bathrooms,
                      year_built: (editingProperty as any).features?.year_built,
                      address: (editingProperty as any).address,
                    };
                    try {
                      await updateMutation.mutateAsync({ id, payload });
                      closeEditModal();
                    } catch (e) {
                      console.error(e);
                      alert('Fehler beim Speichern. Bitte versuchen Sie es erneut.');
                    }
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <Edit className="h-5 w-5" />
                  Änderungen speichern
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Modal - Redesigned with beautiful UI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden"
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
            }}
          >
            {/* Header with Gradient */}
            <div className="relative px-8 py-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <PlusCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Neue Immobilie</h2>
                    <p className="text-white/80 text-sm mt-1">Schnelle Erfassung der wichtigsten Daten</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </div>

            {/* Form Content with better styling */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
              <div className="space-y-8">
                {/* Grunddaten Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/30"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Home className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grunddaten</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Titel <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newProperty.title}
                          onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          placeholder="z.B. Modernes Einfamilienhaus mit Garten"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Beschreibung
                        </label>
                        <textarea
                          value={newProperty.description}
                          onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                          placeholder="Beschreiben Sie die Besonderheiten der Immobilie..."
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Objekttyp
                          </label>
                          <select
                            value={newProperty.property_type}
                            onChange={(e) => setNewProperty({ ...newProperty, property_type: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <option value="house">🏠 Haus</option>
                            <option value="apartment">🏢 Wohnung</option>
                            <option value="commercial">🏬 Gewerbe</option>
                            <option value="land">🌿 Grundstück</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Status
                          </label>
                          <select
                            value={newProperty.status}
                            onChange={(e) => setNewProperty({ ...newProperty, status: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <option value="vorbereitung">📝 Vorbereitung</option>
                            <option value="aktiv">✅ Aktiv</option>
                            <option value="reserviert">📋 Reserviert</option>
                            <option value="verkauft">🎉 Verkauft</option>
                            <option value="zurückgezogen">❌ Zurückgezogen</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Preis (€)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={newProperty.price ?? ''}
                              onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                              placeholder="450000"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                              €
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Preisart
                          </label>
                          <select
                            value={newProperty.price_type}
                            onChange={(e) => setNewProperty({ ...newProperty, price_type: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <option value="sale">💰 Kaufpreis</option>
                            <option value="rent">🏠 Mietpreis</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Adresse Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Adresse</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Straße & Hausnummer <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newProperty.address.street}
                        onChange={(e) => setNewProperty({ ...newProperty, address: { ...newProperty.address, street: e.target.value } })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="Musterstraße 123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        PLZ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newProperty.address.postal_code}
                        onChange={(e) => setNewProperty({ ...newProperty, address: { ...newProperty.address, postal_code: e.target.value } })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Stadt <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newProperty.address.city}
                        onChange={(e) => setNewProperty({ ...newProperty, address: { ...newProperty.address, city: e.target.value } })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="München"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Bundesland
                      </label>
                      <input
                        type="text"
                        value={newProperty.address.state}
                        onChange={(e) => setNewProperty({ ...newProperty, address: { ...newProperty.address, state: e.target.value } })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="Bayern"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Objektdaten Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <Square className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Objektdaten</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Wohnfläche (m²)
                      </label>
                      <input 
                        type="number" 
                        value={newProperty.living_area ?? ''}
                        onChange={(e)=>setNewProperty({...newProperty, living_area: e.target.value? Number(e.target.value): undefined})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Zimmer
                      </label>
                      <input 
                        type="number" 
                        value={newProperty.rooms ?? ''}
                        onChange={(e)=>setNewProperty({...newProperty, rooms: e.target.value? Number(e.target.value): undefined})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Schlafzimmer
                      </label>
                      <input 
                        type="number" 
                        value={newProperty.bedrooms ?? ''}
                        onChange={(e)=>setNewProperty({...newProperty, bedrooms: e.target.value? Number(e.target.value): undefined})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Bäder
                      </label>
                      <input 
                        type="number" 
                        value={newProperty.bathrooms ?? ''}
                        onChange={(e)=>setNewProperty({...newProperty, bathrooms: e.target.value? Number(e.target.value): undefined})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="2"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Grundstück (m²)
                      </label>
                      <input 
                        type="number" 
                        value={newProperty.plot_area ?? ''}
                        onChange={(e)=>setNewProperty({...newProperty, plot_area: e.target.value? Number(e.target.value): undefined})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Etagen
                      </label>
                      <input 
                        type="number" 
                        value={newProperty.floors ?? ''}
                        onChange={(e)=>setNewProperty({...newProperty, floors: e.target.value? Number(e.target.value): undefined})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Baujahr
                      </label>
                      <input 
                        type="number" 
                        value={newProperty.year_built ?? ''}
                        onChange={(e)=>setNewProperty({...newProperty, year_built: e.target.value? Number(e.target.value): undefined})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Energieklasse
                      </label>
                      <select
                        value={newProperty.energy_class}
                        onChange={(e)=>setNewProperty({...newProperty, energy_class: e.target.value})}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <option value="">Wählen</option>
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
                  </div>
                </motion.div>

                {/* Ansprechpartner Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-orange-50 to-amber-100/50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/30"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ansprechpartner</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Vorname
                        </label>
                        <input 
                          type="text"
                          value={newProperty.contact_person.first_name}
                          onChange={(e)=>setNewProperty({...newProperty, contact_person: {...newProperty.contact_person, first_name: e.target.value}})}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          placeholder="Max"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Nachname
                        </label>
                        <input 
                          type="text"
                          value={newProperty.contact_person.last_name}
                          onChange={(e)=>setNewProperty({...newProperty, contact_person: {...newProperty.contact_person, last_name: e.target.value}})}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          placeholder="Mustermann"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          E-Mail
                        </label>
                        <input 
                          type="email"
                          value={newProperty.contact_person.email}
                          onChange={(e)=>setNewProperty({...newProperty, contact_person: {...newProperty.contact_person, email: e.target.value}})}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          placeholder="max@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Telefon
                        </label>
                        <input 
                          type="tel"
                          value={newProperty.contact_person.phone}
                          onChange={(e)=>setNewProperty({...newProperty, contact_person: {...newProperty.contact_person, phone: e.target.value}})}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                          placeholder="+49 123 456789"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200/60 dark:border-gray-700/60"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Abbrechen
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    // Enhanced validation with user feedback
                    const requiredFields = [] as string[];
                    if (!newProperty.title || newProperty.title.trim().length < 5) requiredFields.push('Titel (min. 5 Zeichen)');
                    if (!newProperty.property_type) requiredFields.push('Objekttyp');
                    if (!newProperty.address.street || newProperty.address.street.trim().length < 2) requiredFields.push('Straße');
                    if (!newProperty.address.postal_code || newProperty.address.postal_code.trim().length < 3) requiredFields.push('PLZ');
                    if (!newProperty.address.city || newProperty.address.city.trim().length < 2) requiredFields.push('Stadt');
                    
                    if (requiredFields.length > 0) {
                      alert(`Bitte füllen Sie folgende Pflichtfelder aus:\n- ${requiredFields.join('\n- ')}`);
                      return;
                    }
                    
                    try {
                      const created = await createMutation.mutateAsync({
                        ...newProperty,
                        // backend requires a location string; use city as canonical value
                        location: newProperty.location && newProperty.location.trim().length >= 3
                          ? newProperty.location.trim()
                          : String(newProperty.address.city || '').trim(),
                      } as any);
                      setIsCreateModalOpen(false);
                      setNewProperty({
                        title: '',
                        description: '',
                        location: '',
                        property_type: 'house',
                        status: 'vorbereitung',
                        price: undefined,
                        price_currency: 'EUR',
                        price_type: 'sale',
                        living_area: undefined,
                        total_area: undefined,
                        plot_area: undefined,
                        rooms: undefined,
                        bedrooms: undefined,
                        bathrooms: undefined,
                        floors: undefined,
                        year_built: undefined,
                        energy_class: '',
                        energy_consumption: undefined,
                        heating_type: '',
                        amenities: [],
                        tags: [],
                        coordinates_lat: undefined,
                        coordinates_lng: undefined,
                        contact_person: { first_name: '', last_name: '', email: '', phone: ''},
                        address: { street: '', postal_code: '', city: '', state: '', country: 'Deutschland' },
                      });
                      navigate(`/immobilien/${created.id}`);
                    } catch (e) {
                      console.error(e);
                      alert('Fehler beim Erstellen der Immobilie. Bitte versuchen Sie es erneut.');
                    }
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <PlusCircle className="h-5 w-5" />
                  Immobilie erstellen
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Properties; 
 
