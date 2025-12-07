/**
 * LocationTab Component
 * 
 * Displays property location information with Google Maps integration.
 * Shows address details, location description, and interactive map.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ExternalLink, Edit2, Save, X, Car, Train, Plane, ShoppingCart, GraduationCap, TreePine } from 'lucide-react';
import GoogleMapEmbed from '../maps/GoogleMapEmbed';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

interface Property {
  id: string;
  address: {
    street: string;
    house_number: string;
    zip_code: string;
    city: string;
    country: string;
  };
  locationDescription?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationTabProps {
  property: Property;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: (data: Partial<Property>) => void;
  onCancel?: () => void;
}

const LocationTab: React.FC<LocationTabProps> = ({
  property,
  isEditing = false,
  onEdit,
  onSave,
  onCancel
}) => {
  const { settings: googleMapsSettings, isLoading: mapsLoading } = useGoogleMaps();
  const [editingData, setEditingData] = useState({
    locationDescription: property.locationDescription || '',
    address: property.address
  });
  const [locationAdvantages, setLocationAdvantages] = useState({
    transport: [],
    surroundings: []
  });

  // Mock function to get location advantages based on address
  useEffect(() => {
    const fetchLocationAdvantages = async () => {
      // In real implementation, this would call an API with the property address
      // For now, we'll use mock data based on the city
      const city = property.address.city.toLowerCase();
      
      const mockAdvantages = {
        transport: [
          { icon: Train, text: "Öffentliche Verkehrsmittel in der Nähe", distance: "2 min" },
          { icon: Car, text: "Autobahnanschluss", distance: "5 min" },
          { icon: Plane, text: "Flughafen", distance: "30 min" }
        ],
        surroundings: [
          { icon: ShoppingCart, text: "Einkaufszentrum", distance: "10 min" },
          { icon: GraduationCap, text: "Schulen & Kindergärten", distance: "5 min" },
          { icon: TreePine, text: "Park & Grünflächen", distance: "3 min" }
        ]
      };

      // Adjust based on city for more realistic data
      if (city.includes('berlin')) {
        mockAdvantages.transport[2].distance = "45 min"; // Berlin to BER
        mockAdvantages.surroundings[0].distance = "15 min"; // More urban
      } else if (city.includes('münchen') || city.includes('muenchen')) {
        mockAdvantages.transport[2].distance = "25 min"; // Munich to MUC
        mockAdvantages.surroundings[0].distance = "8 min";
      } else if (city.includes('hamburg')) {
        mockAdvantages.transport[2].distance = "35 min"; // Hamburg to HAM
        mockAdvantages.surroundings[0].distance = "12 min";
      }

      setLocationAdvantages(mockAdvantages);
    };

    fetchLocationAdvantages();
  }, [property.address]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        locationDescription: editingData.locationDescription,
        address: editingData.address
      });
    }
  };

  const handleAddressChange = (field: keyof typeof editingData.address, value: string) => {
    setEditingData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const getFullAddress = () => {
    const { street, house_number, zip_code, city, country } = property.address;
    return `${street} ${house_number}, ${zip_code} ${city}, ${country}`;
  };

  const getEditingAddress = () => {
    const { street, house_number, zip_code, city, country } = editingData.address;
    return `${street} ${house_number}, ${zip_code} ${city}, ${country}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lage & Umgebung</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Adresse und Standortdetails</p>
          </div>
        </div>

        {!isEditing && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Bearbeiten
          </button>
        )}

        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              Speichern
            </button>
          </div>
        )}
      </div>

      {/* Address Information */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-500" />
          Adresse
        </h4>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Straße
              </label>
              <input
                type="text"
                value={editingData.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Straßenname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hausnummer
              </label>
              <input
                type="text"
                value={editingData.address.house_number}
                onChange={(e) => handleAddressChange('house_number', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Hausnummer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PLZ
              </label>
              <input
                type="text"
                value={editingData.address.zip_code}
                onChange={(e) => handleAddressChange('zip_code', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Postleitzahl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stadt
              </label>
              <input
                type="text"
                value={editingData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Stadt"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Land
              </label>
              <input
                type="text"
                value={editingData.address.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Land"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {getFullAddress()}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>📍 {property.address.street} {property.address.house_number}</span>
              <span>🏢 {property.address.zip_code} {property.address.city}</span>
              <span>🌍 {property.address.country}</span>
            </div>
          </div>
        )}
      </div>

      {/* Standortvorteile */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Standortvorteile
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Verkehrsanbindung */}
          <div>
            <h5 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-500" />
              Verkehrsanbindung
            </h5>
            <div className="space-y-3">
              {locationAdvantages.transport.map((advantage, index) => {
                const IconComponent = advantage.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {advantage.text}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {advantage.distance}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Umgebung */}
          <div>
            <h5 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Umgebung
            </h5>
            <div className="space-y-3">
              {locationAdvantages.surroundings.map((advantage, index) => {
                const IconComponent = advantage.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {advantage.text}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {advantage.distance}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Google Maps Integration */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            Interaktive Karte
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Standort der Immobilie auf Google Maps
          </p>
        </div>

        <div className="h-96">
          {mapsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : googleMapsSettings?.is_configured ? (
            <GoogleMapEmbed
              address={isEditing ? getEditingAddress() : getFullAddress()}
              coordinates={property.coordinates}
              height="100%"
              showDirections={true}
              showStreetView={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Google Maps nicht konfiguriert
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Bitte konfigurieren Sie den Google Maps API-Schlüssel in den Admin-Einstellungen.
              </p>
              <button
                onClick={() => window.open('https://maps.google.com/?q=' + encodeURIComponent(getFullAddress()), '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                In Google Maps öffnen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Location Description */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Lagebeschreibung
        </h4>

        {isEditing ? (
          <textarea
            value={editingData.locationDescription}
            onChange={(e) => setEditingData(prev => ({ ...prev, locationDescription: e.target.value }))}
            rows={6}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Beschreiben Sie die Lage der Immobilie, Umgebung, Verkehrsanbindung, Einkaufsmöglichkeiten, Schulen, etc."
          />
        ) : (
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {property.locationDescription || 'Keine Lagebeschreibung verfügbar. Klicken Sie auf "Bearbeiten" um eine Beschreibung hinzuzufügen.'}
            </p>
          </div>
        )}
      </div>

      {/* Location Features */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Standortvorteile
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900 dark:text-white">Verkehrsanbindung</h5>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Öffentliche Verkehrsmittel in der Nähe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Autobahnanschluss 5 min</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Flughafen 30 min</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-gray-900 dark:text-white">Umgebung</h5>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Einkaufszentrum 10 min</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Schulen & Kindergärten</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Park & Grünflächen</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationTab;
