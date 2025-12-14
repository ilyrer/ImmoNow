/**
 * Step 1: Location - Professional address input with dynamic autocomplete from API
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Search, CheckCircle2 } from 'lucide-react';
import { AvmRequest, GeoLocation, POI } from '../../../types/avm';
import { locationService } from '../../../services/location';
import { LocationSearchResult } from '../../../types/location';

interface Props {
  formData: Partial<AvmRequest>;
  geoData: GeoLocation | null;
  nearbyPois: POI[];
  validationErrors: Record<string, string>;
  onUpdate: (updates: Partial<AvmRequest>) => void;
  onGeoDataUpdate: (geoData: GeoLocation | null, pois: POI[]) => void;
}

const Step1Location: React.FC<Props> = ({
  formData,
  geoData,
  nearbyPois,
  validationErrors,
  onUpdate,
}) => {
  const [citySearch, setCitySearch] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<LocationSearchResult[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Autocomplete für Städtesuche - API-basiert
  useEffect(() => {
    const searchCitiesAPI = async () => {
      if (citySearch.length > 0) {
        setIsLoadingCities(true);
        try {
          const results = await locationService.searchLocations(citySearch, 10);
          setFilteredLocations(results);
        } catch (error) {
          console.error('Error searching cities:', error);
          setFilteredLocations([]);
        } finally {
          setIsLoadingCities(false);
        }
      } else if (showCitySuggestions) {
        // Show popular cities when focused but no input
        setIsLoadingCities(true);
        try {
          const results = await locationService.searchLocations('', 10);
          setFilteredLocations(results);
        } catch (error) {
          console.error('Error loading cities:', error);
          setFilteredLocations([]);
        } finally {
          setIsLoadingCities(false);
        }
      }
    };

    const debounceTimer = setTimeout(searchCitiesAPI, 300);
    return () => clearTimeout(debounceTimer);
  }, [citySearch, showCitySuggestions]);

  // PLZ → Stadt Auto-Fill - API-basiert
  useEffect(() => {
    const fetchCityByPostalCode = async () => {
      if (formData.postal_code && formData.postal_code.length >= 3) {
        try {
          const location = await locationService.getLocationByPostalCode(formData.postal_code);
          if (location && formData.city !== location.city) {
            onUpdate({ city: location.city });
          }
        } catch (error) {
          console.error('Error fetching city by postal code:', error);
        }
      }
    };

    const debounceTimer = setTimeout(fetchCityByPostalCode, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.postal_code]);

  const handleCitySelect = (location: LocationSearchResult) => {
    onUpdate({
      city: location.city,
      postal_code: location.postal_code_start || formData.postal_code
    });
    setCitySearch('');
    setShowCitySuggestions(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-white mb-2 font-heading">
          Standort
        </h2>
        <p className="text-[#3A3A3C] dark:text-gray-400">
          Geben Sie die Adresse der Immobilie ein
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* City - Professionelle Auswahl */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#1C1C1E] dark:text-gray-300 mb-2">
            <Search className="inline w-4 h-4 mr-1" />
            Stadt *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.city || citySearch}
              onChange={(e) => {
                const value = e.target.value;
                setCitySearch(value);
                onUpdate({ city: value });
                setShowCitySuggestions(true);
              }}
              onFocus={() => setShowCitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
              className={`
                w-full px-4 py-3 rounded-[16px] border transition-all duration-200
                ${validationErrors.city
                  ? 'border-apple-red focus:ring-apple-red'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-apple-blue'
                }
                bg-white/80 dark:bg-[#1C1C1E]/80 text-[#1C1C1E] dark:text-white
                focus:ring-2 focus:outline-none backdrop-blur-xl
              `}
              placeholder="z.B. München, Berlin, Hamburg..."
            />

            {/* Autocomplete Dropdown */}
            {showCitySuggestions && (
              <div className="absolute z-50 w-full mt-2 backdrop-blur-xl bg-white/95 dark:bg-[#1C1C1E]/95 rounded-[16px] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.16)] max-h-64 overflow-y-auto">
                {isLoadingCities ? (
                  <div className="px-4 py-3 text-center text-gray-500">
                    Lade Städte...
                  </div>
                ) : filteredLocations.length > 0 ? (
                  filteredLocations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => handleCitySelect(location)}
                      className="w-full text-left px-4 py-3 hover:bg-apple-blue/10 transition-colors flex items-center gap-3 first:rounded-t-[16px] last:rounded-b-[16px]"
                    >
                      <MapPin className="w-4 h-4 text-apple-blue flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-[#1C1C1E] dark:text-white font-medium">
                          {location.city}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {location.state && `${location.state} • `}
                          {location.postal_code_start && `PLZ ${location.postal_code_start} • `}
                          €{location.base_price_per_sqm}/m²
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500">
                    Keine Städte gefunden. Sie können trotzdem einen Namen eingeben.
                  </div>
                )}
              </div>
            )}

            {formData.city && !showCitySuggestions && (
              <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-apple-green w-5 h-5" />
            )}
          </div>
          {validationErrors.city && (
            <p className="mt-2 text-sm text-apple-red">{validationErrors.city}</p>
          )}
        </div>

        {/* Postal Code */}
        <div>
          <label className="block text-sm font-medium text-[#1C1C1E] dark:text-gray-300 mb-2">
            Postleitzahl *
          </label>
          <input
            type="text"
            value={formData.postal_code || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
              onUpdate({ postal_code: value });
            }}
            className={`
              w-full px-4 py-3 rounded-[16px] border transition-all duration-200
              ${validationErrors.postal_code
                ? 'border-apple-red focus:ring-apple-red'
                : 'border-gray-300 dark:border-gray-600 focus:ring-apple-blue'
              }
              bg-white/80 dark:bg-[#1C1C1E]/80 text-[#1C1C1E] dark:text-white
              focus:ring-2 focus:outline-none backdrop-blur-xl
            `}
            placeholder="z.B. 80331"
            maxLength={5}
          />
          {validationErrors.postal_code && (
            <p className="mt-2 text-sm text-apple-red">{validationErrors.postal_code}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-[#1C1C1E] dark:text-gray-300 mb-2">
            Straße und Hausnummer *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => onUpdate({ address: e.target.value })}
              className={`
                w-full pl-11 pr-4 py-3 rounded-[16px] border transition-all duration-200
                ${validationErrors.address
                  ? 'border-apple-red focus:ring-apple-red'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-apple-blue'
                }
                bg-white/80 dark:bg-[#1C1C1E]/80 text-[#1C1C1E] dark:text-white
                focus:ring-2 focus:outline-none backdrop-blur-xl
              `}
              placeholder="z.B. Hauptstraße 1"
            />
          </div>
          {validationErrors.address && (
            <p className="mt-2 text-sm text-apple-red">{validationErrors.address}</p>
          )}
        </div>
      </div>

      {/* Location Found Success */}
      {geoData && (
        <div className="backdrop-blur-xl bg-apple-green/10 dark:bg-apple-green/20 border border-apple-green/20 rounded-[16px] p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-apple-green/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-apple-green" />
            </div>
            <div>
              <h3 className="font-semibold text-apple-green mb-1">
                Standort gefunden
              </h3>
              <p className="text-sm text-[#1C1C1E] dark:text-gray-300">
                {geoData.displayName}
              </p>
              {geoData.walkabilityScore && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-apple-green to-accent-500 rounded-full transition-all duration-500"
                      style={{ width: `${geoData.walkabilityScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-apple-green">
                    {geoData.walkabilityScore}/100
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Placeholder */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-primary-100/30 to-accent-100/30 dark:from-primary-900/20 dark:to-accent-900/20 rounded-[20px] h-64 flex items-center justify-center border border-white/20 dark:border-white/10">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-[20px] bg-gradient-to-br from-apple-blue/20 to-primary-600/20 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-apple-blue" />
          </div>
          <p className="text-[#3A3A3C] dark:text-gray-400 font-medium">
            Karte wird nach Geocodierung angezeigt
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            OpenStreetMap Integration
          </p>
        </div>
      </div>

      {/* Nearby POIs */}
      {nearbyPois.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#1C1C1E] dark:text-white mb-3">
            Umgebung
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {nearbyPois.slice(0, 4).map((poi, idx) => (
              <div
                key={idx}
                className="backdrop-blur-xl bg-white/60 dark:bg-[#1C1C1E]/60 rounded-[12px] p-3 border border-white/20 dark:border-white/10"
              >
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {poi.type}
                </p>
                <p className="text-sm font-semibold text-[#1C1C1E] dark:text-white truncate">
                  {poi.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(poi.distanceM / 1000 * 10) / 10} km
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1Location;
