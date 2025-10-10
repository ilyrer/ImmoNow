import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProperties } from '../../hooks/useApi';

// Immobiliendaten-Modell
type Property = {
  id: number;
  title: string;
  location: string;
  price: string;
  priceNumber: number;
  status: 'Neu' | 'Zum Verkauf' | 'Reserviert' | 'Verkauft' | 'Inaktiv';
  type: 'Haus' | 'Wohnung' | 'Grundstück' | 'Gewerbe';
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  featured?: boolean;
  createdAt: string;
};

// Live list from backend
const useLiveProperties = () => {
  const { data, isLoading } = useProperties();
  const items = useMemo<Property[]>(() => {
    if (!Array.isArray(data)) return [] as Property[];
    return data.map((p: any) => ({
      id: Number(p.id),
      title: p.title,
      location: p.location,
      price: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.price || 0),
      priceNumber: Number(p.price || 0),
      status: 'Zum Verkauf',
      type: (p.property_type || 'Haus') as any,
      bedrooms: Number(p.bedrooms || p.rooms || 0),
      bathrooms: Number(p.bathrooms || 0),
      area: Number(p.living_area || p.total_area || 0),
      image: Array.isArray(p.images) && p.images[0] ? (p.images[0].url || p.images[0]) : '',
      createdAt: String(p.created_at || ''),
    }));
  }, [data]);
  return { items, isLoading } as const;
};

// Animation Varianten
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

// Component
const PropertyList: React.FC = () => {
  const { items: properties } = useLiveProperties();
  // State
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priceMin: '',
    priceMax: '',
  });
  const [sortBy, setSortBy] = useState('newest');

  // Filter und Sortierung
  const filteredProperties = properties.filter(property => {
    // Suchtexte
    if (searchTerm && !property.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !property.location.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Immobilientyp
    if (filters.type && property.type !== filters.type) {
      return false;
    }
    
    // Status
    if (filters.status && property.status !== filters.status) {
      return false;
    }
    
    // Preisminimum
    if (filters.priceMin && property.priceNumber < parseInt(filters.priceMin)) {
      return false;
    }
    
    // Preismaximum
    if (filters.priceMax && property.priceNumber > parseInt(filters.priceMax)) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'priceAsc':
        return a.priceNumber - b.priceNumber;
      case 'priceDesc':
        return b.priceNumber - a.priceNumber;
      default:
        return 0;
    }
  });

  // Filter-Handler
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Preis-Formatter-Funktion
  const formatPrice = (price: string) => {
    return price;
  };

  // Statusbadge-Funktion
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Neu':
        return 'badge-green';
      case 'Zum Verkauf':
        return 'badge-blue';
      case 'Reserviert':
        return 'badge-amber';
      case 'Verkauft':
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Immobilien</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Verwalten und optimieren Sie Ihre Immobilien</p>
        </div>
        <button className="btn-primary">
          <i className="ri-add-line mr-1.5"></i> Neue Immobilie
        </button>
      </div>

      {/* Suchleiste und Filter */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Suchfeld */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-neutral-400 dark:text-neutral-500"></i>
              </div>
              <input
                type="text"
                placeholder="Suche nach Immobilien..."
                className="input-field pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filter-Gruppe */}
          <div className="flex flex-wrap gap-3">
            {/* Immobilientyp Filter */}
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="input-field py-2 pl-3 pr-8"
            >
              <option value="">Alle Typen</option>
              <option value="Haus">Häuser</option>
              <option value="Wohnung">Wohnungen</option>
              <option value="Grundstück">Grundstücke</option>
              <option value="Gewerbe">Gewerbe</option>
            </select>

            {/* Status Filter */}
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input-field py-2 pl-3 pr-8"
            >
              <option value="">Alle Status</option>
              <option value="Neu">Neu</option>
              <option value="Zum Verkauf">Zum Verkauf</option>
              <option value="Reserviert">Reserviert</option>
              <option value="Verkauft">Verkauft</option>
            </select>

            {/* Sortierung */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field py-2 pl-3 pr-8"
            >
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="priceAsc">Preis aufsteigend</option>
              <option value="priceDesc">Preis absteigend</option>
            </select>

            {/* Layout-Toggle */}
            <div className="flex bg-white dark:bg-dark-300 border border-neutral-200 dark:border-dark-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-2 flex items-center justify-center ${
                  view === 'grid' 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-dark-400'
                }`}
              >
                <i className="ri-layout-grid-line"></i>
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 flex items-center justify-center ${
                  view === 'list' 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-dark-400'
                }`}
              >
                <i className="ri-list-check"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ergebnisse Info */}
      <div className="flex justify-between items-center">
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          {filteredProperties.length} {filteredProperties.length === 1 ? 'Immobilie' : 'Immobilien'} gefunden
        </p>
        {(filters.type || filters.status || filters.priceMin || filters.priceMax || searchTerm) && (
          <button 
            onClick={() => {
              setFilters({ type: '', status: '', priceMin: '', priceMax: '' });
              setSearchTerm('');
            }}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredProperties.map((property) => (
            <motion.div 
              key={property.id} 
              className="card overflow-hidden"
              variants={itemVariants}
            >
              <div className="relative h-48">
                <img 
                  src={property.image} 
                  alt={property.title} 
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">{property.title}</h3>
                  <span className={`badge ${getStatusBadgeClass(property.status)}`}>
                    {property.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                  <i className="ri-map-pin-line mr-1"></i>
                  <span>{property.location}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">{formatPrice(property.price)}</p>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="text-primary-600 dark:text-primary-400 font-medium">{property.type}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-700 pt-3">
                  {property.bedrooms > 0 && (
                    <span className="flex items-center">
                      <i className="ri-hotel-bed-line mr-1"></i> {property.bedrooms}
                    </span>
                  )}
                  {property.bathrooms > 0 && (
                    <span className="flex items-center">
                      <i className="ri-shower-line mr-1"></i> {property.bathrooms}
                    </span>
                  )}
                  <span className="flex items-center">
                    <i className="ri-ruler-line mr-1"></i> {property.area} m²
                  </span>
                </div>
                <div className="mt-4">
                  <Link to={`/properties/${property.id}`} className="btn-secondary w-full">
                    Details ansehen
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* List View */}
      {view === 'list' && (
        <motion.div 
          className="card divide-y divide-neutral-100 dark:divide-neutral-700"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredProperties.map((property) => (
            <motion.div 
              key={property.id} 
              className="flex flex-col sm:flex-row p-4 gap-4"
              variants={itemVariants}
            >
              <div className="sm:w-40 h-32 sm:h-auto rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={property.image} 
                  alt={property.title} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">{property.title}</h3>
                    <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                      <i className="ri-map-pin-line mr-1"></i>
                      <span>{property.location}</span>
                    </div>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(property.status)}`}>
                    {property.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                  {property.bedrooms > 0 && (
                    <span className="flex items-center">
                      <i className="ri-hotel-bed-line mr-1"></i> {property.bedrooms}
                    </span>
                  )}
                  {property.bathrooms > 0 && (
                    <span className="flex items-center">
                      <i className="ri-shower-line mr-1"></i> {property.bathrooms}
                    </span>
                  )}
                  <span className="flex items-center">
                    <i className="ri-ruler-line mr-1"></i> {property.area} m²
                  </span>
                  <span className="flex items-center text-primary-600 dark:text-primary-400 font-medium">
                    {property.type}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">{formatPrice(property.price)}</p>
                  <Link to={`/properties/${property.id}`} className="btn-secondary">
                    Details ansehen
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredProperties.length === 0 && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                <i className="ri-search-line text-2xl text-neutral-400"></i>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">Keine Immobilien gefunden</h3>
              <p className="text-neutral-500 dark:text-neutral-400">Bitte passen Sie Ihre Suchkriterien an</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default PropertyList;
